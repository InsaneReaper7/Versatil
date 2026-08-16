/* ==========================================================================
   VERSTAIL - WEB: MAIN APPLICATION ROUTER & UI CONTROLLER
   Tagline: "Tu bebida. Tu mezcla. Tu estilo."
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.VerstailStore;
  const whatsapp = window.VerstailWhatsApp;

  // DOM Elements
  const appContainer = document.getElementById('app-root');
  const stickyCartBar = document.getElementById('sticky-mobile-cart');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');

  // App Local State
  let currentRoute = getRouteFromHash();
  let selectedCategoryFilter = 'all';
  let activeModalProduct = null;
  let activeCustomizerState = null;
  let activeWizardStep = 1;
  let wizardData = {
    base: ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
    size: '32 oz',
    flavors: [],
    extras: [],
    quantity: 1
  };

  // --- ROUTING ENGINE ---
  function getRouteFromHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    return hash;
  }

  window.addEventListener('hashchange', () => {
    currentRoute = getRouteFromHash();
    closeMobileDrawer();
    renderApp();
  });

  store.subscribe(() => {
    updateHeaderCartBadge();
    updateStickyCartBar();
    renderApp();
  });

  // --- MOBILE DRAWER & NAVIGATION LINKS ---
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
    });
  }

  function closeMobileDrawer() {
    if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');
  }

  // Auto-close drawer on any link click & handle Inicio smooth scroll + refresh
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (link.classList.contains('mobile-nav-link') || mobileNavDrawer.contains(link)) {
      closeMobileDrawer();
    }

    if (href === '#home' || href === '#') {
      closeMobileDrawer();
      selectedCategoryFilter = 'all';
      if (currentRoute === 'home') {
        renderHomeView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });

  // --- HEADER & STICKY CART BADGE ---
  function updateHeaderCartBadge() {
    const cart = store.getCart();
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => b.textContent = totalCount);
  }

  function updateStickyCartBar() {
    const cart = store.getCart();
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    if (totalCount > 0 && !currentRoute.startsWith('admin') && currentRoute !== 'checkout') {
      stickyCartBar.style.display = 'flex';
      stickyCartBar.innerHTML = `
        <div>
          <div style="font-weight: 800; font-size: 0.95rem;">${totalCount} antojo${totalCount > 1 ? 's' : ''} en tu carrito</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">"Tu bebida. Tu mezcla. Tu estilo."</div>
        </div>
        <button onclick="window.location.hash='carrito'" class="btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">
          🛒 Ver Carrito
        </button>
      `;
    } else {
      stickyCartBar.style.display = 'none';
    }
  }

  function syncIconThemeMode() {
    const settings = store.getSettings();
    const mode = settings.iconThemeMode || 'swapped';
    document.body.classList.remove('theme-icon-swapped', 'theme-icon-classic');
    document.body.classList.add(`theme-icon-${mode}`);
  }

  // --- MAIN RENDER ROUTER ---
  function renderApp() {
    syncIconThemeMode();
    updateHeaderCartBadge();
    updateStickyCartBar();

    if (currentRoute.startsWith('admin')) {
      renderAdminPortal();
      return;
    }

    switch (currentRoute) {
      case 'home':
        renderHomeView();
        break;
      case 'menu':
        renderHomeView();
        setTimeout(() => {
          const sec = document.getElementById('menu-section');
          if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }, 80);
        break;
      case 'crear-mi-mezcla':
        renderCustomMixWizardView();
        break;
      case 'carrito':
        renderCartView();
        break;
      case 'checkout':
        renderCheckoutView();
        break;
      case 'confirmacion':
        renderOrderConfirmationView();
        break;
      default:
        if (currentRoute.startsWith('producto/')) {
          const slug = currentRoute.replace('producto/', '');
          renderProductDetailView(slug);
        } else {
          renderHomeView();
        }
        break;
    }
  }

  // --- 5-SECOND CATEGORY IMAGE ROTATION TICKER ---
  // --- 4-SECOND CATEGORY & PRODUCT IMAGE ROTATION TICKER WITH MOBILE PRE-CACHING ---
  let categoryRotationState = 0; // 0 = Image 1, 1 = Image 2
  const preloadedMobileImages = new Set();

  setInterval(() => {
    categoryRotationState = categoryRotationState === 0 ? 1 : 0;
    const rotatableElements = document.querySelectorAll('.cat-rotatable-image');
    rotatableElements.forEach(img => {
      const img1 = img.getAttribute('data-img1');
      const img2 = img.getAttribute('data-img2');
      const mode = img.getAttribute('data-mode');
      if (mode === 'rotate' && img1 && img2) {
        const nextSrc = categoryRotationState === 0 ? img1 : img2;
        
        // Pre-cache on mobile device memory to prevent delay or blank flicker
        if (!preloadedMobileImages.has(nextSrc)) {
          const cacheTag = new Image();
          cacheTag.src = nextSrc;
          preloadedMobileImages.add(nextSrc);
        }

        img.style.transition = 'opacity 0.3s ease';
        img.style.opacity = '0.2';
        setTimeout(() => {
          img.src = nextSrc;
          img.style.opacity = '1';
        }, 280);
      }
    });
  }, 4000);

  function getCategoryActiveImage(cat, rotState = categoryRotationState) {
    if (!cat) return '';
    const img1 = (cat.image || '').trim();
    const img2 = (cat.image2 || '').trim();
    const mode = cat.activeImage || 'image1';

    if (mode === 'image2' && img2) return img2;
    if (mode === 'rotate') {
      if (rotState === 1 && img2) return img2;
      if (img1) return img1;
      if (img2) return img2;
    }
    return img1 || img2 || '';
  }

  function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '[object Object]') return false;
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('uploads/') || trimmed.startsWith('assets/');
  }

  window.handleImageError = (imgEl, catId) => {
    imgEl.onerror = null;
    const cat = store.getCategories().find(c => c.id === catId || c.slug === catId);
    const catImg = cat ? getCategoryActiveImage(cat) : '';
    if (catImg && isValidImageUrl(catImg) && imgEl.src !== catImg) {
      imgEl.src = catImg;
    } else {
      imgEl.src = 'assets/images/logo.jpg';
      imgEl.style.objectFit = 'contain';
      imgEl.style.padding = '1.25rem';
      imgEl.style.background = 'var(--bg-secondary)';
    }
  };

  function getProductImage(prod) {
    if (!prod) return '';
    if (isValidImageUrl(prod.image)) return prod.image.trim();
    
    const categories = store.getCategories();
    const cat = categories.find(c => c.id === prod.category || c.slug === prod.category);
    if (cat) {
      const catImg = getCategoryActiveImage(cat);
      if (isValidImageUrl(catImg)) return catImg;
    }
    
    const siblings = store.getProducts().filter(p => (p.category === prod.category || p.category === (cat ? cat.id : '')) && isValidImageUrl(p.image));
    if (siblings.length > 0) return siblings[0].image.trim();
    return '';
  }

  function getCategoryImage(cat) {
    const activeImg = getCategoryActiveImage(cat);
    if (isValidImageUrl(activeImg)) return activeImg;
    const prods = store.getProducts();
    const match = prods.find(p => p.category === cat.id && isValidImageUrl(p.image));
    return match ? match.image.trim() : '';
  }

  // --- HOMEPAGE VIEW ---
  // --- HOMEPAGE VIEW (INTEGRATED MENU & CATALOG) ---
  function renderHomeView() {
    const categories = store.getCategories().filter(c => c.active !== false && c.id !== 'custom-mix');
    const activeCatIds = new Set(categories.map(c => c.id));
    const settings = store.getSettings();
    let products = store.getActiveProducts().filter(p => activeCatIds.has(p.category));

    if (selectedCategoryFilter !== 'all') {
      products = products.filter(p => p.category === selectedCategoryFilter);
    }

    const selectedCategoryObj = categories.find(c => c.id === selectedCategoryFilter);

    appContainer.innerHTML = `
      <!-- HERO SECTION WITH PROMINENT CENTRAL CLIENT LOGO -->
      <section class="hero-section">
        <div class="hero-logo-wrapper">
          <div class="hero-logo-badge">
            <img src="assets/images/logo.jpg" alt="Versátil Logo Official" class="hero-central-logo" />
          </div>
        </div>

        <div class="hero-pill">
          <span>✨</span> Jeremías 29:11 — Energía que transforma
        </div>

        <h1 class="hero-title">Tu bebida. Tu mezcla. Tu estilo.</h1>
        
        <p class="hero-subtitle" style="max-width: 720px; margin: 0.85rem auto 1.5rem; line-height: 1.65; font-size: 1.05rem; font-weight: 500;">
          Suena cliché, pero Versátil Nutrition empezó bajo una necesidad. Pero qué gran necesidad fue la que hizo que saliéramos a cambiar nuestras vidas. No esperes a ese momento para empezar un camino propio. Aquí abajo les dejaré un video de cómo comenzó todo.
        </p>

        <!-- FEATURED STORY VIDEO SECTION (TOGGLEABLE VIA ADMIN) -->
        ${settings.showStoryVideo !== false ? `
          <div style="max-width: 680px; margin: 1rem auto 1.75rem;">
            ${settings.storyVideoUrl ? `
              <div style="border-radius: var(--radius-lg); overflow: hidden; border: 2px solid var(--secondary-baby-blue); box-shadow: 0 12px 35px rgba(56, 189, 248, 0.22);">
                ${formatVideoEmbedHTML(settings.storyVideoUrl)}
              </div>
            ` : `
              <div style="border-radius: var(--radius-lg); border: 2px solid var(--secondary-baby-blue); background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); box-shadow: 0 12px 35px rgba(56, 189, 248, 0.22); padding: 2rem 1.5rem; color: #FFFFFF; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem; text-shadow: 0 4px 12px rgba(0,0,0,0.5);">🎬</div>
                <h3 style="font-size: 1.25rem; font-weight: 900; color: var(--secondary-baby-blue-hover); margin-bottom: 0.4rem;">
                  Cómo Comenzó Todo — Versátil Nutrition
                </h3>
                <p style="font-size: 0.88rem; color: #94A3B8; max-width: 480px; margin: 0 auto 1.25rem; line-height: 1.5;">
                  Próximamente disponible. ¡Conoce nuestra historia, los comienzos y la pasión detrás de cada mezcla!
                </p>
                <span style="display: inline-block; background: rgba(56, 189, 248, 0.15); color: var(--secondary-baby-blue-hover); border: 1px solid var(--baby-blue-border); padding: 4px 14px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 800;">
                  📹 Video de Historia Próximamente
                </span>
              </div>
            `}
          </div>
        ` : ''}

        <div class="hero-delivery-badge">
          <span>🚚</span> Delivery Incluido | 📲 WhatsApp: 939-312-0599
        </div>

        <div class="hero-actions">
          <a href="#menu-section" onclick="smoothScrollToMenu(event)" class="btn-primary" style="padding: 1rem 2.5rem; font-size: 1.1rem;">
            🍹 Ver Menú y Ordenar
          </a>
        </div>
      </section>

      <!-- BIG CATEGORY BUTTON CARDS (OPTIONAL VIA ADMIN TOGGLE) -->
      ${settings.showBigCategoryCards !== false && categories.length > 0 ? `
        <section class="section-container" style="padding-bottom: 1rem;">
          <div class="section-header" style="margin-bottom: 1.25rem; flex-direction: column; align-items: center; text-align: center; gap: 0.4rem;">
            <div>
              <h2 class="section-title" style="text-align: center;">Explora por Categoría</h2>
              <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center;">Toca una categoría para ver sus opciones</p>
            </div>
            ${selectedCategoryFilter !== 'all' ? `
              <button onclick="setMenuFilter('all')" style="color: var(--secondary-baby-blue-hover); font-weight: 800; font-size: 0.85rem; background: var(--baby-blue-light); border: 1.5px solid var(--baby-blue-border); padding: 5px 14px; border-radius: var(--radius-full); cursor: pointer; margin-top: 0.25rem;">
                🔄 Ver Todos los Antojos
              </button>
            ` : ''}
          </div>

          <div class="categories-grid">
            ${categories.map(cat => {
              const catImg = getCategoryActiveImage(cat);
              const isRotatable = cat.activeImage === 'rotate' && cat.image && cat.image2;
              const showImages = (settings.showCategoryCardImages !== false || isRotatable || (cat.image && cat.image.trim() !== '')) && !!catImg;
              return `
                <div class="category-card ${selectedCategoryFilter === cat.id ? 'active' : ''}" onclick="selectCategoryAndScroll('${cat.id}')">
                  ${showImages ? `
                    <div class="cat-card-img-wrapper">
                      <img src="${catImg}" class="cat-card-img ${isRotatable ? 'cat-rotatable-image' : ''}" ${isRotatable ? `data-img1="${cat.image}" data-img2="${cat.image2}" data-mode="rotate"` : ''} alt="${cat.name}" />
                    </div>
                    <span class="category-name">${cat.icon} ${cat.name}</span>
                  ` : `
                    <span class="category-icon">${cat.icon}</span>
                    <span class="category-name">${cat.name}</span>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}

      <!-- INTEGRATED MENU CATALOG & PRODUCTS GRID -->
      <section class="section-container" id="menu-section" style="scroll-margin-top: 90px; padding-top: 0.5rem;">
        <div class="section-header" style="flex-direction: column; align-items: center; text-align: center; gap: 0.4rem; margin-bottom: 1.25rem;">
          <h2 class="section-title" style="font-size: 1.8rem; text-align: center;">Menú de Antojos</h2>
          <p style="color: var(--text-secondary); font-size: 0.92rem; text-align: center;">
            ${selectedCategoryObj ? `Mostrando opciones para <strong>${selectedCategoryObj.name}</strong>` : 'Elige una opción y personalízala a tu estilo.'}
          </p>
        </div>

        <!-- SMALL CATEGORY FILTER PILLS BAR (OPTIONAL VIA ADMIN TOGGLE) -->
        ${settings.showCategoryFilterPills ? `
          <div style="display: flex; gap: 0.6rem; overflow-x: auto; padding: 0.5rem 0 1rem; margin-bottom: 1.25rem; -webkit-overflow-scrolling: touch; justify-content: center;">
            <button onclick="setMenuFilter('all')" class="category-card ${selectedCategoryFilter === 'all' ? 'active' : ''}" style="padding: 0.55rem 1.1rem; flex-direction: row; min-width: max-content; font-size: 0.9rem;">
              🌟 Todos
            </button>
            ${categories.map(cat => `
              <button onclick="setMenuFilter('${cat.id}')" class="category-card ${selectedCategoryFilter === cat.id ? 'active' : ''}" style="padding: 0.55rem 1.1rem; flex-direction: row; min-width: max-content; font-size: 0.9rem;">
                <span>${cat.icon}</span> <span>${cat.name}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}

        <!-- FILTER RESET BANNER IF FILTER ACTIVE -->
        ${selectedCategoryFilter !== 'all' && !settings.showCategoryFilterPills ? `
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--baby-blue-light); border: 1.5px solid var(--baby-blue-border); padding: 0.6rem 1.25rem; border-radius: var(--radius-full); margin: 0 auto 1.5rem; max-width: 540px;">
            <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">
              Filtro activo: <strong>${selectedCategoryObj ? selectedCategoryObj.name : selectedCategoryFilter}</strong>
            </span>
            <button onclick="setMenuFilter('all')" style="background: none; border: none; color: var(--secondary-baby-blue-hover); font-weight: 800; cursor: pointer; font-size: 0.9rem;">
              ✖ Mostrar Todos los Productos
            </button>
          </div>
        ` : ''}

        <!-- PRODUCTS GRID -->
        ${products.length > 0 ? `
          <div class="products-grid">
            ${products.map(prod => renderProductCardHTML(prod)).join('')}
          </div>
        ` : `
          <div class="empty-cart-state">
            <div class="empty-cart-icon">🔍</div>
            <h3>No hay productos en esta categoría</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Prueba seleccionando otra categoría.</p>
            <button onclick="setMenuFilter('all')" class="btn-secondary">Ver todo el menú</button>
          </div>
        `}
      </section>
    `;
  }

  window.selectCategoryAndScroll = (catId) => {
    selectedCategoryFilter = catId;
    renderHomeView();
    setTimeout(() => {
      const firstProdCard = document.querySelector('#menu-section .product-card');
      const target = firstProdCard || document.getElementById('menu-section');
      if (target) {
        const headerOffset = 105; // Offset for fixed navbar & Filtro activo banner
        const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 60);
  };

  window.smoothScrollToMenu = (e) => {
    e.preventDefault();
    const sec = document.getElementById('menu-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  };

  window.setMenuFilter = (catId) => {
    selectedCategoryFilter = catId;
    renderHomeView();
  };

  // Redundant #menu route redirects directly to Home View
  function renderMenuView() {
    renderHomeView();
  }

  // --- PRODUCT CARD HTML HELPER (WITH SOLD OUT SUPPORT) ---
  function renderProductCardHTML(prod) {
    const showPrice = prod.showPublicPrice;
    const isSoldOut = !!prod.soldOut;
    const btnLabel = isSoldOut 
      ? `🚫 Agotado` 
      : (showPrice ? `🍹 Ordenar — $${Number(prod.publicPrice).toFixed(2)}` : `🍹 Ordenar`);
    const imgUrl = getProductImage(prod);
    const hasImage = !!imgUrl;

    const cat = store.getCategories().find(c => c.id === prod.category);
    const isRotatable = (!prod.image || !prod.image.trim()) && cat && cat.activeImage === 'rotate' && cat.image && cat.image2;

    return `
      <div class="product-card ${hasImage ? 'has-prod-image' : ''} ${isSoldOut ? 'is-sold-out' : ''}">
        <div class="product-image-container">
          ${isSoldOut ? `<span class="product-sold-out-badge">🚫 AGOTADO</span>` : ''}
          ${hasImage ? `
            <img src="${imgUrl}" alt="${prod.name}" class="product-image ${isRotatable ? 'cat-rotatable-image' : ''}" ${isRotatable ? `data-img1="${cat.image}" data-img2="${cat.image2}" data-mode="rotate"` : ''} onerror="handleImageError(this, '${prod.category}')" />
          ` : `
            <div class="product-badge-placeholder">
              <span style="font-size: 2.5rem;">${getCategoryIcon(prod.category)}</span>
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Versátil Craft</div>
            </div>
          `}
          ${prod.featured && !isSoldOut ? `<span class="product-featured-badge">Destacado</span>` : ''}
        </div>
        <div class="product-info">
          <span class="product-category-tag">${prod.category.toUpperCase()}</span>
          <h3 class="product-title">${prod.name}</h3>
          <p class="product-desc">${prod.description || 'Deliciosa opción preparada con ingredientes de la más alta calidad.'}</p>
        </div>
        ${isSoldOut ? `
          <button class="btn-card-ordenar sold-out" disabled style="cursor: not-allowed; opacity: 0.75;">
            🚫 Agotado
          </button>
        ` : `
          <button onclick="openProductCustomizer('${prod.id}')" class="btn-card-ordenar">
            ${btnLabel}
          </button>
        `}
      </div>
    `;
  }

  function getCategoryIcon(catId) {
    if (catId === 'mega-te' || catId === 'versa-to-go') return '🧋';
    const cat = store.getCategories().find(c => c.id === catId);
    return cat ? cat.icon : '🧋';
  }

  function formatCustomizerBaseText(prod, state) {
    if (!prod || !state) return 'Como Sale';
    const defaultBase = prod.baseIngredients || ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'];
    const currentIngredients = state.ingredients || [];
    const removed = defaultBase.filter(b => !currentIngredients.includes(b));
    if (removed.length === 0) return 'Como Sale';
    return removed.map(r => `Sin ${r}`).join(', ');
  }

  // --- MULTI-STEP PRODUCT CUSTOMIZER MODAL ---
  window.openProductCustomizer = (productId) => {
    const product = store.getProductBySlug(productId);
    if (!product) return;

    activeModalProduct = product;
    const isMegaTe = product.category === 'mega-te' || product.category === 'versa-to-go';

    activeCustomizerState = {
      step: 1, // Step 1: Base Ingredients, Step 2: Flavors, Step 3: Extras & Confirm
      mode: isMegaTe ? 'personaliza' : 'original',
      size: product.sizes && product.sizes.length > 0 ? product.sizes[0] : (product.category === 'versa-to-go' ? '16 oz' : '32 oz'),
      flavors: product.flavors && product.flavors.length > 0 ? [product.flavors[0]] : [],
      ingredients: [...(product.baseIngredients || [])],
      extras: [],
      quantity: 1
    };

    renderCustomizerModalHTML(true);
  };

  window.setCustomizerStep = (stepNum) => {
    if (activeCustomizerState) {
      activeCustomizerState.step = stepNum;
      renderCustomizerModalHTML(true);
      const card = document.querySelector('#customizer-modal .modal-card');
      if (card) card.scrollTop = 0;
    }
  };

  function calculateCustomizerPrice() {
    const prod = activeModalProduct;
    const state = activeCustomizerState;
    if (!prod || !state) return 0;

    let basePrice = Number(prod.publicPrice) || 0;
    let extraFlavorsCount = Math.max(0, state.flavors.length - 2);
    let extraFlavorsCost = extraFlavorsCount * 0.75;

    let extrasCost = 0;
    state.extras.forEach(extName => {
      const extObj = store.getIngredients().find(i => i.name === extName);
      if (extObj) extrasCost += Number(extObj.extraCost || 0);
      else extrasCost += 1.50;
    });

    return (basePrice + extraFlavorsCost + extrasCost) * (state.quantity || 1);
  }

  function renderCustomizerModalHTML(isFullRender = false) {
    const prod = activeModalProduct;
    const state = activeCustomizerState;
    if (!prod || !state) return;

    let existingModal = document.getElementById('customizer-modal');
    if (existingModal && !isFullRender) {
      updateCustomizerSummaryDOM();
      return;
    }

    const currentStep = state.step || 1;

    const modalHTML = `
      <div class="modal-backdrop open" id="customizer-modal">
        <div class="modal-card" style="max-width: 580px;">
          <button onclick="closeCustomizerModal()" class="modal-close-btn">&times;</button>
          
          <!-- PRODUCT HEADER -->
          <div style="display: flex; gap: 0.85rem; align-items: center; margin-bottom: 0.6rem;">
            <div style="font-size: 2.2rem;">${getCategoryIcon(prod.category)}</div>
            <div>
              <span class="product-category-tag">${prod.category.toUpperCase()}</span>
              <h2 style="font-size: 1.35rem; font-weight: 800;">${prod.name}</h2>
            </div>
          </div>

          <!-- MULTI-STEP PROGRESS BAR -->
          <div class="customizer-step-bar">
            <div class="customizer-step-item ${currentStep === 1 ? 'active' : (currentStep > 1 ? 'completed' : '')}">1. Base</div>
            <div class="customizer-step-item ${currentStep === 2 ? 'active' : (currentStep > 2 ? 'completed' : '')}">2. Sabores (${state.flavors.length})</div>
            <div class="customizer-step-item ${currentStep === 3 ? 'active' : ''}">3. Confirmar</div>
          </div>

          <!-- STEP CONTENT -->
          <div id="customizer-step-content" style="display: flex; flex-direction: column; gap: 1rem;">
            ${renderStepScreenHTML(currentStep, prod, state)}
          </div>
        </div>
      </div>
    `;

    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function renderStepScreenHTML(step, prod, state) {
    // --- STEP 1: BASE INGREDIENTS & SIZES ---
    if (step === 1) {
      return `
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.3rem;">
            Paso 1: Ingredientes Incluidos en la Base
          </h3>
          
          <div style="background: rgba(16, 185, 129, 0.12); border: 1.5px solid rgba(16, 185, 129, 0.35); padding: 0.85rem 1rem; border-radius: var(--radius-md); color: #059669; font-size: 0.88rem; font-weight: 700; margin-bottom: 1rem; line-height: 1.4;">
            ✨ <strong>¡Incluidos Gratis!</strong> Todos estos ingredientes vienen incluidos en la receta base de tu bebida. Toca cualquiera para removerlo si prefieres tu mezcla sin él.
          </div>

          <div style="margin-bottom: 1.25rem;">
            <label style="font-weight: 800; font-size: 0.82rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">INGREDIENTES BASE (INCLUIDOS)</label>
            <div class="ingredient-list">
              ${(prod.baseIngredients || []).map(ing => `
                <div class="ingredient-chip ${state.ingredients.includes(ing) ? 'active' : ''}" data-ingredient="${ing}" onclick="toggleCustomizerIngredient('${ing}', this)">
                  <span class="chip-icon">${state.ingredients.includes(ing) ? '✓' : '+'}</span> ${ing}
                </div>
              `).join('')}
            </div>
          </div>

          ${prod.sizes && prod.sizes.length > 1 ? `
            <div style="margin-bottom: 1.25rem;">
              <label style="font-weight: 800; font-size: 0.82rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">TAMAÑO / PRESENTACIÓN</label>
              <div class="ingredient-list">
                ${prod.sizes.map(sz => `
                  <div class="flavor-chip ${state.size === sz ? 'selected' : ''}" data-size="${sz}" onclick="setCustomizerSize('${sz}', this)">
                    ${sz}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <button onclick="setCustomizerStep(2)" class="btn-primary" style="width: 100%; padding: 0.95rem; font-size: 1.05rem; justify-content: center; margin-top: 1rem;">
            Siguiente: Elegir Sabores ➔
          </button>
        </div>
      `;
    }

    // --- STEP 2: FLAVORS SELECTION (CLEAN NATURAL DISPLAY, NO DOUBLE SCROLLBARS) ---
    if (step === 2) {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
              Paso 2: Elige tus Frutas o Sabores
            </h3>
            <span style="font-size: 0.82rem; font-weight: 800; color: var(--accent-gold-dark);" id="mega-te-counter-header">${state.flavors.length} Seleccionados</span>
          </div>

          <p style="color: var(--text-secondary); font-size: 0.86rem; margin-bottom: 0.8rem;">
            Selecciona hasta 3 sabores para combinar en tu bebida.
          </p>

          <div id="flavor-warning-rect-modal" class="flavor-warning-rect" style="display: ${state.flavors.length >= 3 ? 'flex' : 'none'}; margin-bottom: 1rem;">
            <span class="flavor-warning-icon">⚠️</span>
            <div>
              <strong>Aviso de Sabores:</strong> Las primeras 2 frutas/sabores están incluidas sin costo adicional. A partir del 3er sabor en adelante, aplica un cargo adicional.
            </div>
          </div>

          <!-- FLAVOR CHIPS GRID: CLEAN NATURAL DISPLAY WITHOUT DOUBLE SCROLLBARS -->
          <div class="ingredient-list" style="margin-bottom: 1.5rem;">
            ${(prod.flavors || []).map(flv => `
              <div class="flavor-chip ${state.flavors.includes(flv) ? 'selected' : ''}" data-flavor="${flv}" onclick="toggleCustomizerFlavor('${flv}', this)">
                <span class="chip-icon">${state.flavors.includes(flv) ? '✓' : '+'}</span> ${flv}
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
            <button onclick="setCustomizerStep(1)" class="btn-secondary" style="flex: 1; justify-content: center; padding: 0.85rem;">
              ⬅️ Atrás (Base)
            </button>
            <button onclick="setCustomizerStep(3)" class="btn-primary" style="flex: 2; justify-content: center; padding: 0.85rem;">
              Siguiente: Opciones Extras ➔
            </button>
          </div>
        </div>
      `;
    }

    // --- STEP 3: EXTRAS, SUMMARY & ADD TO CART ---
    const finalPrice = calculateCustomizerPrice();
    return `
      <div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.3rem;">
          Paso 3: Extras Opcionales y Confirmación
        </h3>

        ${prod.extras && prod.extras.length > 0 ? `
          <div style="margin-bottom: 1rem;">
            <label style="font-weight: 800; font-size: 0.82rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">EXTRAS OPCIONALES (CARGO ADICIONAL)</label>
            
            ${prod.extras.includes('Miel de Agave') || prod.category === 'yogurt' ? `
              <div style="background: rgba(245, 158, 11, 0.12); border: 1.5px solid rgba(245, 158, 11, 0.4); padding: 0.75rem 0.9rem; border-radius: var(--radius-md); color: #B45309; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">🍯</span>
                <div>
                  <strong>Aviso de Miel de Agave:</strong> Añadir Miel de Agave a tu Yogurt es un extra opcional y aplica un cargo adicional de <strong>+$0.75</strong>.
                </div>
              </div>
            ` : ''}

            <div class="ingredient-list">
              ${prod.extras.map(ext => {
                const extObj = store.getIngredients().find(i => i.name === ext);
                const costVal = extObj ? extObj.extraCost : (ext === 'Miel de Agave' ? 0.75 : 1.50);
                const costTag = costVal > 0 ? `(+$${costVal.toFixed(2)})` : '';
                return `
                  <div class="ingredient-chip ${state.extras.includes(ext) ? 'active' : ''}" data-extra="${ext}" onclick="toggleCustomizerExtra('${ext}', this)">
                    <span class="chip-icon">${state.extras.includes(ext) ? '✓' : '+'}</span> ${ext} <span style="font-size: 0.78rem; font-weight: 800; opacity: 0.9;">${costTag}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <div class="live-summary-box" style="margin-top: 0.5rem;">
          <div class="summary-title">Resumen de tu Orden Final</div>
          <div style="font-size: 1.05rem; font-weight: 800;" id="summary-title-text">${prod.name} (<span id="summary-size-text">${state.size}</span>)</div>
          
          <div style="font-size: 0.83rem; color: var(--text-secondary); margin-top: 0.4rem; line-height: 1.5;" id="summary-flavors-text">
            <div><strong>Base:</strong> ${formatCustomizerBaseText(prod, state)}</div>
            <div><strong>Sabores:</strong> ${state.flavors.length > 0 ? state.flavors.join(', ') : 'Sin frutas seleccionadas'}</div>
            ${state.extras.length > 0 ? `<div><strong>Extras:</strong> ${state.extras.join(', ')}</div>` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.8rem; border-top: 1px dashed var(--baby-blue-border);">
            <div class="qty-counter">
              <button class="qty-btn" onclick="updateCustomizerQty(-1)">-</button>
              <span style="font-weight: 800; font-size: 1.1rem;" id="summary-qty-text">${state.quantity}</span>
              <button class="qty-btn" onclick="updateCustomizerQty(1)">+</button>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">TOTAL DE TU ORDEN</div>
              <div style="font-size: ${prod.showPublicPrice ? '1.35rem' : '0.88rem'}; font-weight: 800; color: ${prod.showPublicPrice ? 'var(--accent-green)' : 'var(--accent-gold-dark)'};" id="summary-price-text">
                ${prod.showPublicPrice ? `$${finalPrice.toFixed(2)}` : 'Precio disponible al ordenar'}
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
          <button onclick="setCustomizerStep(2)" class="btn-secondary" style="flex: 1; justify-content: center; padding: 0.95rem;">
            ⬅️ Atrás (Sabores)
          </button>
          <button onclick="confirmAddToCart()" class="btn-primary" style="flex: 2; justify-content: center; padding: 0.95rem; font-size: 1.05rem;">
            🛒 Añadir al Carrito
          </button>
        </div>
      </div>
    `;
  }

  function updateCustomizerSummaryDOM() {
    const state = activeCustomizerState;
    if (!state) return;

    const szText = document.getElementById('summary-size-text');
    if (szText) szText.textContent = state.size;

    const flvText = document.getElementById('summary-flavors-text');
    if (flvText) {
      let str = state.flavors.length > 0 ? `Frutas/Sabores: ${state.flavors.join(', ')}` : 'Sin frutas seleccionadas';
      if (state.extras.length > 0) str += ` | Extras: ${state.extras.join(', ')}`;
      flvText.textContent = str;
    }

    const qtyText = document.getElementById('summary-qty-text');
    if (qtyText) qtyText.textContent = state.quantity;

    const warningBox = document.getElementById('flavor-warning-rect-modal');
    if (warningBox) {
      warningBox.style.display = state.flavors.length >= 3 ? 'flex' : 'none';
    }

    const badgeText = document.getElementById('mega-te-counter-badge');
    if (badgeText) badgeText.textContent = `${state.flavors.length} Sabor${state.flavors.length === 1 ? '' : 'es'} Seleccionado${state.flavors.length === 1 ? '' : 's'}`;

    const headerText = document.getElementById('mega-te-counter-header');
    if (headerText) headerText.textContent = `${state.flavors.length} Seleccionados`;
  }

  window.closeCustomizerModal = () => {
    let modal = document.getElementById('customizer-modal');
    if (modal) modal.remove();
  };

  window.setCustomizerMode = (mode) => {
    activeCustomizerState.mode = mode;
    const container = document.getElementById('customizer-options-container');
    if (container) {
      container.innerHTML = renderCustomizerOptionsContentHTML();
    }
    const origBtn = document.getElementById('mode-btn-original');
    const persBtn = document.getElementById('mode-btn-personaliza');
    if (origBtn) origBtn.classList.toggle('selected', mode === 'original');
    if (persBtn) persBtn.classList.toggle('selected', mode === 'personaliza');
    updateCustomizerSummaryDOM();
  };

  window.setCustomizerSize = (sz, el) => {
    activeCustomizerState.size = sz;
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        parent.querySelectorAll('.flavor-chip').forEach(c => c.classList.remove('selected'));
      }
      el.classList.add('selected');
    }
    updateCustomizerSummaryDOM();
  };

  window.toggleCustomizerFlavor = (flv, el) => {
    const idx = activeCustomizerState.flavors.indexOf(flv);
    
    if (idx !== -1) {
      activeCustomizerState.flavors.splice(idx, 1);
      if (el) {
        el.classList.remove('selected');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '+';
      }
    } else {
      activeCustomizerState.flavors.push(flv);
      if (el) {
        el.classList.add('selected');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '✓';
      }
    }
    updateCustomizerSummaryDOM();
  };

  window.toggleCustomizerIngredient = (ing, el) => {
    const idx = activeCustomizerState.ingredients.indexOf(ing);
    if (idx !== -1) {
      activeCustomizerState.ingredients.splice(idx, 1);
      if (el) {
        el.classList.remove('active');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '+';
      }
    } else {
      activeCustomizerState.ingredients.push(ing);
      if (el) {
        el.classList.add('active');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '✓';
      }
    }
    updateCustomizerSummaryDOM();
  };

  window.toggleCustomizerExtra = (ext, el) => {
    const idx = activeCustomizerState.extras.indexOf(ext);
    if (idx !== -1) {
      activeCustomizerState.extras.splice(idx, 1);
      if (el) {
        el.classList.remove('active');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '+';
      }
    } else {
      activeCustomizerState.extras.push(ext);
      if (el) {
        el.classList.add('active');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '✓';
      }
    }
    updateCustomizerSummaryDOM();
  };

  window.updateCustomizerQty = (delta) => {
    activeCustomizerState.quantity = Math.max(1, activeCustomizerState.quantity + delta);
    renderCustomizerModalHTML();
  };

  window.confirmAddToCart = () => {
    const prod = activeModalProduct;
    const state = activeCustomizerState;
    if (!prod || !state) return;

    const defaultBase = prod.baseIngredients || ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'];
    const activeIngredients = [...state.ingredients];
    const removedBase = defaultBase.filter(b => !activeIngredients.includes(b));

    store.addToCart({
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      mode: state.mode,
      size: state.size,
      flavors: [...state.flavors],
      ingredients: activeIngredients,
      removedBase: removedBase,
      defaultBase: defaultBase,
      extras: [...state.extras],
      quantity: state.quantity,
      unitPrice: calculateCustomizerPrice() / state.quantity,
      showPublicPrice: prod.showPublicPrice
    });

    closeCustomizerModal();
    alert(`¡${prod.name} añadido a tu carrito!`);
  };

  // --- CREAR MI MEZCLA STEP WIZARD VIEW ---
  function renderCustomMixWizardView() {
    appContainer.innerHTML = `
      <section class="wizard-container">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="font-size: 2.2rem; font-weight: 900;" class="hero-title">Crea Tu Mezcla</h1>
          <p style="color: var(--text-secondary);">Si no está en el menú, crea tu combinación completamente a tu manera.</p>
        </div>

        <!-- PROGRESS BAR -->
        <div class="wizard-progress">
          <div class="wizard-step-num ${activeWizardStep >= 1 ? 'active' : ''}">1</div>
          <div class="wizard-step-num ${activeWizardStep >= 2 ? 'active' : ''}">2</div>
          <div class="wizard-step-num ${activeWizardStep >= 3 ? 'active' : ''}">3</div>
          <div class="wizard-step-num ${activeWizardStep >= 4 ? 'active' : ''}">4</div>
          <div class="wizard-step-num ${activeWizardStep >= 5 ? 'active' : ''}">5</div>
        </div>

        <!-- STEP CONTENT -->
        <div class="step-card">
          ${renderWizardStepContent()}
        </div>

        <!-- WIZARD NAV -->
        <div class="wizard-nav">
          ${activeWizardStep > 1 ? `
            <button onclick="setWizardStep(${activeWizardStep - 1})" class="btn-secondary">
              &larr; Paso Anterior
            </button>
          ` : '<div></div>'}

          ${activeWizardStep < 5 ? `
            <button onclick="setWizardStep(${activeWizardStep + 1})" class="btn-primary">
              Siguiente Paso &rarr;
            </button>
          ` : `
            <button onclick="addCustomMixToCart()" class="btn-primary">
              🛒 Añadir Mezcla al Carrito
            </button>
          `}
        </div>
      </section>
    `;
  }

  function renderWizardStepContent() {
    switch (activeWizardStep) {
      case 1:
        return `
          <h2 class="step-title">Paso 1: Elige tu base (4 Incluidos por Defecto)</h2>
          <p class="step-desc">Tú eliges cuáles elementos base deseas incluir en tu bebida</p>
          <div class="ingredient-list">
            ${['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'].map(b => `
              <div class="flavor-chip ${wizardData.base.includes(b) ? 'selected' : ''}" onclick="toggleWizardBase('${b}')">
                ${wizardData.base.includes(b) ? '✓' : '+'} ${b}
              </div>
            `).join('')}
          </div>
        `;
      case 2:
        return `
          <h2 class="step-title">Paso 2: Elige tu tamaño</h2>
          <p class="step-desc">Selecciona la presentación ideal para tu antojo</p>
          <div class="option-mode-grid">
            <div class="mode-choice-card ${wizardData.size === '32 oz' ? 'selected' : ''}" onclick="setWizardSize('32 oz')">
              <div class="mode-choice-title">Mega Té</div>
              <div class="mode-choice-sub">32 oz — Para llevar al máximo</div>
            </div>
            <div class="mode-choice-card ${wizardData.size === '16 oz' ? 'selected' : ''}" onclick="setWizardSize('16 oz')">
              <div class="mode-choice-title">Versa To Go</div>
              <div class="mode-choice-sub">16 oz — Formato práctico</div>
            </div>
          </div>
        `;
      case 3:
        return `
          <h2 class="step-title">Paso 3: Elige tus sabores</h2>
          <p class="step-desc">Combina tus sabores frutales favoritos (puedes seleccionar varios)</p>
          
          <div id="wizard-flavor-warning" class="flavor-warning-rect" style="display: ${wizardData.flavors.length >= 3 ? 'flex' : 'none'};">
            <span class="flavor-warning-icon">⚠️</span>
            <div>
              <strong>Aviso de Sabores:</strong> Las primeras 2 frutas/sabores están incluidas sin costo adicional. A partir del 3er sabor en adelante, aplica un cargo adicional.
            </div>
          </div>

          <div class="ingredient-list" style="max-height: 280px; overflow-y: auto; padding-right: 0.5rem;">
            ${window.VERSTAIL_FLAVORS.map(flv => `
              <div class="flavor-chip ${wizardData.flavors.includes(flv) ? 'selected' : ''}" onclick="toggleWizardFlavor('${flv}', this)">
                <span class="chip-icon">${wizardData.flavors.includes(flv) ? '✓' : '+'}</span> ${flv}
              </div>
            `).join('')}
          </div>
        `;
      case 4:
        return `
          <h2 class="step-title">Paso 4: Extras & Potenciadores</h2>
          <p class="step-desc">Añade beneficios de digestión, salud intestinal o dulzura natural</p>
          
          <div style="background: rgba(245, 158, 11, 0.12); border: 1.5px solid rgba(245, 158, 11, 0.4); padding: 0.75rem 0.9rem; border-radius: var(--radius-md); color: #B45309; font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">🍯</span>
            <div>
              <strong>Aviso de Extras:</strong> Miel de Agave (+$0.75), Fibra Activa (+$1.50) y Probiótico Boost (+$1.50) son extras opcionales con cargo adicional.
            </div>
          </div>

          <div class="ingredient-list">
            ${['Fibra Activa', 'Probiótico Boost', 'Miel de Agave'].map(ext => {
              const extObj = store.getIngredients().find(i => i.name === ext);
              const costVal = extObj ? extObj.extraCost : (ext === 'Miel de Agave' ? 0.75 : 1.50);
              return `
                <div class="ingredient-chip ${wizardData.extras.includes(ext) ? 'active' : ''}" onclick="toggleWizardExtra('${ext}', this)">
                  <span class="chip-icon">${wizardData.extras.includes(ext) ? '✓' : '+'}</span> ${ext} <span style="font-size: 0.78rem; font-weight: 800; opacity: 0.9;">(+$${costVal.toFixed(2)})</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      case 5:
        return `
          <h2 class="step-title">Paso 5: Vista Previa de tu Mezcla</h2>
          <p class="step-desc">Confirma la combinación única que creaste</p>
          
          ${wizardData.flavors.length >= 3 ? `
            <div class="flavor-warning-rect">
              <span class="flavor-warning-icon">⚠️</span>
              <div>
                <strong>Aviso de Sabores:</strong> Las primeras 2 frutas/sabores están incluidas sin costo adicional. A partir del 3er sabor en adelante, aplica un cargo adicional.
              </div>
            </div>
          ` : ''}

          <div class="live-summary-box">
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--secondary-baby-blue-hover);">TU MEZCLA PERSONALIZADA (${wizardData.size})</div>
            <div style="margin-top: 0.75rem; font-size: 0.9rem;">
              <p><strong>Base:</strong> ${wizardData.base.join(' + ') || 'Sin base'}</p>
              <p><strong>Sabores:</strong> ${wizardData.flavors.join(', ') || 'Sin sabor seleccionado'}</p>
              <p><strong>Extras:</strong> ${wizardData.extras.join(', ') || 'Ninguno'}</p>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1.25rem;">
              <div class="qty-counter">
                <button class="qty-btn" onclick="updateWizardQty(-1)">-</button>
                <span style="font-weight: 800;">${wizardData.quantity}</span>
                <button class="qty-btn" onclick="updateWizardQty(1)">+</button>
              </div>
            </div>
          </div>
        `;
    }
  }

  window.setWizardStep = (step) => {
    activeWizardStep = step;
    renderCustomMixWizardView();
  };

  window.toggleWizardBase = (b, el) => {
    const idx = wizardData.base.indexOf(b);
    if (idx !== -1) {
      wizardData.base.splice(idx, 1);
      if (el) {
        el.classList.remove('selected');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '+';
      }
    } else {
      wizardData.base.push(b);
      if (el) {
        el.classList.add('selected');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '✓';
      }
    }
  };

  window.setWizardSize = (sz) => {
    wizardData.size = sz;
    renderCustomMixWizardView();
  };

  window.toggleWizardFlavor = (flv, el) => {
    const idx = wizardData.flavors.indexOf(flv);
    if (idx !== -1) {
      wizardData.flavors.splice(idx, 1);
      if (el) {
        el.classList.remove('selected');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '+';
      }
    } else {
      wizardData.flavors.push(flv);
      if (el) {
        el.classList.add('selected');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '✓';
      }
    }
    const warn = document.getElementById('wizard-flavor-warning');
    if (warn) warn.style.display = wizardData.flavors.length >= 3 ? 'flex' : 'none';
  };

  window.toggleWizardExtra = (ext, el) => {
    const idx = wizardData.extras.indexOf(ext);
    if (idx !== -1) {
      wizardData.extras.splice(idx, 1);
      if (el) {
        el.classList.remove('active');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '+';
      }
    } else {
      wizardData.extras.push(ext);
      if (el) {
        el.classList.add('active');
        const icon = el.querySelector('.chip-icon');
        if (icon) icon.textContent = '✓';
      }
    }
  };

  window.updateWizardQty = (delta) => {
    wizardData.quantity = Math.max(1, wizardData.quantity + delta);
    renderCustomMixWizardView();
  };

  window.addCustomMixToCart = () => {
    store.addToCart({
      productId: 'custom-mix-' + Date.now(),
      name: `Mezcla Personalizada ${wizardData.size}`,
      category: 'custom-mix',
      mode: 'personaliza',
      size: wizardData.size,
      base: [...wizardData.base],
      flavors: [...wizardData.flavors],
      ingredients: [...wizardData.base],
      extras: [...wizardData.extras],
      quantity: wizardData.quantity,
      unitPrice: 8.50,
      showPublicPrice: false
    });

    alert('¡Tu mezcla personalizada ha sido añadida al carrito!');
    window.location.hash = 'carrito';
  };

  function formatItemBaseText(item) {
    if (item.removedBase && Array.isArray(item.removedBase)) {
      if (item.removedBase.length === 0) return 'Como Sale';
      return item.removedBase.map(r => `Sin ${r}`).join(', ');
    }

    const defaultBaseMap = {
      'mega-te': ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
      'versa-to-go': ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
      'batidas': ['Proteína Nutricional'],
      'yogurt': ['Yogurt Cremoso', 'Fresas Frescas', 'Guineo Sliced', 'Blueberries', 'Granola Crunch'],
      'galletas': ['Mezcla Proteica Horneada'],
      'donas': ['Maza Fit']
    };

    const defaultBase = item.defaultBase || defaultBaseMap[item.category] || ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'];
    const activeIngredients = item.ingredients || item.base;

    if (Array.isArray(activeIngredients)) {
      const removed = defaultBase.filter(b => !activeIngredients.includes(b));
      if (removed.length === 0) {
        return 'Como Sale';
      }
      return removed.map(r => `Sin ${r}`).join(', ');
    }

    return 'Como Sale';
  }

  // --- CART VIEW ---
  function renderCartView() {
    const cart = store.getCart();

    if (cart.length === 0) {
      appContainer.innerHTML = `
        <section class="section-container">
          <div class="empty-cart-state">
            <div class="empty-cart-icon">🛒</div>
            <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem;">Tu carrito está vacío</h2>
            <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 1.5rem;">
              Todavía no has elegido tu próximo antojo. Explora nuestro menú o crea tu propia combinación.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="#home" class="btn-primary">Explora el Menú</a>
              <a href="#crear-mi-mezcla" class="btn-secondary">Crear Mi Mezcla</a>
            </div>
          </div>
        </section>
      `;
      return;
    }

    appContainer.innerHTML = `
      <section class="section-container">
        <h1 class="section-title" style="font-size: 2rem; margin-bottom: 1.5rem;">Tu Carrito de Compras</h1>

        <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
          <div style="background: var(--bg-card-dark); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.25rem;">
            ${cart.map(item => `
              <div class="cart-item-row">
                <div style="font-size: 2rem;">${getCategoryIcon(item.category)}</div>
                <div class="cart-item-info">
                  <div class="cart-item-title">${item.name} (${item.size || 'Estándar'})</div>
                  <div class="cart-item-meta" style="margin-top: 0.35rem; line-height: 1.45;">
                    <div><strong>Base:</strong> ${formatItemBaseText(item)}</div>
                    ${item.flavors && item.flavors.length > 0 ? `<div><strong>Frutas/Sabores:</strong> ${item.flavors.join(', ')}</div>` : ''}
                    ${item.extras && item.extras.length > 0 ? `<div><strong>Extras:</strong> ${item.extras.join(', ')}</div>` : ''}
                  </div>
                  <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 1rem;">
                    <div class="qty-counter">
                      <button class="qty-btn" onclick="updateCartItemQty('${item.cartId}', ${item.quantity - 1})">-</button>
                      <span>${item.quantity}</span>
                      <button class="qty-btn" onclick="updateCartItemQty('${item.cartId}', ${item.quantity + 1})">+</button>
                    </div>
                    <button onclick="removeCartItem('${item.cartId}')" style="background: none; color: #EF4444; font-size: 0.85rem; font-weight: 700;">Eliminar</button>
                  </div>
                </div>
              </div>
            `).join('')}

            <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
              <button onclick="clearUserCart()" class="btn-secondary" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;">
                Vaciar Carrito
              </button>
              <a href="#checkout" class="btn-primary">
                Proceder al Checkout &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  window.updateCartItemQty = (cartId, qty) => { store.updateCartQty(cartId, qty); };
  window.removeCartItem = (cartId) => { store.removeFromCart(cartId); };
  window.clearUserCart = () => { if (confirm('¿Vaciar tu carrito?')) store.clearCart(); };

  const PUERTO_RICO_TOWNS = [
    "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito", "Añasco", "Arecibo", "Arroyo",
    "Barceloneta", "Barranquitas", "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas", "Carolina",
    "Cataño", "Cayey", "Ceiba", "Ciales", "Cidra", "Coamo", "Comerío", "Corozal", "Culebra",
    "Dorado", "Fajardo", "Florida", "Guánica", "Guayama", "Guayanilla", "Guaynabo", "Gurabo",
    "Hatillo", "Hormigueros", "Humacao", "Isabela", "Jayuya", "Juana Díaz", "Juncos", "Lajas",
    "Lares", "Las Marías", "Las Piedras", "Loíza", "Luquillo", "Manatí", "Maricao", "Maunabo",
    "Mayagüez", "Moca", "Morovis", "Naguabo", "Naranjito", "Orocovis", "Patillas", "Peñuelas",
    "Ponce", "Quebradillas", "Rincón", "Río Grande", "Sabana Grande", "Salinas", "San Germán",
    "San Juan", "San Lorenzo", "San Sebastián", "Santa Isabel", "Toa Alta", "Toa Baja",
    "Trujillo Alto", "Utuado", "Vega Alta", "Vega Baja", "Vieques", "Villalba", "Yabucoa", "Yauco"
  ];

  function renderCheckoutView() {
    const cart = store.getCart();
    const settings = store.getSettings();

    if (cart.length === 0) {
      renderCartView();
      return;
    }

    appContainer.innerHTML = `
      <section class="section-container" style="max-width: 550px;">
        <h1 class="section-title" style="font-size: 2rem; margin-bottom: 0.5rem; text-align: center;">Finalizar Pedido</h1>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; text-align: center;">Ingresa tus datos para registrar tu orden directamente en la cocina de Versátil Nutrition.</p>

        <form id="checkout-form" onsubmit="handleCheckoutSubmit(event)" style="background: #FFFFFF; border: 1.5px solid var(--baby-blue-border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--card-shadow);">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input type="text" id="cust-name" class="form-input" required placeholder="Ej. Maria Lopez" />
          </div>

          <div class="form-group">
            <label>Teléfono de Contacto *</label>
            <input type="tel" id="cust-phone" class="form-input" required placeholder="Ej. 939-312-0599" />
          </div>

          <div class="form-group">
            <label>Municipio de Entrega / Recogido (Puerto Rico) *</label>
            <select id="cust-town" class="form-input" required style="font-weight: 700; cursor: pointer;">
              <option value="" disabled selected>-- Selecciona tu Municipio --</option>
              ${PUERTO_RICO_TOWNS.map(town => `<option value="${town}">${town}</option>`).join('')}
            </select>
          </div>

          ${settings.askCustomerEmail ? `
            <div class="form-group">
              <label>Correo Electrónico (Opcional)</label>
              <input type="email" id="cust-email" class="form-input" placeholder="maria@ejemplo.com" />
            </div>
          ` : ''}

          <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-surface); border: 1px solid var(--baby-blue-border); border-radius: var(--radius-md);">
            <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 0.3rem; color: var(--text-primary);">Resumen de Antojos</div>
            <div style="font-size: 0.88rem; color: var(--text-secondary);">
              ${cart.length} antojo${cart.length > 1 ? 's' : ''} listo${cart.length > 1 ? 's' : ''} para ingresar a preparación
            </div>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1rem; font-size: 1.1rem; justify-content: center;">
            🍹 Confirmar y Enviar Pedido
          </button>
        </form>
      </section>
    `;
  }

  let activeCompletedOrder = null;

  function renderOrderConfirmationView() {
    let order = activeCompletedOrder;
    if (!order) {
      try {
        const cached = sessionStorage.getItem('versatil_last_order');
        if (cached) order = JSON.parse(cached);
      } catch (e) {}
    }

    if (!order || !order.items || order.items.length === 0) {
      appContainer.innerHTML = `
        <section class="section-container" style="max-width: 550px; text-align: center; padding-top: 3rem;">
          <div style="background: #FFFFFF; border: 1.5px solid var(--baby-blue-border); border-radius: var(--radius-lg); padding: 2.5rem 1.5rem; box-shadow: var(--card-shadow);">
            <div style="font-size: 3.5rem; margin-bottom: 1rem;">🍹</div>
            <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 0.5rem; color: var(--text-primary);">¡Bienvenido a Versátil!</h1>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">No encontramos un pedido reciente.</p>
            <a href="#home" class="btn-primary">Explora el Menú</a>
          </div>
        </section>
      `;
      return;
    }

    const settings = store.getSettings();

    appContainer.innerHTML = `
      <section class="section-container" style="max-width: 620px; text-align: center; padding-top: 1.5rem;">
        <div style="background: #FFFFFF; border: 2px solid var(--secondary-baby-blue); border-radius: var(--radius-lg); padding: 2.25rem 1.5rem; box-shadow: 0 15px 40px rgba(56, 189, 248, 0.18);">
          
          <div style="width: 80px; height: 80px; background: rgba(16, 185, 129, 0.12); border: 2.5px solid #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.6rem; margin: 0 auto 1.25rem; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25);">
            🎉
          </div>

          <h1 style="font-size: 2rem; font-weight: 900; color: #059669; margin-bottom: 0.3rem;">
            ¡Pedido Recibido con Éxito!
          </h1>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
            Orden #${order.id}
          </div>

          <div style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.3); padding: 1.1rem 1.25rem; border-radius: var(--radius-md); text-align: center; margin-bottom: 1.5rem; line-height: 1.5;">
            <div style="font-weight: 900; color: #059669; font-size: 1.05rem; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
              <span>✅</span> ¡Orden Registrada Exitosamente!
            </div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
              ¡Muchas gracias <strong>${order.customerName}</strong>! Tu pedido ha sido procesado e ingresado directamente a nuestro sistema en <strong>Versátil Nutrition</strong>. Nos pondremos en contacto contigo al <strong>${order.customerPhone}</strong>.
            </p>
          </div>

          <div style="background: var(--bg-surface); border: 1.5px solid var(--baby-blue-border); border-radius: var(--radius-md); padding: 1.25rem; text-align: left; margin-bottom: 1.75rem;">
            <div style="font-weight: 900; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.75rem; border-bottom: 1px solid var(--baby-blue-border); padding-bottom: 0.5rem;">
              📋 Detalle de tus Antojos:
            </div>
            
            ${order.items.map(item => `
              <div style="margin-bottom: 0.85rem; padding-bottom: 0.85rem; border-bottom: 1px dashed var(--baby-blue-border);">
                <div style="font-weight: 800; font-size: 0.98rem; color: var(--text-primary);">
                  ${getCategoryIcon(item.category)} ${item.name} (${item.size || 'Estándar'}) x${item.quantity}
                </div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.3rem; line-height: 1.45;">
                  <div><strong>Base:</strong> ${formatItemBaseText(item)}</div>
                  ${item.flavors && item.flavors.length > 0 ? `<div><strong>Frutas/Sabores:</strong> ${item.flavors.join(', ')}</div>` : ''}
                  ${item.extras && item.extras.length > 0 ? `<div><strong>Extras:</strong> ${item.extras.join(', ')}</div>` : ''}
                </div>
              </div>
            `).join('')}

            <div style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 0.75rem; padding-top: 0.5rem;">
              <div><strong>Cliente:</strong> ${order.customerName}</div>
              <div><strong>Teléfono:</strong> ${order.customerPhone}</div>
              ${order.customerTown ? `<div><strong>Municipio:</strong> ${order.customerTown}</div>` : ''}
              ${order.customerEmail ? `<div><strong>Email:</strong> ${order.customerEmail}</div>` : ''}
            </div>
          </div>

          <div style="display: flex; gap: 0.85rem; justify-content: center; flex-wrap: wrap;">
            <a href="#home" class="btn-primary" style="flex: 1; min-width: 170px; justify-content: center;">
              🏠 Volver al Inicio
            </a>
            <a href="#crear-mi-mezcla" class="btn-secondary" style="flex: 1; min-width: 170px; justify-content: center;">
              🍹 Crear Otro Pedido
            </a>
          </div>

        </div>
      </section>
    `;
  }

  window.handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const town = document.getElementById('cust-town') ? document.getElementById('cust-town').value : '';
    const email = document.getElementById('cust-email') ? document.getElementById('cust-email').value : '';

    const cart = store.getCart();
    const settings = store.getSettings();

    if (cart.length === 0) {
      window.location.hash = 'home';
      return;
    }

    const newOrder = store.addOrder({
      customerName: name,
      customerPhone: phone,
      customerTown: town,
      customerEmail: email,
      items: cart
    });

    activeCompletedOrder = newOrder;
    try {
      sessionStorage.setItem('versatil_last_order', JSON.stringify(newOrder));
    } catch (err) {}

    store.clearCart();

    // Notify backend/store systems silently in background
    if (window.VerstailWhatsApp && window.VerstailWhatsApp.sendMetaWhatsAppCloudNotification) {
      window.VerstailWhatsApp.sendMetaWhatsAppCloudNotification(newOrder, settings);
    }

    // Direct in-app confirmation screen without taking user to WhatsApp
    window.location.hash = 'confirmacion';
  };

  // ==========================================================================
  // ADMIN PORTAL VIEWS & AUTHENTICATION
  // ==========================================================================

  function renderAdminPortal() {
    if (!store.isLoggedInAdmin()) {
      appContainer.innerHTML = `
        <section class="section-container" style="max-width: 440px; padding-top: 3rem;">
          <div style="background: var(--bg-card-dark); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 2rem; text-align: center;">
            <img src="assets/images/logo.jpg" alt="Logo" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid var(--primary); margin-bottom: 1rem; object-fit: contain; background: white;" />
            <h1 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 0.25rem;">Acceso Administrativo</h1>
            <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 1.5rem;">Ingresa tus credenciales de administrador</p>
            
            <form onsubmit="handleAdminLoginSubmit(event)">
              <div class="form-group" style="text-align: left;">
                <label>Usuario *</label>
                <input type="text" id="admin-user" class="form-input" required placeholder="Ingresa tu usuario" autocomplete="username" />
              </div>
              <div class="form-group" style="text-align: left;">
                <label>Contraseña *</label>
                <input type="password" id="admin-pass" class="form-input" required placeholder="••••••••" autocomplete="current-password" />
              </div>
              <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1.25rem; padding: 0.85rem; justify-content: center;">
                🔒 Iniciar Sesión
              </button>
            </form>
          </div>
        </section>
      `;
      return;
    }

    const subRoute = currentRoute.replace('admin/', '').replace('admin', 'dashboard');

    appContainer.innerHTML = `
      <div class="admin-layout">
        <!-- MOBILE ADMIN NAVIGATION BAR -->
        <nav class="admin-mobile-nav">
          <a href="#admin/dashboard" class="admin-mobile-nav-item ${subRoute === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
          <a href="#admin/products" class="admin-mobile-nav-item ${subRoute === 'products' ? 'active' : ''}">🍹 Productos</a>
          <a href="#admin/ingredients" class="admin-mobile-nav-item ${subRoute === 'ingredients' ? 'active' : ''}">🧪 Ingredientes</a>
          <a href="#admin/categories" class="admin-mobile-nav-item ${subRoute === 'categories' ? 'active' : ''}">📁 Categorías</a>
          <a href="#admin/orders" class="admin-mobile-nav-item ${subRoute === 'orders' ? 'active' : ''}">📦 Órdenes</a>
          <a href="#admin/settings" class="admin-mobile-nav-item ${subRoute === 'settings' ? 'active' : ''}">📲 Config / WhatsApp</a>
          <a href="javascript:void(0)" onclick="logoutAdmin()" class="admin-mobile-nav-item logout-item">🚪 Salir</a>
          <a href="#home" class="admin-mobile-nav-item">🏠 Storefront</a>
        </nav>

        <!-- SIDEBAR -->
        <div class="admin-sidebar">
          <div style="font-weight: 900; font-size: 1.2rem; color: #7C3AED; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>⚙️</span> Administración
          </div>
          <a href="#admin/dashboard" class="admin-nav-item ${subRoute === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
          <a href="#admin/products" class="admin-nav-item ${subRoute === 'products' ? 'active' : ''}">🍹 Productos</a>
          <a href="#admin/ingredients" class="admin-nav-item ${subRoute === 'ingredients' ? 'active' : ''}">🧪 Ingredientes</a>
          <a href="#admin/categories" class="admin-nav-item ${subRoute === 'categories' ? 'active' : ''}">📁 Categorías</a>
          <a href="#admin/orders" class="admin-nav-item ${subRoute === 'orders' ? 'active' : ''}">📦 Órdenes</a>
          <a href="#admin/settings" class="admin-nav-item ${subRoute === 'settings' ? 'active' : ''}">📲 WhatsApp / Config</a>
          
          <button onclick="logoutAdmin()" class="admin-nav-item" style="background: none; border: none; width: 100%; text-align: left; color: #EF4444; margin-top: 1.5rem; cursor: pointer;">
            🚪 Cerrar Sesión
          </button>
          
          <a href="#home" class="admin-nav-item" style="margin-top: auto; color: var(--text-muted);">&larr; Volver al Storefront</a>
        </div>

        <!-- MAIN CONTENT -->
        <div class="admin-content">
          ${renderAdminSubRoute(subRoute)}
        </div>
      </div>
    `;
  }

  window.handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;

    if (store.authenticateAdmin(user, pass)) {
      renderAdminPortal();
    } else {
      alert('Usuario o contraseña incorrectos.');
    }
  };

  window.logoutAdmin = () => {
    store.logoutAdmin();
    renderAdminPortal();
  };

  function renderAdminSubRoute(subRoute) {
    switch (subRoute) {
      case 'products':
        return renderAdminProductsHTML();
      case 'ingredients':
        return renderAdminIngredientsHTML();
      case 'categories':
        return renderAdminCategoriesHTML();
      case 'orders':
        return renderAdminOrdersHTML();
      case 'settings':
        return renderAdminSettingsHTML();
      default:
        return renderAdminDashboardHTML();
    }
  }

  function calculateOrderTotal(order) {
    if (!order || !order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => {
      const price = typeof item.unitPrice === 'number' ? item.unitPrice : (item.price || 0);
      const qty = item.quantity || 1;
      return sum + (price * qty);
    }, 0);
  }

  function getRevenueMetrics(orders) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    let daily = 0, weekly = 0, monthly = 0, yearly = 0;

    (orders || []).forEach(o => {
      const oTime = new Date(o.createdAt).getTime();
      const total = calculateOrderTotal(o);

      if (!isNaN(oTime)) {
        if (oTime >= startOfDay) daily += total;
        if (oTime >= startOfWeek) weekly += total;
        if (oTime >= startOfMonth) monthly += total;
        if (oTime >= startOfYear) yearly += total;
      }
    });

    return { daily, weekly, monthly, yearly };
  }

  // --- ADMIN DASHBOARD ---
  function renderAdminDashboardHTML() {
    const products = store.getProducts();
    const orders = store.getOrders();
    const metrics = getRevenueMetrics(orders);

    return `
      <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 1.5rem;">Dashboard de Administración</h1>
      
      <!-- 1. RESUMEN DE INGRESOS GENERADOS (FIRST THING THE CLIENT SEES AT THE TOP) -->
      <div style="margin-bottom: 2rem;">
        <h3 style="font-size: 1.25rem; font-weight: 900; margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <span>💰</span> Resumen de Ingresos Generados
        </h3>
        <div class="admin-stats-grid">
          <div class="stat-card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1.5px solid rgba(16, 185, 129, 0.3);">
            <div class="stat-num" style="color: #059669; font-size: 1.8rem;">$${metrics.daily.toFixed(2)}</div>
            <div class="stat-label" style="font-weight: 800; color: var(--text-primary);">Ventas de Hoy</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 100%); border: 1.5px solid var(--baby-blue-border);">
            <div class="stat-num" style="color: var(--secondary-baby-blue-hover); font-size: 1.8rem;">$${metrics.weekly.toFixed(2)}</div>
            <div class="stat-label" style="font-weight: 800; color: var(--text-primary);">Ventas esta Semana</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%); border: 1.5px solid var(--gold-border);">
            <div class="stat-num" style="color: #D97706; font-size: 1.8rem;">$${metrics.monthly.toFixed(2)}</div>
            <div class="stat-label" style="font-weight: 800; color: var(--text-primary);">Ventas este Mes</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0.02) 100%); border: 1.5px solid rgba(124, 58, 237, 0.3);">
            <div class="stat-num" style="color: #7C3AED; font-size: 1.8rem;">$${metrics.yearly.toFixed(2)}</div>
            <div class="stat-label" style="font-weight: 800; color: var(--text-primary);">Ventas este Año</div>
          </div>
        </div>
      </div>

      <!-- 2. CATÁLOGO & MÉTRICAS DE OPERACIÓN -->
      <div class="admin-stats-grid" style="margin-bottom: 2rem;">
        <div class="stat-card">
          <div class="stat-num">${products.length}</div>
          <div class="stat-label">Total Productos</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${products.filter(p => p.active).length}</div>
          <div class="stat-label">Productos Activos</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${products.filter(p => p.featured).length}</div>
          <div class="stat-label">Destacados</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${orders.length}</div>
          <div class="stat-label">Órdenes Registradas</div>
        </div>
      </div>

      <!-- 3. ÓRDENES RECIENTES -->
      <div style="background: #FFFFFF; border: 1.5px solid var(--baby-blue-border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--card-shadow);">
        <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem;">Órdenes Recientes</h3>
        ${orders.length > 0 ? `
          <!-- DESKTOP TABLE VIEW -->
          <div class="desktop-order-view table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Municipio</th>
                  <th>Estado Pedido</th>
                  <th>Estado de Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice(0, 5).map(o => {
                  const isPaid = o.paymentStatus === 'Pagado';
                  return `
                    <tr style="${isPaid ? 'background: rgba(16, 185, 129, 0.04); border-left: 5px solid #10B981;' : 'background: rgba(239, 68, 68, 0.04); border-left: 5px solid #EF4444;'}">
                      <td><strong>#${o.id}</strong></td>
                      <td>${o.customerName}</td>
                      <td>${o.customerPhone}</td>
                      <td>${o.customerTown || 'PR'}</td>
                      <td><span class="badge-status active">${o.status}</span></td>
                      <td>
                        <select onchange="updateOrderPaymentStatusFromAdmin('${o.id}', this.value)" class="form-input" style="padding: 3px 8px; font-size: 0.82rem; width: auto; font-weight: 800; background: ${isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isPaid ? '#059669' : '#DC2626'}; border: 1.5px solid ${isPaid ? '#10B981' : '#EF4444'}; cursor: pointer;">
                          <option value="No Pagado" ${!isPaid ? 'selected' : ''}>❌ No Pagado</option>
                          <option value="Pagado" ${isPaid ? 'selected' : ''}>💳 Pagado</option>
                        </select>
                      </td>
                      <td>
                        <button onclick="deleteOrderFromAdmin('${o.id}')" style="background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer;">
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- MOBILE CARDS VIEW -->
          ${renderOrderMobileCardsHTML(orders.slice(0, 5))}
        ` : `<p style="color: var(--text-secondary);">No hay órdenes registradas aún.</p>`}
      </div>
    `;
  }

  // --- ADMIN PRODUCTS (REAL-TIME VISIBILITY & SOLD OUT CONTROLS) ---
  function renderAdminProductsHTML() {
    const products = store.getProducts();

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 900;">Gestión de Productos</h1>
          <p style="color: var(--text-secondary); font-size: 0.88rem;">Controla la visibilidad y disponibilidad (Agotado / Sold Out) en tiempo real.</p>
        </div>
        <button onclick="openProductEditorModal()" class="btn-primary">+ Nuevo Producto</button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio Público</th>
              <th>Costo Interno</th>
              <th>Visibilidad en Sitio (Remover)</th>
              <th>Estado Agotado (Sold Out)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td><span style="font-size: 0.85rem; font-weight: 700; background: var(--bg-surface); padding: 2px 8px; border-radius: 6px;">${p.category}</span></td>
                <td style="color: var(--accent-green); font-weight: 800;">$${Number(p.publicPrice || 0).toFixed(2)}</td>
                <td style="color: #D97706; font-weight: 800;">$${Number(p.internalCost || 0).toFixed(2)}</td>
                <td>
                  <button onclick="toggleProductActiveFromAdmin('${p.id}')" style="background: ${p.active !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${p.active !== false ? '#059669' : '#DC2626'}; border: 1.5px solid ${p.active !== false ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; padding: 6px 12px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                    ${p.active !== false ? '👁️ Visible' : '🙈 Oculto (Removido)'}
                  </button>
                </td>
                <td>
                  <button onclick="toggleProductSoldOutFromAdmin('${p.id}')" style="background: ${p.soldOut ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-surface)'}; color: ${p.soldOut ? '#D97706' : 'var(--text-secondary)'}; border: 1.5px solid ${p.soldOut ? 'rgba(245, 158, 11, 0.5)' : 'var(--baby-blue-border)'}; padding: 6px 12px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                    ${p.soldOut ? '🚫 AGOTADO (Sold Out)' : '🛒 En Stock'}
                  </button>
                </td>
                <td>
                  <button onclick="openProductEditorModal('${p.id}')" style="background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--baby-blue-border); padding: 5px 12px; border-radius: 6px; font-weight: 800; cursor: pointer;">Editar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  window.toggleProductActiveFromAdmin = (id) => {
    store.toggleProductActive(id);
    renderAdminPortal();
  };

  window.toggleProductSoldOutFromAdmin = (id) => {
    store.toggleProductSoldOut(id);
    renderAdminPortal();
  };

  window.openProductEditorModal = (productId) => {
    const p = productId ? store.getProductBySlug(productId) : {
      name: '', category: 'mega-te', description: '', image: '',
      publicPrice: 8.00, internalCost: 2.50, showPublicPrice: false,
      active: true, soldOut: false, featured: false
    };

    const modalHTML = `
      <div class="modal-backdrop open" id="product-editor-modal">
        <div class="modal-card" style="max-width: 650px;">
          <button onclick="closeProductEditorModal()" class="modal-close-btn">&times;</button>
          <h2 style="font-size: 1.4rem; font-weight: 800;">${p.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          
          <form onsubmit="saveProductFromForm(event, '${p.id || ''}')">
            <div class="form-group">
              <label>Nombre del Producto *</label>
              <input type="text" id="p-name" class="form-input" required value="${p.name || ''}" />
            </div>

            <div class="form-group">
              <label>Categoría *</label>
              <select id="p-category" class="form-input">
                ${store.getCategories().map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <textarea id="p-desc" class="form-input" rows="2">${p.description || ''}</textarea>
            </div>

            <!-- IMAGE FILE UPLOAD / URL SECTION -->
            <div class="form-group">
              <label>Imagen del Producto (Seleccionar archivo de tu dispositivo o celular)</label>
              <input type="file" id="p-file-input" accept="image/*" onchange="handleProductFileSelect(event)" class="form-input" style="padding: 0.4rem; margin-bottom: 0.5rem;" />
              <input type="text" id="p-image" class="form-input" value="${p.image || ''}" placeholder="O URL de imagen (https://...)" />
              <div style="margin-top: 0.5rem;">
                <img id="p-image-preview" src="${p.image || ''}" style="max-height: 100px; border-radius: var(--radius-sm); display: ${p.image ? 'block' : 'none'}; border: 1px solid var(--glass-border);" />
              </div>
            </div>

            <div class="form-row-2col">
              <div class="form-group">
                <label>Precio Público ($) *</label>
                <input type="number" step="0.01" id="p-publicPrice" class="form-input" required value="${p.publicPrice || 0}" />
              </div>
              <div class="form-group">
                <label>Costo Interno ($) * (SÓLO VISIBLE EN ADMIN)</label>
                <input type="number" step="0.01" id="p-internalCost" class="form-input" required value="${p.internalCost || 0}" />
              </div>
            </div>

            <div class="form-group" style="margin-top: 0.5rem;">
              <label class="toggle-switch">
                <input type="checkbox" id="p-showPublicPrice" ${p.showPublicPrice ? 'checked' : ''} />
                <span>Mostrar Precio al Cliente en el Sitio</span>
              </label>
            </div>

            <div class="form-group" style="background: var(--bg-surface); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--baby-blue-border);">
              <label class="toggle-switch">
                <input type="checkbox" id="p-active" ${p.active !== false ? 'checked' : ''} />
                <span>🌐 Mostrar en el Sitio Web (Si desmarcas, se remueve temporalmente)</span>
              </label>
            </div>

            <div class="form-group" style="background: var(--gold-light); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--gold-border);">
              <label class="toggle-switch">
                <input type="checkbox" id="p-soldOut" ${p.soldOut ? 'checked' : ''} />
                <span>🚫 Marcar como AGOTADO / SOLD OUT (Muestra el aviso y bloquea la compra)</span>
              </label>
            </div>

            <div class="form-group">
              <label class="toggle-switch">
                <input type="checkbox" id="p-featured" ${p.featured ? 'checked' : ''} />
                <span>Destacado en Inicio</span>
              </label>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem; justify-content: center;">Guardar Producto</button>
          </form>
        </div>
      </div>
    `;

    let existing = document.getElementById('product-editor-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  };

  window.closeProductEditorModal = () => {
    let modal = document.getElementById('product-editor-modal');
    if (modal) modal.remove();
  };

  function compressAndResizeImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        callback(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function uploadImageToServer(dataUrl) {
    const settings = store.getSettings();
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: dataUrl,
          cloudName: settings.cloudinaryCloudName || '',
          uploadPreset: settings.cloudinaryUploadPreset || ''
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          return json.url;
        }
      }
    } catch (e) {
      console.log('Server image upload fallback to DataURL:', e);
    }
    return dataUrl;
  }

  window.handleProductFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressAndResizeImage(file, async (dataUrl) => {
        const finalUrl = await uploadImageToServer(dataUrl);
        document.getElementById('p-image').value = finalUrl;
        const preview = document.getElementById('p-image-preview');
        if (preview) {
          preview.src = finalUrl;
          preview.style.display = 'block';
        }
      });
    }
  };

  window.saveProductFromForm = (e, productId) => {
    e.preventDefault();
    const existing = productId ? store.getProductBySlug(productId) : null;

    const product = {
      ...(existing || {}),
      id: existing ? existing.id : (productId || 'prod-' + Date.now()),
      name: document.getElementById('p-name').value,
      category: document.getElementById('p-category').value,
      description: document.getElementById('p-desc').value,
      image: document.getElementById('p-image').value,
      publicPrice: parseFloat(document.getElementById('p-publicPrice').value) || 0,
      internalCost: parseFloat(document.getElementById('p-internalCost').value) || 0,
      showPublicPrice: document.getElementById('p-showPublicPrice').checked,
      active: document.getElementById('p-active').checked,
      soldOut: document.getElementById('p-soldOut').checked,
      featured: document.getElementById('p-featured').checked,
      baseIngredients: existing ? existing.baseIngredients : ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
      sizes: existing ? existing.sizes : ['32 oz', '16 oz'],
      flavors: existing ? existing.flavors : (window.MEGA_TE_FLAVORS || ['Fresas', 'Parcha', 'Mango']),
      extras: existing ? existing.extras : ['Fibra Activa', 'Probiótico Boost']
    };

    store.saveProduct(product);
    closeProductEditorModal();
    renderAdminPortal();
  };

  // --- ADMIN INGREDIENTS ---
  function renderAdminIngredientsHTML() {
    const ingredients = store.getIngredients();

    return `
      <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 1.5rem;">Gestión de Ingredientes</h1>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Costo Adicional ($)</th>
              <th>Incluido por Defecto</th>
              <th>Removible</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${ingredients.map(i => `
              <tr>
                <td><strong>${i.name}</strong></td>
                <td>$${Number(i.extraCost || 0).toFixed(2)}</td>
                <td>${i.includedByDefault ? '✅ Sí' : '❌ No'}</td>
                <td>${i.removable ? '✅ Sí' : '❌ No'}</td>
                <td><span class="badge-status ${i.active ? 'active' : 'inactive'}">${i.active ? 'Activo' : 'Inactivo'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- ADMIN CATEGORIES WITH PILLS TOGGLE & IMAGE UPLOAD ---
  function renderAdminCategoriesHTML() {
    const categories = store.getCategories();
    const settings = store.getSettings();

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 900;">Gestión de Categorías</h1>
          <p style="color: var(--text-secondary); font-size: 0.88rem;">Administra las categorías del menú y la visualización de la barra de filtros.</p>
        </div>
      </div>

      <!-- BIG CATEGORY CARDS TOGGLE BANNER -->
      <div style="background: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border); margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--card-shadow);">
        <div>
          <div style="font-weight: 900; font-size: 1rem; color: var(--text-primary);">🖼️ Mostrar Tarjetas Grandes de Categoría ("Explora por Categoría")</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Muestra u oculta la sección superior con tarjetas de iconos grandes en la página principal.
          </div>
        </div>
        <button onclick="toggleBigCategoryCardsFromAdmin()" style="background: ${settings.showBigCategoryCards !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${settings.showBigCategoryCards !== false ? '#059669' : '#DC2626'}; border: 1.5px solid ${settings.showBigCategoryCards !== false ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; padding: 8px 16px; border-radius: var(--radius-full); font-weight: 800; cursor: pointer;">
          ${settings.showBigCategoryCards !== false ? '✅ Activadas (Visibles)' : '🙈 Ocultas'}
        </button>
      </div>

      <!-- CATEGORY PILLS BAR TOGGLE BANNER -->
      <div style="background: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border); margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--card-shadow);">
        <div>
          <div style="font-weight: 900; font-size: 1rem; color: var(--text-primary);">🏷️ Mostrar Barra de Píldoras Pequeñas de Filtro (Sobre Productos)</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Muestra u oculta la pequeña barra de pestañas/píldoras directamente sobre los productos.
          </div>
        </div>
        <button onclick="toggleCategoryPillsFromAdmin()" style="background: ${settings.showCategoryFilterPills ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${settings.showCategoryFilterPills ? '#059669' : '#DC2626'}; border: 1.5px solid ${settings.showCategoryFilterPills ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; padding: 8px 16px; border-radius: var(--radius-full); font-weight: 800; cursor: pointer;">
          ${settings.showCategoryFilterPills ? '✅ Activadas (Visibles en Sitio)' : '🙈 Ocultas (Recomendado)'}
        </button>
      </div>

      <!-- ICON THEME COLOR MODE TOGGLE BANNER -->
      <div style="background: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border); margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--card-shadow);">
        <div>
          <div style="font-weight: 900; font-size: 1rem; color: var(--text-primary);">🎨 Estilo de Colores de Iconos (Hover / Selección)</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Cambia los colores de animación al pasar el mouse o seleccionar una categoría/opción en tiempo real.
          </div>
        </div>
        <button onclick="toggleIconThemeModeFromAdmin()" style="background: var(--gold-light); color: var(--accent-gold-dark); border: 1.5px solid var(--gold-border); padding: 8px 16px; border-radius: var(--radius-full); font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;">
          🎨 ${settings.iconThemeMode === 'classic' ? '🟡 Modo Clásico (Borde Dorado / Centro Azul)' : '🔵 Modo Invertido (Borde Azul / Centro Dorado)'}
        </button>
      </div>

      <!-- CATEGORY CARD CONTENT STYLE TOGGLE BANNER (PICTURES VS EMOJI ICONS) -->
      <div style="background: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--card-shadow);">
        <div>
          <div style="font-weight: 900; font-size: 1rem; color: var(--text-primary);">🖼️ Contenido de Tarjetas Grandes ("Explora por Categoría")</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Elige entre mostrar las <strong>Imágenes de Categoría subidas</strong> o los <strong>Iconos Emojis limpios</strong> en las tarjetas grandes.
          </div>
        </div>
        <button onclick="toggleCategoryCardImagesFromAdmin()" style="background: ${settings.showCategoryCardImages ? 'var(--secondary-baby-blue)' : 'var(--bg-surface)'}; color: ${settings.showCategoryCardImages ? '#FFFFFF' : 'var(--text-primary)'}; border: 1.5px solid var(--baby-blue-border); padding: 8px 16px; border-radius: var(--radius-full); font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;">
          ${settings.showCategoryCardImages ? '🖼️ Mostrar Imágenes en Tarjetas' : '🎨 Mostrar solo Iconos (Emojis)'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Icono</th>
              <th>Categoría</th>
              <th>Imágenes Guardadas</th>
              <th>Modo de Visualización de Imagen</th>
              <th>Estado Visibilidad en Sitio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map(c => `
              <tr>
                <td style="font-size: 1.5rem;">${c.icon}</td>
                <td><strong>${c.name}</strong></td>
                <td>
                  <div style="display: flex; gap: 0.4rem; align-items: center;">
                    <div style="text-align: center;">
                      ${c.image ? `<img src="${c.image}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid var(--baby-blue-border);" title="Imagen 1" />` : '<span style="font-size: 0.75rem; color: var(--text-muted);">Sin Img 1</span>'}
                      <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-secondary);">Img 1</div>
                    </div>
                    <div style="text-align: center;">
                      ${c.image2 ? `<img src="${c.image2}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid var(--baby-blue-border);" title="Imagen 2" />` : '<span style="font-size: 0.75rem; color: var(--text-muted);">Sin Img 2</span>'}
                      <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-secondary);">Img 2</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                    <button onclick="setCategoryActiveImageModeFromAdmin('${c.id}', 'image1')" style="background: ${(c.activeImage || 'image1') === 'image1' ? 'var(--secondary-baby-blue)' : 'var(--bg-surface)'}; color: ${(c.activeImage || 'image1') === 'image1' ? '#FFFFFF' : 'var(--text-primary)'}; border: 1px solid var(--baby-blue-border); padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 800; cursor: pointer;">
                      🖼️ Imagen 1
                    </button>
                    <button onclick="setCategoryActiveImageModeFromAdmin('${c.id}', 'image2')" style="background: ${c.activeImage === 'image2' ? 'var(--secondary-baby-blue)' : 'var(--bg-surface)'}; color: ${c.activeImage === 'image2' ? '#FFFFFF' : 'var(--text-primary)'}; border: 1px solid var(--baby-blue-border); padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 800; cursor: pointer;">
                      🖼️ Imagen 2
                    </button>
                    <button onclick="setCategoryActiveImageModeFromAdmin('${c.id}', 'rotate')" style="background: ${c.activeImage === 'rotate' ? 'var(--accent-gold)' : 'var(--bg-surface)'}; color: ${c.activeImage === 'rotate' ? '#FFFFFF' : 'var(--text-primary)'}; border: 1px solid var(--gold-border); padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 800; cursor: pointer;">
                      🔄 Rotar (5s)
                    </button>
                  </div>
                </td>
                <td>
                  <button onclick="toggleCategoryActiveFromAdmin('${c.id}')" style="background: ${c.active !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${c.active !== false ? '#059669' : '#DC2626'}; border: 1.5px solid ${c.active !== false ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; padding: 6px 14px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 800; cursor: pointer;">
                    ${c.active !== false ? '👁️ Activa (Visible)' : '🙈 Oculta (Desactivada)'}
                  </button>
                </td>
                <td>
                  <button onclick="openCategoryEditorModal('${c.id}')" style="background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--baby-blue-border); padding: 5px 12px; border-radius: 6px; font-weight: 800; cursor: pointer;">✏️ Editar Imágenes</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  window.toggleBigCategoryCardsFromAdmin = () => {
    store.toggleBigCategoryCardsSetting();
    renderAdminPortal();
  };

  window.toggleCategoryPillsFromAdmin = () => {
    store.toggleCategoryFilterPillsSetting();
    renderAdminPortal();
  };

  window.toggleIconThemeModeFromAdmin = () => {
    store.toggleIconThemeMode();
    syncIconThemeMode();
    renderAdminPortal();
  };

  window.toggleCategoryCardImagesFromAdmin = () => {
    const settings = store.getSettings();
    const current = !!settings.showCategoryCardImages;
    store.updateSettings({ showCategoryCardImages: !current });
    renderAdminPortal();
  };

  window.toggleCategoryActiveFromAdmin = (id) => {
    store.toggleCategoryActive(id);
    renderAdminPortal();
  };

  window.setCategoryActiveImageModeFromAdmin = (id, mode) => {
    store.setCategoryActiveImageMode(id, mode);
    renderAdminPortal();
  };

  window.openCategoryEditorModal = (catId) => {
    const cat = store.getCategories().find(c => c.id === catId);
    if (!cat) return;

    const modalHTML = `
      <div class="modal-backdrop open" id="category-editor-modal">
        <div class="modal-card" style="max-width: 580px;">
          <button onclick="closeCategoryEditorModal()" class="modal-close-btn">&times;</button>
          <h2 style="font-size: 1.4rem; font-weight: 800;">Editar Imágenes: ${cat.name}</h2>
          
          <form onsubmit="saveCategoryFromForm(event, '${cat.id}')">
            <div class="form-group">
              <label>Nombre de Categoría *</label>
              <input type="text" id="c-name" class="form-input" required value="${cat.name}" />
            </div>

            <div class="form-group">
              <label>Icono Emoji *</label>
              <input type="text" id="c-icon" class="form-input" required value="${cat.icon}" />
            </div>

            <!-- MODO DE VISUALIZACION DE IMAGEN -->
            <div class="form-group" style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border);">
              <label style="color: var(--secondary-baby-blue-hover); font-weight: 800; font-size: 0.95rem;">🔄 Modo de Visualización de Imagen</label>
              <select id="c-activeImage" class="form-input" style="margin-top: 0.4rem; font-weight: 700;">
                <option value="image1" ${(cat.activeImage || 'image1') === 'image1' ? 'selected' : ''}>🖼️ Mostrar solo Imagen 1 (Principal)</option>
                <option value="image2" ${cat.activeImage === 'image2' ? 'selected' : ''}>🖼️ Mostrar solo Imagen 2 (Secundaria)</option>
                <option value="rotate" ${cat.activeImage === 'rotate' ? 'selected' : ''}>🔄 Rotar automáticamente cada 5 segundos (Carrusel entre ambas)</option>
              </select>
            </div>

            <!-- IMAGEN 1 (PRINCIPAL) -->
            <div class="form-group" style="border: 1px solid var(--baby-blue-border); padding: 0.85rem; border-radius: var(--radius-md); background: #FFFFFF;">
              <label style="font-weight: 800; color: var(--text-primary);">🖼️ Imagen 1 (Principal)</label>
              <input type="file" id="c-file-input1" accept="image/*" onchange="handleCategoryFileSelect(event, 1)" class="form-input" style="padding: 0.4rem; margin-top: 0.4rem; margin-bottom: 0.5rem;" />
              <input type="text" id="c-image1" class="form-input" value="${cat.image || ''}" placeholder="O URL de imagen 1 (https://...)" />
              <div style="margin-top: 0.5rem;">
                <img id="c-image1-preview" src="${cat.image || ''}" style="max-height: 100px; width: 100%; object-fit: cover; border-radius: var(--radius-sm); display: ${cat.image ? 'block' : 'none'}; border: 1px solid var(--baby-blue-border);" />
              </div>
            </div>

            <!-- IMAGEN 2 (SECUNDARIA) -->
            <div class="form-group" style="border: 1px solid var(--baby-blue-border); padding: 0.85rem; border-radius: var(--radius-md); background: #FFFFFF; margin-top: 0.8rem;">
              <label style="font-weight: 800; color: var(--text-primary);">🖼️ Imagen 2 (Secundaria)</label>
              <input type="file" id="c-file-input2" accept="image/*" onchange="handleCategoryFileSelect(event, 2)" class="form-input" style="padding: 0.4rem; margin-top: 0.4rem; margin-bottom: 0.5rem;" />
              <input type="text" id="c-image2" class="form-input" value="${cat.image2 || ''}" placeholder="O URL de imagen 2 (https://...)" />
              <div style="margin-top: 0.5rem;">
                <img id="c-image2-preview" src="${cat.image2 || ''}" style="max-height: 100px; width: 100%; object-fit: cover; border-radius: var(--radius-sm); display: ${cat.image2 ? 'block' : 'none'}; border: 1px solid var(--baby-blue-border);" />
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="toggle-switch">
                <input type="checkbox" id="c-active" ${cat.active !== false ? 'checked' : ''} />
                <span>Categoría Activa (Visible en Sitio)</span>
              </label>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem; justify-content: center;">Guardar Cambios de Categoría</button>
          </form>
        </div>
      </div>
    `;

    let existing = document.getElementById('category-editor-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  };

  window.closeCategoryEditorModal = () => {
    let modal = document.getElementById('category-editor-modal');
    if (modal) modal.remove();
  };

  window.handleCategoryFileSelect = (e, imgNum = 1) => {
    const file = e.target.files[0];
    if (file) {
      compressAndResizeImage(file, async (dataUrl) => {
        const finalUrl = await uploadImageToServer(dataUrl);
        const inputId = imgNum === 2 ? 'c-image2' : 'c-image1';
        const previewId = imgNum === 2 ? 'c-image2-preview' : 'c-image1-preview';
        
        const inputEl = document.getElementById(inputId);
        if (inputEl) inputEl.value = finalUrl;
        
        const preview = document.getElementById(previewId);
        if (preview) {
          preview.src = finalUrl;
          preview.style.display = 'block';
        }
      });
    }
  };

  window.saveCategoryFromForm = (e, catId) => {
    e.preventDefault();
    const cat = store.getCategories().find(c => c.id === catId);
    if (cat) {
      cat.name = document.getElementById('c-name').value;
      cat.icon = document.getElementById('c-icon').value;
      cat.image = document.getElementById('c-image1').value;
      cat.image2 = document.getElementById('c-image2').value;
      cat.activeImage = document.getElementById('c-activeImage').value;
      cat.active = document.getElementById('c-active').checked;
      store.saveCategory(cat);
    }
    closeCategoryEditorModal();
    renderAdminPortal();
  };

  // --- ADMIN ORDERS ---
  let adminOrderPaymentFilter = 'all'; // 'all', 'unpaid', 'paid'

  window.setAdminPaymentFilter = (mode) => {
    adminOrderPaymentFilter = mode;
    renderAdminPortal();
  };

  window.updateOrderPaymentStatusFromAdmin = (id, paymentStatus) => {
    store.updateOrderPaymentStatus(id, paymentStatus);
    renderAdminPortal();
  };

  function renderOrderMobileCardsHTML(ordersList) {
    if (!ordersList || ordersList.length === 0) return '';

    return `
      <div class="mobile-order-view">
        ${ordersList.map(o => {
          const isPaid = o.paymentStatus === 'Pagado';
          return `
            <div class="admin-order-card ${isPaid ? 'order-card-paid' : 'order-card-unpaid'}">
              <div class="order-card-header">
                <span class="order-card-id">#${o.id}</span>
                <span class="order-card-date">${new Date(o.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
              </div>

              <div class="order-card-customer">
                <div class="order-card-name">👤 ${o.customerName}</div>
                <div class="order-card-sub">
                  📞 ${o.customerPhone} • 📍 ${o.customerTown || 'PR'}
                  ${o.customerEmail ? `<br>📧 ${o.customerEmail}` : ''}
                </div>
              </div>

              ${o.items && o.items.length > 0 ? `
                <div class="order-card-items">
                  ${o.items.map(item => `
                    <div class="order-card-item-line">
                      <strong style="color: var(--text-primary);">${item.name} (${item.size || 'Estándar'}) x${item.quantity}</strong>
                      <div style="font-size: 0.76rem; color: var(--text-secondary);">
                        • Base: ${formatItemBaseText(item)}
                        ${item.flavors && item.flavors.length > 0 ? `<br>• Frutas: ${item.flavors.join(', ')}` : ''}
                        ${item.extras && item.extras.length > 0 ? `<br>• Extras: ${item.extras.join(', ')}` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <div class="order-card-controls">
                <div>
                  <span class="order-control-label">Estado Pedido</span>
                  <select onchange="updateOrderStatusFromAdmin('${o.id}', this.value)" class="form-input order-card-select">
                    <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="En Preparación" ${o.status === 'En Preparación' ? 'selected' : ''}>🍹 Preparación</option>
                    <option value="Listo" ${o.status === 'Listo' ? 'selected' : ''}>✅ Listo</option>
                    <option value="Entregado" ${o.status === 'Entregado' ? 'selected' : ''}>🎉 Entregado</option>
                  </select>
                </div>

                <div>
                  <span class="order-control-label">Estado Pago</span>
                  <select onchange="updateOrderPaymentStatusFromAdmin('${o.id}', this.value)" class="form-input order-card-select ${isPaid ? 'select-paid' : 'select-unpaid'}">
                    <option value="No Pagado" ${!isPaid ? 'selected' : ''}>❌ No Pagado</option>
                    <option value="Pagado" ${isPaid ? 'selected' : ''}>💳 Pagado</option>
                  </select>
                </div>
              </div>

              <button onclick="deleteOrderFromAdmin('${o.id}')" class="btn-delete-order">
                🗑️ Eliminar Orden
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderOrderTableHTML(ordersList, tableTitle) {
    if (!ordersList || ordersList.length === 0) return '';

    return `
      <div style="background: #FFFFFF; border: 1.5px solid var(--baby-blue-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 2rem; box-shadow: var(--card-shadow);">
        <div style="font-weight: 900; font-size: 1.15rem; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
          <span>${tableTitle} (${ordersList.length})</span>
        </div>

        <!-- DESKTOP TABLE VIEW -->
        <div class="desktop-order-view table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente / Contacto</th>
                <th>Antojos & Mezclas Solicitadas</th>
                <th>Estado del Pedido</th>
                <th>Estado de Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${ordersList.map(o => {
                const isPaid = o.paymentStatus === 'Pagado';
                return `
                  <tr style="${isPaid ? 'background: rgba(16, 185, 129, 0.04); border-left: 5px solid #10B981;' : 'background: rgba(239, 68, 68, 0.04); border-left: 5px solid #EF4444;'}">
                  <td><strong>#${o.id}</strong></td>
                  <td style="font-size: 0.82rem;">${new Date(o.createdAt).toLocaleString()}</td>
                  <td>
                    <div style="font-weight: 800;">${o.customerName}</div>
                    <div style="font-size: 0.82rem; color: var(--text-secondary);">📞 ${o.customerPhone}</div>
                    ${o.customerEmail ? `<div style="font-size: 0.78rem; color: var(--text-muted);">📧 ${o.customerEmail}</div>` : ''}
                  </td>
                  <td>
                    <div style="max-width: 340px; font-size: 0.84rem;">
                      ${(o.items || []).map(item => `
                        <div style="margin-bottom: 0.5rem; padding-bottom: 0.4rem; border-bottom: 1px dashed var(--baby-blue-border);">
                          <div style="font-weight: 800; color: var(--text-primary);">
                            ${item.name} (${item.size || 'Estándar'}) x${item.quantity}
                          </div>
                          <div style="font-size: 0.78rem; color: var(--text-secondary);">
                            • Base: ${formatItemBaseText(item)}
                            ${item.flavors && item.flavors.length > 0 ? `<br>• Frutas: ${item.flavors.join(', ')}` : ''}
                            ${item.extras && item.extras.length > 0 ? `<br>• Extras: ${item.extras.join(', ')}` : ''}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </td>
                  <td>
                    <select onchange="updateOrderStatusFromAdmin('${o.id}', this.value)" class="form-input" style="padding: 4px 8px; font-size: 0.85rem; width: auto; font-weight: 700;">
                      <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                      <option value="En Preparación" ${o.status === 'En Preparación' ? 'selected' : ''}>🍹 En Preparación</option>
                      <option value="Listo" ${o.status === 'Listo' ? 'selected' : ''}>✅ Listo</option>
                      <option value="Entregado" ${o.status === 'Entregado' ? 'selected' : ''}>🎉 Entregado</option>
                    </select>
                  </td>
                  <td>
                    <select onchange="updateOrderPaymentStatusFromAdmin('${o.id}', this.value)" class="form-input" style="padding: 4px 8px; font-size: 0.85rem; width: auto; font-weight: 800; background: ${o.paymentStatus === 'Pagado' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; color: ${o.paymentStatus === 'Pagado' ? '#059669' : '#DC2626'}; border: 1.5px solid ${o.paymentStatus === 'Pagado' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; cursor: pointer;">
                      <option value="No Pagado" ${(o.paymentStatus || 'No Pagado') === 'No Pagado' ? 'selected' : ''}>❌ No Pagado</option>
                      <option value="Pagado" ${o.paymentStatus === 'Pagado' ? 'selected' : ''}>💳 Pagado</option>
                    </select>
                  </td>
                  <td>
                    <button onclick="deleteOrderFromAdmin('${o.id}')" style="background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 5px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer;">
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
        </div>

        <!-- MOBILE CARDS VIEW -->
        ${renderOrderMobileCardsHTML(ordersList)}
      </div>
    `;
  }

  function renderAdminOrdersHTML() {
    const allOrders = store.getOrders().map(o => {
      if (!o.paymentStatus) o.paymentStatus = 'No Pagado';
      return o;
    });

    const unpaidOrders = allOrders.filter(o => o.paymentStatus === 'No Pagado');
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'Pagado');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <h1 style="font-size: 1.8rem; font-weight: 900; margin: 0;">📦 Órdenes Recibidas (${allOrders.length})</h1>
        <button onclick="refreshAdminOrders()" class="btn-primary" style="padding: 0.55rem 1.25rem; font-size: 0.9rem;">
          🔄 Refrescar Órdenes
        </button>
      </div>

      <!-- PAYMENT FILTER CONTROLS -->
      <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.75rem; background: var(--bg-surface); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border);">
        <span style="font-weight: 800; font-size: 0.9rem; color: var(--text-secondary);">Filtrar por Estado de Pago:</span>
        
        <button onclick="setAdminPaymentFilter('all')" class="btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; background: ${adminOrderPaymentFilter === 'all' ? 'var(--secondary-baby-blue)' : '#FFFFFF'}; color: ${adminOrderPaymentFilter === 'all' ? '#FFFFFF' : 'var(--text-primary)'}; border-color: var(--baby-blue-border); font-weight: 800; cursor: pointer;">
          🌐 Mezcla Completa (${allOrders.length})
        </button>

        <button onclick="setAdminPaymentFilter('unpaid')" class="btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; background: ${adminOrderPaymentFilter === 'unpaid' ? '#EF4444' : '#FFFFFF'}; color: ${adminOrderPaymentFilter === 'unpaid' ? '#FFFFFF' : '#DC2626'}; border-color: rgba(239, 68, 68, 0.4); font-weight: 800; cursor: pointer;">
          ❌ Solo No Pagadas (${unpaidOrders.length})
        </button>

        <button onclick="setAdminPaymentFilter('paid')" class="btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; background: ${adminOrderPaymentFilter === 'paid' ? '#10B981' : '#FFFFFF'}; color: ${adminOrderPaymentFilter === 'paid' ? '#FFFFFF' : '#059669'}; border-color: rgba(16, 185, 129, 0.4); font-weight: 800; cursor: pointer;">
          💳 Solo Pagadas (${paidOrders.length})
        </button>
      </div>

      ${allOrders.length === 0 ? `
        <div style="background: #FFFFFF; border: 1.5px solid var(--baby-blue-border); border-radius: var(--radius-lg); padding: 2.5rem 1.5rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">📦</div>
          <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem;">No hay órdenes registradas</h3>
          <p style="color: var(--text-secondary);">Las órdenes realizadas en el sitio web aparecerán aquí automáticamente.</p>
        </div>
      ` : `
        ${adminOrderPaymentFilter === 'all' ? `
          ${renderOrderTableHTML(unpaidOrders, '❌ Órdenes Pendientes de Pago (No Pagadas)')}
          ${renderOrderTableHTML(paidOrders, '💳 Órdenes Pagadas')}
          ${unpaidOrders.length === 0 && paidOrders.length === 0 ? '<p style="color: var(--text-secondary);">No se encontraron órdenes.</p>' : ''}
        ` : adminOrderPaymentFilter === 'unpaid' ? `
          ${renderOrderTableHTML(unpaidOrders, '❌ Órdenes Pendientes de Pago (No Pagadas)')}
          ${unpaidOrders.length === 0 ? '<p style="color: var(--text-secondary);">No hay órdenes sin pagar.</p>' : ''}
        ` : `
          ${renderOrderTableHTML(paidOrders, '💳 Órdenes Pagadas')}
          ${paidOrders.length === 0 ? '<p style="color: var(--text-secondary);">No hay órdenes pagadas aún.</p>' : ''}
        `}
      `}
    `;
  }

  window.refreshAdminOrders = async () => {
    await store.fetchServerData();
    renderAdminPortal();
  };

  window.updateOrderStatusFromAdmin = (id, status) => {
    store.updateOrderStatus(id, status);
  };

  window.deleteOrderFromAdmin = (id) => {
    if (confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente la orden #${id} del historial? Esta acción no se puede deshacer.`)) {
      store.deleteOrder(id);
      renderAdminPortal();
    }
  };

  // --- ADMIN SETTINGS (WHATSAPP CONFIGURATION) ---
  function renderAdminSettingsHTML() {
    const settings = store.getSettings();

    return `
      <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 1.5rem;">Configuración del Negocio</h1>
      
      <form onsubmit="saveAdminSettingsFromForm(event)" style="background: var(--bg-card-dark); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.5rem; max-width: 600px;">
        <div class="form-group">
          <label>Número de WhatsApp para Recibir Pedidos *</label>
          <input type="text" id="set-whatsappPhone" class="form-input" required value="${settings.whatsappPhone || ''}" placeholder="Ej. 17875550199 (incluye código de país)" />
          <span style="font-size: 0.75rem; color: var(--text-secondary);">Los pedidos enviados desde el checkout se dirigirán a este número.</span>
        </div>

        <div class="form-group">
          <label>Nombre del Negocio</label>
          <input type="text" id="set-storeName" class="form-input" value="${settings.storeName || ''}" />
        </div>

        <div class="form-group">
          <label>Eslogan / Concepto</label>
          <input type="text" id="set-tagline" class="form-input" value="${settings.tagline || ''}" />
        </div>

        <div class="form-group">
          <label>Dirección de Recogido (Pick-up)</label>
          <input type="text" id="set-pickupAddress" class="form-input" value="${settings.pickupAddress || ''}" />
        </div>

        <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border); margin-top: 1.25rem;">
          <div>
            <label style="margin: 0; font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">Pedir Correo Electrónico (Email) al Cliente</label>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">Si está desactivado, el formulario de checkout solo pedirá Nombre, Teléfono y Municipio de PR.</div>
          </div>
          <input type="checkbox" id="set-askCustomerEmail" ${settings.askCustomerEmail ? 'checked' : ''} style="width: 22px; height: 22px; cursor: pointer;" />
        </div>

        <div class="form-group" style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1.5px solid var(--baby-blue-border);">
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border); margin-bottom: 0.85rem;">
            <div>
              <label style="margin: 0; font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">Mostrar Video de Historia en Inicio</label>
              <div style="font-size: 0.78rem; color: var(--text-secondary);">Activa o desactiva la visibilidad del video de historia en la página principal.</div>
            </div>
            <input type="checkbox" id="set-showStoryVideo" ${settings.showStoryVideo !== false ? 'checked' : ''} style="width: 22px; height: 22px; cursor: pointer;" />
          </div>

          <label style="color: var(--secondary-baby-blue-hover); font-weight: 800; font-size: 0.95rem;">🎬 URL del Video de Historia ("Cómo Comenzó Todo")</label>
          <span style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">
            Ingresa la URL del video de YouTube, Vimeo o enlace MP4 para mostrarlo en el inicio debajo de la historia.
          </span>
          <input type="text" id="set-storyVideoUrl" class="form-input" value="${settings.storyVideoUrl || ''}" placeholder="Ej. https://www.youtube.com/watch?v=..." />
        </div>

        <div class="form-group" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
          <label style="color: var(--accent-green); font-weight: 800;">📲 Notificaciones Automáticas por WhatsApp (Sin Abrir WhatsApp)</label>
          <span style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 0.8rem; line-height: 1.4;">
            Envía 1 mensaje de WhatsApp desde tu número (939-312-0599) al <strong>+34 644 56 72 26</strong> con el texto:<br/>
            <code style="background: rgba(64,139,234,0.2); padding: 2px 6px; border-radius: 4px; color: #FFFFFF;">I allow callmebot to send me messages</code><br/>
            Recibirás tu API Key de 6 dígitos al instante. Ingrésala aquí para activar las notificaciones automáticas en segundo plano.
          </span>

          <div class="form-group">
            <label>CallMeBot API Key (Gratis — Listo en 30 segundos)</label>
            <input type="text" id="set-callMeBotApiKey" class="form-input" value="${settings.callMeBotApiKey || ''}" placeholder="Ej. 123456" />
          </div>
        </div>

        <div class="form-group" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1.5px solid var(--baby-blue-border);">
          <label style="color: var(--secondary-baby-blue-hover); font-weight: 800; font-size: 1rem;">☁️ Almacenamiento Permanente de Imágenes (Cloudinary CDN)</label>
          <span style="font-size: 0.82rem; color: var(--text-secondary); display: block; margin-bottom: 0.8rem; line-height: 1.4;">
            Para que las imágenes subidas desde cualquier dispositivo <strong>permanezcan para siempre en la nube (sin borrarse al reiniciar Railway)</strong>, ingresa tu Cloud Name y Upload Preset de Cloudinary (100% Gratis - 25 GB).
          </span>

          <div class="form-group">
            <label>Cloudinary Cloud Name</label>
            <input type="text" id="set-cloudinaryCloudName" class="form-input" value="${settings.cloudinaryCloudName || ''}" placeholder="Ej. verstail-hub" />
          </div>

          <div class="form-group">
            <label>Cloudinary Unsigned Upload Preset</label>
            <input type="text" id="set-cloudinaryUploadPreset" class="form-input" value="${settings.cloudinaryUploadPreset || ''}" placeholder="Ej. verstail_preset" />
          </div>
        </div>

        <div class="form-group" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1.5.px solid var(--gold-border);">
          <label style="color: var(--accent-gold-dark); font-weight: 800; font-size: 1rem;">🌐 Sincronización Multi-Dispositivo y Base de Datos Nube (JSONBin.io)</label>
          <span style="font-size: 0.82rem; color: var(--text-secondary); display: block; margin-bottom: 0.8rem; line-height: 1.4;">
            Permite que cualquier cambio o foto subida desde tu <strong>celular, laptop o computadora de trabajo</strong> aparezca al instante en todos los dispositivos de tus clientes globalmente. Crea un Bin gratis en <a href="https://jsonbin.io" target="_blank" style="color: var(--secondary-baby-blue-hover); font-weight: 700;">JSONbin.io</a> (100% Gratis).
          </span>

          <div class="form-group">
            <label>JSONBin Bin ID</label>
            <input type="text" id="set-jsonbinBinId" class="form-input" value="${settings.jsonbinBinId || ''}" placeholder="Ej. 65a123456789..." />
          </div>

          <div class="form-group">
            <label>JSONBin Master API Key (Opcional si el Bin es público)</label>
            <input type="password" id="set-jsonbinApiKey" class="form-input" value="${settings.jsonbinApiKey || ''}" placeholder="$2a$10$..." />
          </div>
        </div>

        <div class="form-group" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--glass-border);">
          <label style="color: var(--text-secondary); font-weight: 700; font-size: 0.85rem;">Meta WhatsApp Cloud API (Opcional — Para Cuentas Meta Developer)</label>
          
          <div class="form-group" style="margin-top: 0.5rem;">
            <label>Meta Phone Number ID</label>
            <input type="text" id="set-metaPhoneId" class="form-input" value="${settings.metaPhoneId || ''}" placeholder="Ej. 104857692482" />
          </div>

          <div class="form-group">
            <label>Meta Access Token</label>
            <input type="password" id="set-metaApiToken" class="form-input" value="${settings.metaApiToken || ''}" placeholder="EAA..." />
          </div>
        </div>

        <button type="submit" class="btn-primary" style="margin-top: 1rem;">Guardar Configuración</button>
      </form>
    `;
  }

  window.saveAdminSettingsFromForm = (e) => {
    e.preventDefault();
    store.updateSettings({
      whatsappPhone: document.getElementById('set-whatsappPhone').value,
      storeName: document.getElementById('set-storeName').value,
      tagline: document.getElementById('set-tagline').value,
      pickupAddress: document.getElementById('set-pickupAddress').value,
      askCustomerEmail: document.getElementById('set-askCustomerEmail') ? document.getElementById('set-askCustomerEmail').checked : false,
      showStoryVideo: document.getElementById('set-showStoryVideo') ? document.getElementById('set-showStoryVideo').checked : true,
      storyVideoUrl: document.getElementById('set-storyVideoUrl') ? document.getElementById('set-storyVideoUrl').value : '',
      callMeBotApiKey: document.getElementById('set-callMeBotApiKey').value,
      cloudinaryCloudName: document.getElementById('set-cloudinaryCloudName').value,
      cloudinaryUploadPreset: document.getElementById('set-cloudinaryUploadPreset').value,
      jsonbinBinId: document.getElementById('set-jsonbinBinId').value,
      jsonbinApiKey: document.getElementById('set-jsonbinApiKey').value,
      metaPhoneId: document.getElementById('set-metaPhoneId').value,
      metaApiToken: document.getElementById('set-metaApiToken').value
    });

    alert('¡Configuración guardada exitosamente!');
    renderAdminPortal();
  };

  // Initial load
  renderApp();
});
