/* ==========================================================================
   VERSTAIL - WEB: CENTRALIZED STORE & PERSISTENCE ENGINE
   Handles Products, Ingredients, Categories, Orders, Settings & Pricing Rules
   ========================================================================== */

const STORAGE_KEYS = {
  PRODUCTS: 'verstail_products_v3',
  INGREDIENTS: 'verstail_ingredients_v2',
  CATEGORIES: 'verstail_categories_v2',
  SETTINGS: 'verstail_settings_v2',
  CART: 'verstail_cart_v1',
  ORDERS: 'verstail_orders_v1',
  EXPENSE_ITEMS: 'verstail_expense_items_v1',
  EXPENDITURES: 'verstail_expenditures_v1'
};

const ADMIN_ACCOUNTS = [
  { username: 'Tibu', password: 'P@ssword1' },
  { username: 'InsaneReaper7', password: 'Un3xpected1!' }
];

const INITIAL_EXPENSE_ITEMS = [
  { id: 'exp-item-01', name: 'Vasos (32 oz / 16 oz)', category: 'Materiales', defaultCost: 20.00, unitType: 'Caja' },
  { id: 'exp-item-02', name: 'Sorbetes / Cañitas', category: 'Materiales', defaultCost: 5.00, unitType: 'Paquete' },
  { id: 'exp-item-03', name: 'Hielo', category: 'Materiales', defaultCost: 12.00, unitType: 'Bolsas' },
  { id: 'exp-item-04', name: 'Gasolina', category: 'Servicios / Operación', defaultCost: 0, unitType: 'Recarga', isVariable: true },
  { id: 'exp-item-05', name: 'Servilletas', category: 'Materiales', defaultCost: 8.00, unitType: 'Paquete' },
  { id: 'exp-item-06', name: 'Bolsas / Empaques', category: 'Materiales', defaultCost: 10.00, unitType: 'Paquete' }
];

// Initial Seed Data
const INITIAL_CATEGORIES = [
  { id: 'mega-te', name: 'Mega Té', icon: '🧋', image: '', image2: '', activeImage: 'image1', active: true, order: 1 },
  { id: 'versa-to-go', name: 'Versa To Go', icon: '🧋', image: '', image2: '', activeImage: 'image1', active: true, order: 2 },
  { id: 'batidas', name: 'Batidas', icon: '🥤', image: '', image2: '', activeImage: 'image1', active: true, order: 3 },
  { id: 'yogurt', name: 'Yogurt', icon: '🍓', image: '', image2: '', activeImage: 'image1', active: true, order: 4 },
  { id: 'galletas', name: 'Galletas', icon: '🍪', image: '', image2: '', activeImage: 'image1', active: true, order: 5 },
  { id: 'donas', name: 'Donas', icon: '🍩', image: '', image2: '', activeImage: 'image1', active: true, order: 6 }
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
  { id: 'ing-te', name: 'Mega Té Concentrado', description: 'Infusión de Mega Té revitalizante', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-aloe', name: 'Aloe Vera', description: 'Aloe digestivo y refrescante', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-liftoff', name: 'Lift Off', description: 'Chispa energizante de efervescencia', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
  { id: 'ing-colageno', name: 'Colágeno', description: 'Colágeno hidrolizado para salud y belleza', extraCost: 0, active: true, includedByDefault: true, removable: true, customerVisible: true },
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
    description: 'Nuestra bebida energizante de 32 oz con infusión de Mega Té Concentrado, Aloe Vera, Lift Off y Colágeno. Crea tu combinación eligiendo tus frutas.',
    image: '',
    baseIngredients: ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
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
    description: 'Nuestra versión To Go de 16 oz con infusión de Mega Té Concentrado, Aloe Vera, Lift Off y Colágeno. Crea tu combinación eligiendo tus frutas.',
    image: '',
    baseIngredients: ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
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
    id: 'prod-batida-01',
    name: 'Batida Proteica Gourmet',
    slug: 'batida-proteica-gourmet',
    category: 'batidas',
    description: 'Cremosa batida nutricional cargada de proteína, perfecta para reemplazo de comida o snack pos-entreno.',
    image: '',
    baseIngredients: ['Proteína Nutricional'],
    availableIngredients: ['Mega Té Concentrado', 'Aloe Vera', 'Probiótico Boost'],
    sizes: ['16 oz', '24 oz'],
    flavors: ['Dulce de Leche', 'Praline', 'Cookies & Cream', 'Protein', 'Chocolate', 'Vainilla'],
    extras: ['Mega Té Concentrado', 'Aloe Vera', 'Probiótico Boost'],
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
    description: 'Yogurt cremoso acompañado de Fresas, Guineo, Blueberries y Granola crujiente. (Opción de Miel de Agave disponible por cargo adicional).',
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
  storeName: 'Versátil Nutrition',
  customDomain: 'https://versatilnutrition.com',
  tagline: 'Energía que transforma',
  verse: 'Jeremías 29:11',
  deliveryText: 'Delivery Incluido',
  currency: '$',
  deliveryFee: 0.00,
  pickupAddress: 'Versátil Nutrition Hub, PR',
  businessHours: 'Lun - Sáb: 7:00 AM - 6:00 PM',
  showBigCategoryCards: true, // Enabled by default
  showCategoryFilterPills: false, // Disabled by default per user preference
  showCategoryCardImages: true, // Toggle: true = Show Category Pictures & Rotation, false = Emoji Icons
  iconThemeMode: 'swapped', // 'swapped' (Blue outline highlight, Gold circle) vs 'classic' (Gold outline highlight, Blue circle)
  askCustomerEmail: false, // Toggle: false = Ask for PR Town only, true = Ask for Email as well
  showStoryVideo: true, // Toggle: true = Show Story Video block, false = Hide Story Video block
  storyText: 'Versátil Nutrition nació de una necesidad que terminó cambiando nuestro camino. A veces esperamos tocar fondo para empezar algo nuevo, pero ¿y si no tienes que esperar? Si buscas generar ingresos extras o construir una oportunidad para tu futuro, escríbenos. 💙.',
  storyVideoUrl: '', // Optional story video URL (YouTube, Vimeo, MP4)
  cloudinaryCloudName: '', // Optional Cloudinary Cloud Name for permanent cloud CDN image storage
  cloudinaryUploadPreset: '', // Optional Cloudinary Unsigned Upload Preset
  jsonbinBinId: '', // Optional JSONBin Bin ID for multi-device live sync
  jsonbinApiKey: '' // Optional JSONBin API Key
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
    this.expenseItems = this.load(STORAGE_KEYS.EXPENSE_ITEMS, INITIAL_EXPENSE_ITEMS);
    this.expenditures = this.load(STORAGE_KEYS.EXPENDITURES, []);
    this.listeners = [];

    this.syncDefaults();
    this.fetchServerData();

    // Auto-poll server every 5 seconds so mobile & desktop devices sync orders and settings in real-time
    setInterval(() => {
      this.fetchServerData();
    }, 5000);
  }

  async syncCloudDbDirectly() {
    // Client-side multi-tier fallback direct to Cloud DB (JSONBin / Upstash Redis KV)
    try {
      const binId = (this.settings.jsonbinBinId || '').trim();
      const apiKey = (this.settings.jsonbinApiKey || '').trim();
      if (binId) {
        const state = {
          products: this.products,
          categories: this.categories,
          ingredients: this.ingredients,
          settings: this.settings,
          orders: this.orders,
          expenseItems: this.expenseItems,
          expenditures: this.expenditures
        };
        fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey
          },
          body: JSON.stringify(state)
        }).catch(() => {});
      }

      const kvUrl = (this.settings.upstashRestUrl || '').trim();
      const kvToken = (this.settings.upstashRestToken || '').trim();
      if (kvUrl && kvToken) {
        const state = {
          products: this.products,
          categories: this.categories,
          ingredients: this.ingredients,
          settings: this.settings,
          orders: this.orders,
          expenseItems: this.expenseItems,
          expenditures: this.expenditures
        };
        fetch(`${kvUrl.replace(/\/$/, '')}/set/verstail_db`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(state)
        }).catch(() => {});
      }
    } catch (e) {}
  }

  async fetchServerData() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data && ((data.products && data.products.length > 0) || (data.categories && data.categories.length > 0) || Array.isArray(data.orders) || Array.isArray(data.expenditures))) {
          // Smart merge products to preserve uploaded image URLs
          if (data.products && data.products.length > 0) {
            data.products.forEach(sp => {
              const localP = this.products.find(lp => lp.id === sp.id);
              if (localP) {
                if ((!sp.image || !sp.image.trim()) && localP.image) sp.image = localP.image;
              }
            });
            this.products = data.products;
          }

          // Smart merge categories: Server is the authoritative source for active/hidden state and activeImage mode
          if (data.categories && data.categories.length > 0) {
            data.categories.forEach(sc => {
              const localC = this.categories.find(lc => lc.id === sc.id);
              if (localC) {
                if ((!sc.image || !sc.image.trim()) && localC.image) sc.image = localC.image;
                if ((!sc.image2 || !sc.image2.trim()) && localC.image2) sc.image2 = localC.image2;
              }
            });
            this.categories = data.categories;
          }

          // Smart merge settings to preserve Cloudinary credentials
          if (data.settings) {
            if (!data.settings.cloudinaryCloudName && this.settings.cloudinaryCloudName) {
              data.settings.cloudinaryCloudName = this.settings.cloudinaryCloudName;
            }
            if (!data.settings.cloudinaryUploadPreset && this.settings.cloudinaryUploadPreset) {
              data.settings.cloudinaryUploadPreset = this.settings.cloudinaryUploadPreset;
            }
            this.settings = { ...this.settings, ...data.settings };
          }

          if (data.ingredients) this.ingredients = data.ingredients;
          if (Array.isArray(data.expenseItems)) this.expenseItems = data.expenseItems;

          if (Array.isArray(data.expenditures)) {
            const serverExpIds = new Set(data.expenditures.map(e => e && e.id).filter(Boolean));
            const expMap = new Map();
            data.expenditures.forEach(se => { if (se && se.id) expMap.set(se.id, se); });
            
            const now = Date.now();
            (this.expenditures || []).forEach(le => {
              if (le && le.id && !serverExpIds.has(le.id)) {
                const created = new Date(le.createdAt || le.date || 0).getTime();
                if (now - created < 30000) expMap.set(le.id, le);
              }
            });

            this.expenditures = Array.from(expMap.values()).sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
          }

          // Universal Authoritative Order Synchronization
          if (Array.isArray(data.orders)) {
            const previousOrdersJson = JSON.stringify(this.orders);
            const serverOrderIds = new Set(data.orders.map(o => o && o.id).filter(Boolean));
            const orderMap = new Map();

            // 1. Authoritative server orders
            data.orders.forEach(so => {
              if (so && so.id) orderMap.set(so.id, so);
            });

            // 2. Preserve un-synced very recent local orders (< 30 seconds old)
            const now = Date.now();
            (this.orders || []).forEach(lo => {
              if (lo && lo.id && !serverOrderIds.has(lo.id)) {
                const created = new Date(lo.createdAt || 0).getTime();
                if (now - created < 30000) {
                  orderMap.set(lo.id, lo);
                }
              }
            });

            const sortedOrders = Array.from(orderMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            const newOrdersJson = JSON.stringify(sortedOrders);

            // Check if new orders arrived to trigger alert
            const prevCount = (this.orders || []).length;
            this.orders = sortedOrders;

            if (newOrdersJson !== previousOrdersJson) {
              if (sortedOrders.length > prevCount && window.onNewOrderArrived) {
                window.onNewOrderArrived(sortedOrders[0]);
              }
            }
          }

          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
          localStorage.setItem(STORAGE_KEYS.EXPENSE_ITEMS, JSON.stringify(this.expenseItems));
          localStorage.setItem(STORAGE_KEYS.EXPENDITURES, JSON.stringify(this.expenditures));

          this.notify();
        } else {
          // Fresh server container -> Push local state to server immediately
          this.syncWithServer();
        }
      }
    } catch (e) {
      console.log('Offline/Local mode fallback:', e);
    }
  }

  syncWithServer(force = false) {
    if (!force && !this.isLoggedInAdmin()) {
      return;
    }
    try {
      const state = {
        products: this.products,
        categories: this.categories,
        ingredients: this.ingredients,
        settings: this.settings,
        orders: this.orders,
        expenseItems: this.expenseItems,
        expenditures: this.expenditures
      };
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).catch(() => {});
      this.syncCloudDbDirectly();
    } catch (e) {}
  }

  syncDefaults() {
    let updated = false;

    // Purge deprecated redundant Mega Té Herbal product
    if (this.products.some(p => p.id === 'prod-te-01' || p.name === 'Mega Té Herbal')) {
      this.products = this.products.filter(p => p.id !== 'prod-te-01' && p.name !== 'Mega Té Herbal');
      updated = true;
    }

    INITIAL_CATEGORIES.forEach(initCat => {
      const existing = this.categories.find(c => c.id === initCat.id);
      if (!existing) {
        this.categories.push(initCat);
        updated = true;
      } else {
        // Ensure new schema fields (image2, activeImage) are populated without overwriting uploaded images
        if (!existing.image2) existing.image2 = initCat.image2 || '';
        if (!existing.activeImage) existing.activeImage = initCat.activeImage || 'image1';
      }
    });

    INITIAL_PRODUCTS.forEach(initProd => {
      const existing = this.products.find(p => p.id === initProd.id);
      if (!existing) {
        this.products.push(initProd);
        updated = true;
      }
    });

    // Sanitize broken image strings so products properly inherit category images
    this.products.forEach(p => {
      if (p.image && typeof p.image === 'string') {
        const trimmed = p.image.trim();
        if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '[object Object]' || (!trimmed.startsWith('http') && !trimmed.startsWith('data:') && !trimmed.startsWith('uploads/') && !trimmed.startsWith('assets/'))) {
          p.image = '';
          updated = true;
        }
      }
    });

    if (updated) {
      try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      } catch (e) {}
    }
  }

  load(key, fallback) {
    try {
      let data = localStorage.getItem(key);
      if (!data) {
        // Backward-compatibility migration for version updates
        if (key === STORAGE_KEYS.PRODUCTS) {
          data = localStorage.getItem('verstail_products_v2') || localStorage.getItem('verstail_products_v1');
        } else if (key === STORAGE_KEYS.CATEGORIES) {
          data = localStorage.getItem('verstail_categories_v1');
        } else if (key === STORAGE_KEYS.SETTINGS) {
          data = localStorage.getItem('verstail_settings_v1');
        }
      }
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notify();
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
    const activeCategories = new Set(this.categories.filter(c => c.active !== false).map(c => c.id));
    return this.products.filter(p => p.active !== false && activeCategories.has(p.category));
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
      this.syncWithServer(true);
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
    this.syncWithServer(true);
  }

  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    this.save(STORAGE_KEYS.PRODUCTS, this.products);
    this.syncWithServer(true);
  }

  // --- INGREDIENTS & CATEGORIES ---
  getIngredients() { return this.ingredients; }
  saveIngredient(ing) {
    if (!ing.id) ing.id = 'ing-' + Date.now();
    const idx = this.ingredients.findIndex(i => i.id === ing.id);
    if (idx !== -1) this.ingredients[idx] = ing;
    else this.ingredients.push(ing);
    this.save(STORAGE_KEYS.INGREDIENTS, this.ingredients);
    this.syncWithServer(true);
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
    this.syncWithServer(true);
    this.notify();
  }

  toggleCategoryActive(id) {
    const c = this.categories.find(cat => cat.id === id);
    if (c) {
      c.active = !c.active;
      this.save(STORAGE_KEYS.CATEGORIES, this.categories);
      this.syncWithServer(true);
      this.notify();
    }
  }

  setCategoryActiveImageMode(id, mode) {
    const c = this.categories.find(cat => cat.id === id);
    if (c) {
      c.activeImage = mode;
      this.save(STORAGE_KEYS.CATEGORIES, this.categories);
      this.syncWithServer(true);
      this.notify();
    }
  }

  toggleBigCategoryCardsSetting() {
    this.settings.showBigCategoryCards = this.settings.showBigCategoryCards === false ? true : false;
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.syncWithServer(true);
  }

  toggleCategoryFilterPillsSetting() {
    this.settings.showCategoryFilterPills = !this.settings.showCategoryFilterPills;
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.syncWithServer(true);
  }

  toggleIconThemeMode() {
    this.settings.iconThemeMode = this.settings.iconThemeMode === 'classic' ? 'swapped' : 'classic';
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.syncWithServer(true);
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
  
  async addOrder(order) {
    order.id = order.id || ('V-' + Math.floor(1000 + Math.random() * 9000));
    order.createdAt = order.createdAt || new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    order.status = order.status || 'Pendiente';
    order.paymentStatus = order.paymentStatus || 'No Pagado';
    if (!Array.isArray(this.orders)) this.orders = [];
    this.orders.unshift(order);
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    // Immediate POST to dedicated /api/orders
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
    } catch (e) {}

    this.syncCloudDbDirectly();
    this.syncWithServer();
    this.notify();
    return order;
  }

  async updateOrderStatus(orderId, status) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.save(STORAGE_KEYS.ORDERS, this.orders);

      try {
        await fetch('/api/orders/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, status: status })
        });
      } catch (e) {}

      this.syncCloudDbDirectly();
      this.syncWithServer();
      this.notify();
    }
  }

  async updateOrderPaymentStatus(orderId, paymentStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
      this.save(STORAGE_KEYS.ORDERS, this.orders);

      try {
        await fetch('/api/orders/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, paymentStatus: paymentStatus })
        });
      } catch (e) {}

      this.syncCloudDbDirectly();
      this.syncWithServer();
      this.notify();
    }
  }

  async deleteOrder(orderId) {
    this.orders = this.orders.filter(o => o.id !== orderId);
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    try {
      await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId })
      });
    } catch (e) {}

    this.syncCloudDbDirectly();
    this.syncWithServer();
    this.notify();
  }

  // --- EXPENSE ITEMS & EXPENDITURES ---
  getExpenseItems() { return this.expenseItems || []; }
  saveExpenseItem(item) {
    if (!item.id) item.id = 'exp-item-' + Date.now();
    if (!Array.isArray(this.expenseItems)) this.expenseItems = [];
    const idx = this.expenseItems.findIndex(i => i.id === item.id);
    if (idx !== -1) this.expenseItems[idx] = item;
    else this.expenseItems.push(item);
    this.save(STORAGE_KEYS.EXPENSE_ITEMS, this.expenseItems);
    this.syncWithServer(true);
    this.notify();
    return item;
  }

  deleteExpenseItem(id) {
    this.expenseItems = (this.expenseItems || []).filter(i => i.id !== id);
    this.save(STORAGE_KEYS.EXPENSE_ITEMS, this.expenseItems);
    this.syncWithServer(true);
    this.notify();
  }

  getExpenditures() { return this.expenditures || []; }
  
  async addExpenditure(entry) {
    entry.id = 'exp-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    entry.createdAt = new Date().toISOString();
    entry.date = entry.date || new Date().toISOString().split('T')[0];
    if (!Array.isArray(this.expenditures)) this.expenditures = [];
    this.expenditures.unshift(entry);
    this.save(STORAGE_KEYS.EXPENDITURES, this.expenditures);
    this.syncWithServer(true);
    this.notify();
    return entry;
  }

  async deleteExpenditure(id) {
    this.expenditures = (this.expenditures || []).filter(e => e.id !== id);
    this.save(STORAGE_KEYS.EXPENDITURES, this.expenditures);
    this.syncWithServer(true);
    this.notify();
  }

  // --- SETTINGS ---
  getSettings() { return this.settings; }
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.syncWithServer(true);
  }

  // --- ADMIN AUTHENTICATION SECURITY ---
  authenticateAdmin(username, password) {
    const lockoutUntil = parseInt(sessionStorage.getItem('verstail_admin_lockout') || '0', 10);
    if (Date.now() < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      throw new Error(`⚠️ Acceso temporalmente bloqueado por seguridad. Inténtalo de nuevo en ${remainingSec} segundos.`);
    }

    const matched = ADMIN_ACCOUNTS.find(a => 
      a.username.toLowerCase() === (username || '').trim().toLowerCase() && 
      a.password === password
    );
    if (matched) {
      sessionStorage.setItem('verstail_admin_auth', matched.username);
      sessionStorage.setItem('verstail_admin_last_activity', Date.now().toString());
      sessionStorage.removeItem('verstail_admin_failed_attempts');
      sessionStorage.removeItem('verstail_admin_lockout');
      this.notify();
      return true;
    }

    let failed = parseInt(sessionStorage.getItem('verstail_admin_failed_attempts') || '0', 10) + 1;
    sessionStorage.setItem('verstail_admin_failed_attempts', failed.toString());
    if (failed >= 5) {
      const lockTime = Date.now() + (2 * 60 * 1000); // 2 minute lockout
      sessionStorage.setItem('verstail_admin_lockout', lockTime.toString());
      throw new Error('⚠️ Demasiados intentos fallidos (5/5). El acceso ha sido bloqueado temporalmente por 2 minutos por seguridad.');
    }
    return false;
  }

  isLoggedInAdmin() {
    const user = sessionStorage.getItem('verstail_admin_auth');
    const lastActivity = parseInt(sessionStorage.getItem('verstail_admin_last_activity') || '0', 10);
    const now = Date.now();

    if (user && (user === 'Tibu' || user === 'InsaneReaper7')) {
      if (lastActivity > 0 && (now - lastActivity > 15 * 60 * 1000)) {
        this.logoutAdmin();
        return false;
      }
      return true;
    }
    return false;
  }

  getAdminUsername() {
    return sessionStorage.getItem('verstail_admin_auth') || 'Admin';
  }

  logoutAdmin() {
    sessionStorage.removeItem('verstail_admin_auth');
    sessionStorage.removeItem('verstail_admin_last_activity');
    sessionStorage.removeItem('verstail_admin_failed_attempts');
    sessionStorage.removeItem('verstail_admin_lockout');
    localStorage.removeItem('verstail_admin_auth');
    this.notify();
  }
}

window.VerstailStore = new Store();
window.VERSTAIL_FLAVORS = INITIAL_FLAVORS;
