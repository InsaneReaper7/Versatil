# 🍹 Verstail - Web

**"Tu bebida. Tu mezcla. Tu estilo."**

Verstail is a modern, mobile-first web ordering platform for specialty beverages and desserts (Mega Té, Té, Batidas, Yogurt, Galletas, Donas). It features an interactive step-by-step beverage customizer (**"Crear Mi Mezcla"**), **WhatsApp Order Forwarding Integration**, and a complete **Admin Portal** with Public Price vs. Internal Cost isolation.

---

## 🌟 Key Features

1. **Mobile-First Experience**: Touch-friendly interface, sticky header navigation, mobile hamburger drawer, and sticky bottom cart bar (`🛒 Ver Carrito`).
2. **"Crear Mi Mezcla" 5-Step Builder**: Step-by-step wizard to build custom beverages (Base -> Size -> Flavors -> Extras -> Preview).
3. **Original vs. Personaliza Choices**: Customers can choose to order standard recipes or customize ingredients and extra add-ons.
4. **WhatsApp Order Forwarding**: Submitting an order formats all itemized details in Spanish and launches direct `https://wa.me/` links.
5. **No Public Prices by Default**: All products default to `showPublicPrice: false` (displaying *"Precio disponible al ordenar"*). Public prices can be toggled `ON` anytime from the Admin Portal.
6. **Admin Portal (`/admin` or `#admin`)**:
   - Manage Products (Create, edit, upload/paste product image URLs, update Public Price vs Internal Cost).
   - Manage Ingredients, Categories, and Orders.
   - Configure target WhatsApp phone number under Store Settings.

---

## 🚀 Step 1: Push to GitHub (`Versatil`)

To create and push this repository to GitHub:

### Option A: Using GitHub Web + Git CLI

1. Go to [GitHub.com](https://github.com/new) and create a **New Repository**.
2. Name the repository: **`Versatil`** (or `Verstail-Web`).
3. Leave it empty (do NOT check "Add a README" or ".gitignore").
4. Copy your repository URL (e.g. `https://github.com/YOUR_USERNAME/Versatil.git`).
5. Open your terminal in this project folder (`c:\Users\insan\.gemini\antigravity\scratch\Verstail - Web`) and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Versatil.git
git branch -M main
git push -u origin main
```

---

## 🚆 Step 2: Deploy to Railway for Customer Live Testing

Railway allows instant deployment directly from your GitHub repository:

1. Log in to [Railway.app](https://railway.app/).
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"**.
4. Choose the **`Versatil`** repository you just pushed.
5. Railway will automatically detect `railway.json` / `Dockerfile` / `Procfile` and start building your deployment automatically!
6. Once deployed, click on your service in Railway, go to **Settings** -> **Networking** -> **Generate Domain**.
7. Share the generated public link (e.g. `https://versatil-production.up.railway.app`) with your customer for live testing!

---

## 🛠️ Local Development & Testing

To test locally on your machine using Python:

```bash
python server.py
```

Then open `http://localhost:8080` in your web browser.
