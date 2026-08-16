/* ==========================================================================
   VERSTAIL - WEB: CENTRALIZED STORE & PERSISTENCE ENGINE
   Handles Products, Ingredients, Categories, Orders, Settings & Pricing Rules
   ========================================================================== */

const STORAGE_KEYS = {
  PRODUCTS: 'verstail_products_v1',
  INGREDIENTS: 'verstail_ingredients_v1',
  CATEGORIES: 'verstail_categories_v1',
  SETTINGS: 'verstail_settings_v1',
  CART: 'verstail_cart_v1',
  ORDERS: 'verstail_orders_v1'
};

const ADMIN_ACCOUNTS = [
  { username: 'Tibu', password: 'P@ssword1' },
  { username: 'InsaneReaper7', password: 'Un3xpected1!' }
];

// Initial Seed Data
const INITIAL_CATEGORIES = [
  { id: 'te', name: 'Té', icon: '🍵', image: '', active: true, order: 1 },
  { id: 'mega-te', name: 'Mega Té', icon: '🧋', image: '', active: true, order: 2 },
  { id: 'versa-to-go', name: 'Versa To Go', icon: '🥤', image: '', active: true, order: 3 },
  { id: 'batidas', name: 'Batidas', icon: '🥤', image: '', active: true, order: 4 },
  { id: 'yogurt', name: 'Yogurt', icon: '🍓', image: '', active: true, order: 5 },
  { id: 'galletas', name: 'Galletas', icon: '🍪', image: '', active: true, order: 6 },
  { id: 'donas', name: 'Donas', icon: '🍩', active: true, order: 7 }
];

const MEGA_TE_FLAVORS = [
  'Fresas', 'Parcha', 'Melón', 'Limón', 'Pitaya', 'Guayaba', 'Papaya', 
  'Piña', 'Mango', 'Uva', 'Blue Blast', 'Green Apple', 'Blueberries', 
  'Cherry', 'Fruit Punch', 'Cranberry', 'Strawberry Kiwi', 'Coco', 'All Berries'
];

const INITIAL_FLAVORS = [
  ...MEGA_TE_FLAVORS,
  'Raspberry', 'Peach', 'Jamaica', 'Aloe Cranberry', 'Mandarin',
  'Dulce de Leche', 'Praline', 'Cookies & Cream', 'Protein', 'Chocolate', 'Vainilla'
];

const INITIAL_INGREDIENTS = [
  { id: 'ing-te', name: 'Té Concentrado', description: 'Infusión herbal revitalizante', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-aloe', name: 'Aloe Vera', description: 'Aloe digestivo y refrescante', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-liftoff', name: 'Lift Off', description: 'Chispa energizante de efervescencia', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-fresas', name: 'Fresas Frescas', description: 'Trozos de fresa natural', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-guineo', name: 'Guineo Sliced', description: 'Rodajas de guineo fresco', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-blueberries', name: 'Blueberries', description: 'Arándanos antioxidantes', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-granola', name: 'Granola Crunch', description: 'Granola crujiente horneada', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-fibra', name: 'Fibra Activa', description: 'Complemento de fibra digestiva', extraCost: 1.50, active: true, includedByDefault: false, removable: true, customerVisible: true },
  { id: 'ing-probiotico', name: 'Probiótico Boost', description: 'Cultivos probióticos para salud intestinal', extraCost: 1.50, active: true, includedByDefault: false, removable: true, customerVisible: true },
  { id: 'ing-agave', name: 'Miel de Agave', description: 'Dulzura natural de agave', extraCost: 0.75, active: true, includedByDefault: false, removable: true, customerVisible: true }
];

// Seed Products (default showPublicPrice: false per user requirement)
const INITIAL_PRODUCTS = [
  {
    id: 'prod-mega-te-01',
    name: 'Mega Té',
    slug: 'mega-te',
    category: 'mega-te',
    description: 'Nuestra bebida energizante de 32 oz con infusión de Té, Aloe y Lift Off. Crea tu combinación eligiendo hasta 3 frutas.',
    image: '',
    baseIngredients: ['Té Concentrado', 'Aloe Vera', 'Lift Off'],
    availableIngredients: ['Fibra Activa', 'Probiótico Boost'],
    sizes: ['32 oz'],
    flavors: MEGA_TE_FLAVORS,
    extras: ['Fibra Activa', 'Probiótico Boost'],
    publicPrice: 8.00,
    internalCost: 2.50,
    showPublicPrice: false,
    active: true,
    featured: true
  },
  {
    id: 'prod-versa-to-go-01',
    name: 'Versa To Go',
    slug: 'versa-to-go',
    category: 'versa-to-go',
    description: 'Nuestra versión To Go de 16 oz con infusión de Té, Aloe y Lift Off. Crea tu combinación eligiendo hasta 3 frutas.',
    image: '',
    baseIngredients: ['Té Concentrado', 'Aloe Vera', 'Lift Off'],
    availableIngredients: ['Fibra Activa', 'Probiótico Boost'],
    sizes: ['16 oz'],
    flavors: MEGA_TE_FLAVORS,
    extras: ['Fibra Activa', 'Probiótico Boost'],
    publicPrice: 6.00,
    internalCost: 2.00,
    showPublicPrice: false,
    active: true,
    featured: true
  },
  {
    id: 'prod-te-01',
    name: 'Té Herbal Herbalife',
    slug: 'te-herbal',
    category: 'te',
    description: 'Deliciosa bebida concentrada de té para acelerar el metabolismo y mantenerte activo.',
    image: '',
    baseIngredients: ['Té Concentrado'],
    availableIngredients: ['Fibra Activa', 'Probiótico Boost'],
    sizes: ['16 oz', '24 oz'],
    flavors: ['Raspberry', 'Peach', 'Lemon', 'Jamaica', 'Aloe Cranberry', 'Mandarin', 'Mango'],
    extras: ['Fibra Activa', 'Probiótico Boost'],
    publicPrice: 5.00,
    internalCost: 1.40,
    showPublicPrice: false,
    active: true,
    featured: true
  },
  {
    id: 'prod-batida-01',
    name: 'Batida Proteica Gourmet',
    slug: 'batida-proteica-gourmet',
    category: 'batidas',
    description: 'Cremosa batida nutricional cargada de proteína, perfecta para reemplazo de comida o snack pos-entreno.',
    image: '',
    baseIngredients: ['Proteína Nutricional'],
    availableIngredients: ['Té Concentrado', 'Aloe Vera', 'Probiótico Boost'],
    sizes: ['16 oz', '24 oz'],
    flavors: ['Dulce de Leche', 'Praline', 'Cookies & Cream', 'Protein', 'Chocolate', 'Vainilla'],
    extras: ['Té Concentrado', 'Aloe Vera', 'Probiótico Boost'],
    publicPrice: 7.50,
    internalCost: 2.20,
    showPublicPrice: false,
    active: true,
    featured: true
  },
  {
    id: 'prod-yogurt-01',
    name: 'Yogurt Bowl 16oz',
    slug: 'yogurt-bowl',
    category: 'yogurt',
    description: 'Yogurt cremoso acompañado de Fresas, Guineo, Blueberries y Granola crujiente.',
    image: '',
    baseIngredients: ['Yogurt Cremoso', 'Fresas Frescas', 'Guineo Sliced', 'Blueberries', 'Granola Crunch'],
    availableIngredients: ['Miel de Agave'],
    sizes: ['16 oz'],
    flavors: ['Dulce de Leche', 'Cookies & Cream', 'Praline'],
    extras: ['Miel de Agave'],
    publicPrice: 6.50,
    internalCost: 2.00,
    showPublicPrice: false,
    active: true,
    featured: true
  },
  {
    id: 'prod-galleta-01',
    name: 'Galleta Artesanal Nutritiva',
    slug: 'galleta-artesanal',
    category: 'galletas',
    description: 'Crujiente galleta recién horneada alta en proteína y baja en calorías.',
    image: '',
    baseIngredients: ['Mezcla Proteica Horneada'],
    availableIngredients: [],
    sizes: ['Unidad'],
    flavors: ['Choco Chip', 'Avellana'],
    extras: [],
    publicPrice: 3.50,
    internalCost: 1.10,
    showPublicPrice: false,
    active: true,
    featured: false
  },
  {
    id: 'prod-dona-01',
    name: 'Dona Fit Especial',
    slug: 'dona-fit-especial',
    category: 'donas',
    description: 'Esponjosa dona artesanal glaseada, libre de culpas.',
    image: '',
    baseIngredients: ['Maza Fit'],
    availableIngredients: [],
    sizes: ['Unidad', 'Caja de 4'],
    flavors: ['Chocolate Glaze', 'Vainilla Berry'],
    extras: [],
    publicPrice: 4.00,
    internalCost: 1.25,
    showPublicPrice: false,
    active: true,
    featured: false
  }
];

const INITIAL_SETTINGS = {
  whatsappPhone: '19393120599', // Client WhatsApp: 939-312-0599
  storeName: 'Versátil',
  tagline: 'Energía que transforma',
  verse: 'Jeremías 29:11',
  deliveryText: 'Delivery Incluido',
  currency: '$',
  deliveryFee: 0.00,
  pickupAddress: 'Versátil Specialty Hub, PR',
  businessHours: 'Lun - Sáb: 7:00 AM - 6:00 PM',
  showCategoryFilterPills: false // Disabled by default per user preference
};

// Store Engine Class
class Store {
  constructor() {
    this.products = this.load(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.ingredients = this.load(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS);
    this.categories = this.load(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.settings = this.load(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.cart = this.load(STORAGE_KEYS.CART, []);
    this.orders = this.load(STORAGE_KEYS.ORDERS, []);
    this.listeners = [];

    this.syncDefaults();
    this.fetchServerData();
  }

  async fetchServerData() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data && data.products && data.products.length > 0) {
          this.products = data.products;
          this.categories = data.categories || this.categories;
          this.ingredients = data.ingredients || this.ingredients;
          this.settings = data.settings || this.settings;
          this.orders = data.orders || this.orders;

          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
          localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(this.ingredients));
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));

          this.notify();
        }
      }
    } catch (e) {
      console.log('Offline/Local mode fallback:', e);
    }
  }

  syncWithServer() {
    try {
      const state = {
        products: this.products,
        categories: this.categories,
        ingredients: this.ingredients,
        settings: this.settings,
        orders: this.orders
      };
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).catch(() => {});
    } catch (e) {}
  }

  syncDefaults() {
    let updated = false;
    INITIAL_CATEGORIES.forEach(initCat => {
      if (!this.categories.some(c => c.id === initCat.id)) {
        this.categories.push(initCat);
        updated = true;
      }
    });
    INITIAL_PRODUCTS.forEach(initProd => {
      if (!this.products.some(p => p.id === initProd.id)) {
        this.products.push(initProd);
        updated = true;
      }
    });
    if (updated) {
      this.save(STORAGE_KEYS.CATEGORIES, this.categories);
      this.save(STORAGE_KEYS.PRODUCTS, this.products);
    }
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notify();
      this.syncWithServer();
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  // --- PRODUCTS ---
  getProducts() {
    return this.products;
  }

  getActiveProducts() {
    return this.products.filter(p => p.active);
  }

  getProductBySlug(slug) {
    return this.products.find(p => p.slug === slug || p.id === slug);
  }

  toggleProductActive(id) {
    const p = this.products.find(prod => prod.id === id);
    if (p) {
      p.active = !p.active;
      this.save(STORAGE_KEYS.PRODUCTS, this.products);
    }
  }

  toggleProductSoldOut(id) {
    const p = this.products.find(prod => prod.id === id);
    if (p) {
      p.soldOut = !p.soldOut;
      this.save(STORAGE_KEYS.PRODUCTS, this.products);
    }
  }

  saveProduct(product) {
    if (!product.id) {
      product.id = 'prod-' + Date.now();
      product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      this.products.push(product);
    } else {
      const idx = this.products.findIndex(p => p.id === product.id);
      if (idx !== -1) this.products[idx] = product;
    }
    this.save(STORAGE_KEYS.PRODUCTS, this.products);
  }

  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    this.save(STORAGE_KEYS.PRODUCTS, this.products);
  }

  // --- INGREDIENTS & CATEGORIES ---
  getIngredients() { return this.ingredients; }
  saveIngredient(ing) {
    if (!ing.id) ing.id = 'ing-' + Date.now();
    const idx = this.ingredients.findIndex(i => i.id === ing.id);
    if (idx !== -1) this.ingredients[idx] = ing;
    else this.ingredients.push(ing);
    this.save(STORAGE_KEYS.INGREDIENTS, this.ingredients);
  }

  getCategories() {
    return this.categories.filter(c => c.id !== 'custom-mix');
  }
  saveCategory(cat) {
    if (!cat.id) cat.id = 'cat-' + Date.now();
    const idx = this.categories.findIndex(c => c.id === cat.id);
    if (idx !== -1) this.categories[idx] = cat;
    else this.categories.push(cat);
    this.save(STORAGE_KEYS.CATEGORIES, this.categories);
  }

  toggleCategoryActive(id) {
    const c = this.categories.find(cat => cat.id === id);
    if (c) {
      c.active = !c.active;
      this.save(STORAGE_KEYS.CATEGORIES, this.categories);
    }
  }

  toggleCategoryFilterPillsSetting() {
    this.settings.showCategoryFilterPills = !this.settings.showCategoryFilterPills;
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
  }

  // --- CART ENGINE ---
  getCart() { return this.cart; }
  addToCart(item) {
    // Generate unique instance ID for configured items
    item.cartId = 'cart-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    this.cart.push(item);
    this.save(STORAGE_KEYS.CART, this.cart);
  }

  updateCartQty(cartId, qty) {
    if (qty <= 0) {
      this.removeFromCart(cartId);
    } else {
      const item = this.cart.find(i => i.cartId === cartId);
      if (item) item.quantity = qty;
      this.save(STORAGE_KEYS.CART, this.cart);
    }
  }

  removeFromCart(cartId) {
    this.cart = this.cart.filter(i => i.cartId !== cartId);
    this.save(STORAGE_KEYS.CART, this.cart);
  }

  clearCart() {
    this.cart = [];
    this.save(STORAGE_KEYS.CART, this.cart);
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => {
      const price = item.showPublicPrice ? (item.unitPrice || 0) : 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
  }

  // --- ORDERS ---
  getOrders() { return this.orders; }
  addOrder(order) {
    order.id = 'V-' + Math.floor(1000 + Math.random() * 9000);
    order.createdAt = new Date().toISOString();
    order.status = 'Pendiente';
    this.orders.unshift(order);
    this.save(STORAGE_KEYS.ORDERS, this.orders);
    return order;
  }

  updateOrderStatus(orderId, status) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      this.save(STORAGE_KEYS.ORDERS, this.orders);
    }
  }

  deleteOrder(orderId) {
    this.orders = this.orders.filter(o => o.id !== orderId);
    this.save(STORAGE_KEYS.ORDERS, this.orders);
  }

  // --- SETTINGS ---
  getSettings() { return this.settings; }
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
  }

  // --- ADMIN AUTHENTICATION ---
  authenticateAdmin(username, password) {
    const matched = ADMIN_ACCOUNTS.find(a => 
      a.username.toLowerCase() === (username || '').trim().toLowerCase() && 
      a.password === password
    );
    if (matched) {
      sessionStorage.setItem('verstail_admin_auth', matched.username);
      this.notify();
      return true;
    }
    return false;
  }

  isLoggedInAdmin() {
    const user = sessionStorage.getItem('verstail_admin_auth');
    return user === 'Tibu' || user === 'InsaneReaper7';
  }

  getAdminUsername() {
    return sessionStorage.getItem('verstail_admin_auth') || 'Admin';
  }

  logoutAdmin() {
    sessionStorage.removeItem('verstail_admin_auth');
    localStorage.removeItem('verstail_admin_auth');
    this.notify();
  }
}

window.VerstailStore = new Store();
window.VERSTAIL_FLAVORS = INITIAL_FLAVORS;
