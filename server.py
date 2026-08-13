#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import json
import urllib.request

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not '.' in os.path.basename(self.path):
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
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
    print(f"🍹 Versátil - Web server running on http://0.0.0.0:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
