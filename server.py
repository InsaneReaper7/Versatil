#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import json
import urllib.request
import base64
import time

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, "data")
UPLOADS_DIR = os.path.join(DIRECTORY, "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

DB_FILE = os.path.join(DATA_DIR, "db.json")

def fetch_cloud_db_data(bin_id="", api_key="", kv_url="", kv_token=""):
    bin_id = bin_id or os.environ.get("JSONBIN_BIN_ID", "")
    api_key = api_key or os.environ.get("JSONBIN_API_KEY", "")
    if bin_id:
        try:
            url = f"https://api.jsonbin.io/v3/b/{bin_id.strip()}/latest"
            headers = {'User-Agent': 'Mozilla/5.0'}
            if api_key:
                headers['X-Master-Key'] = api_key.strip()
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                res_json = json.loads(resp.read().decode('utf-8'))
                record = res_json.get('record', res_json)
                if record and isinstance(record, dict) and ('products' in record or 'categories' in record):
                    return record
        except Exception as e:
            print(f"[Cloud DB Fetch Error]: {e}")

    kv_url = kv_url or os.environ.get("UPSTASH_REDIS_REST_URL", "")
    kv_token = kv_token or os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")
    if kv_url and kv_token:
        try:
            url = f"{kv_url.rstrip('/')}/get/verstail_db"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {kv_token.strip()}"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                res_json = json.loads(resp.read().decode('utf-8'))
                result = res_json.get('result')
                if result:
                    parsed = json.loads(result)
                    if parsed and isinstance(parsed, dict) and ('products' in parsed or 'categories' in parsed):
                        return parsed
        except Exception as e:
            print(f"[Upstash KV Fetch Error]: {e}")
    return None

def save_cloud_db_data(data_dict, bin_id="", api_key="", kv_url="", kv_token=""):
    bin_id = bin_id or os.environ.get("JSONBIN_BIN_ID", "")
    api_key = api_key or os.environ.get("JSONBIN_API_KEY", "")
    if bin_id:
        try:
            url = f"https://api.jsonbin.io/v3/b/{bin_id.strip()}"
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
            if api_key:
                headers['X-Master-Key'] = api_key.strip()
            req = urllib.request.Request(url, data=json.dumps(data_dict).encode('utf-8'), headers=headers, method='PUT')
            with urllib.request.urlopen(req, timeout=10) as resp:
                pass
        except Exception as e:
            print(f"[Cloud DB Save Error]: {e}")

    kv_url = kv_url or os.environ.get("UPSTASH_REDIS_REST_URL", "")
    kv_token = kv_token or os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")
    if kv_url and kv_token:
        try:
            url = f"{kv_url.rstrip('/')}/set/verstail_db"
            req = urllib.request.Request(url, data=json.dumps(data_dict).encode('utf-8'), headers={
                "Authorization": f"Bearer {kv_token.strip()}",
                "Content-Type": "application/json"
            }, method='POST')
            with urllib.request.urlopen(req, timeout=10) as resp:
                pass
        except Exception as e:
            print(f"[Upstash KV Save Error]: {e}")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Serve global store data from db.json & Cloud DB
        if self.path == '/api/data':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            # 1. Attempt Cloud DB Fetch for multi-device live sync
            cloud_data = fetch_cloud_db_data()
            if cloud_data:
                self.wfile.write(json.dumps(cloud_data).encode('utf-8'))
                try:
                    with open(DB_FILE, 'w', encoding='utf-8') as f:
                        f.write(json.dumps(cloud_data))
                except Exception:
                    pass
                return

            # 2. Local Disk Fallback
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, 'r', encoding='utf-8') as f:
                        self.wfile.write(f.read().encode('utf-8'))
                        return
                except Exception as e:
                    print(f"Error reading DB: {e}")
            self.wfile.write(json.dumps({}).encode('utf-8'))
            return

        path = self.translate_path(self.path)
        if not os.path.exists(path) and not '.' in os.path.basename(self.path):
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        # Upload Image File to Project Uploads Folder / Cloudinary CDN
        if self.path == '/api/upload-image':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                img_data = payload.get('imageBase64', '')
                cloud_name = payload.get('cloudName') or os.environ.get('CLOUDINARY_CLOUD_NAME', '')
                upload_preset = payload.get('uploadPreset') or os.environ.get('CLOUDINARY_UPLOAD_PRESET', '')

                # 1. Attempt Cloudinary Permanent Upload if configured
                if cloud_name and upload_preset:
                    try:
                        import urllib.parse
                        c_url = f"https://api.cloudinary.com/v1_1/{cloud_name.strip()}/image/upload"
                        post_fields = {
                            'file': img_data,
                            'upload_preset': upload_preset.strip()
                        }
                        encoded_data = urllib.parse.urlencode(post_fields).encode('utf-8')
                        req = urllib.request.Request(c_url, data=encoded_data, method='POST')
                        with urllib.request.urlopen(req, timeout=15) as resp:
                            res_json = json.loads(resp.read().decode('utf-8'))
                            secure_url = res_json.get('secure_url')
                            if secure_url:
                                self.send_response(200)
                                self.send_header('Content-Type', 'application/json')
                                self.end_headers()
                                self.wfile.write(json.dumps({"success": True, "url": secure_url, "provider": "cloudinary"}).encode('utf-8'))
                                return
                    except Exception as c_err:
                        print(f"[Cloudinary Upload Error]: {c_err}")

                # 2. Local File System Fallback
                if ',' in img_data:
                    header, b64_str = img_data.split(',', 1)
                else:
                    b64_str = img_data

                img_bytes = base64.b64decode(b64_str)
                filename = f"img_{int(time.time()*1000)}.jpg"
                filepath = os.path.join(UPLOADS_DIR, filename)

                with open(filepath, 'wb') as f:
                    f.write(img_bytes)

                public_url = f"uploads/{filename}"
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "url": public_url, "provider": "local"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Save Store Data to Global db.json & Cloud DB
        if self.path == '/api/data':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data_dict = json.loads(post_data.decode('utf-8'))
                with open(DB_FILE, 'w', encoding='utf-8') as f:
                    f.write(json.dumps(data_dict))

                settings = data_dict.get('settings', {})
                bin_id = settings.get('jsonbinBinId', '')
                api_key = settings.get('jsonbinApiKey', '')
                kv_url = settings.get('upstashRestUrl', '')
                kv_token = settings.get('upstashRestToken', '')

                save_cloud_db_data(data_dict, bin_id=bin_id, api_key=api_key, kv_url=kv_url, kv_token=kv_token)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if self.path == '/api/send-whatsapp':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                order = data.get('order', {})
                settings = data.get('settings', {})
                message_text = data.get('messageText', '')
                
                phone_id = settings.get('metaPhoneId') or os.environ.get('META_PHONE_ID', '')
                api_token = settings.get('metaApiToken') or os.environ.get('META_API_TOKEN', '')
                callmebot_key = settings.get('callMeBotApiKey') or os.environ.get('CALLMEBOT_API_KEY', '')
                target_phone = settings.get('whatsappPhone', '19393120599').replace('+', '').replace('-', '').replace(' ', '')

                # 1. CallMeBot Server-Side Relay
                if callmebot_key and callmebot_key.strip():
                    import urllib.parse
                    target_phone_clean = target_phone if target_phone.startswith('+') else f"+{target_phone}"
                    encoded_msg = urllib.parse.quote(message_text)
                    callmebot_url = f"https://api.callmebot.com/whatsapp.php?phone={target_phone_clean}&text={encoded_msg}&apikey={callmebot_key.strip()}"
                    
                    req = urllib.request.Request(callmebot_url, headers={'User-Agent': 'Mozilla/5.0'})
                    try:
                        with urllib.request.urlopen(req, timeout=10) as resp:
                            res_body = resp.read().decode('utf-8')
                            self.send_response(200)
                            self.send_header('Content-Type', 'application/json')
                            self.end_headers()
                            self.wfile.write(json.dumps({"status": "sent", "provider": "callmebot", "response": res_body}).encode('utf-8'))
                            return
                    except Exception as cmb_err:
                        print(f"[CallMeBot Relay Error]: {cmb_err}")
                
                # 2. Meta WhatsApp Cloud API
                if phone_id and api_token:
                    req = urllib.request.Request(
                        f"https://graph.facebook.com/v18.0/{phone_id}/messages",
                        data=json.dumps({
                            "messaging_product": "whatsapp",
                            "to": target_phone,
                            "type": "text",
                            "text": {"body": message_text}
                        }).encode('utf-8'),
                        headers={
                            "Authorization": f"Bearer {api_token}",
                            "Content-Type": "application/json"
                        },
                        method="POST"
                    )
                    with urllib.request.urlopen(req) as resp:
                        res_body = resp.read().decode('utf-8')
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(res_body.encode('utf-8'))
                        return
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "received"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Versatil - Web server running on http://0.0.0.0:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
