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
    base: ['Té Concentrado', 'Aloe Vera', 'Lift Off'],
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

  // --- MOBILE DRAWER ---
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
    });
  }

  function closeMobileDrawer() {
    if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');
  }

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

  // --- MAIN RENDER ROUTER ---
  function renderApp() {
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

  // ==========================================================================
  // CUSTOMER VIEWS
  // ==========================================================================

  function getProductImage(prod) {
    if (prod.image && prod.image.trim()) return prod.image.trim();
    const categories = store.getCategories();
    const cat = categories.find(c => c.id === prod.category);
    if (cat && cat.image && cat.image.trim()) return cat.image.trim();
    return '';
  }

  function getCategoryImage(cat) {
    if (cat.image && cat.image.trim()) return cat.image.trim();
    const prods = store.getProducts();
    const match = prods.find(p => p.category === cat.id && p.image && p.image.trim());
    return match ? match.image.trim() : '';
  }

  // --- HOMEPAGE VIEW ---
  // --- HOMEPAGE VIEW (INTEGRATED MENU & CATALOG) ---
  function renderHomeView() {
    const categories = store.getCategories().filter(c => c.active && c.id !== 'custom-mix');
    const settings = store.getSettings();
    let products = store.getActiveProducts();

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
        
        <p class="hero-subtitle">
          Descubre nuestros sabores, explora nuestro menú y disfruta tu orden a tu manera.
        </p>

        <div class="hero-delivery-badge">
          <span>🚚</span> Delivery Incluido | 📲 WhatsApp: 939-312-0599
        </div>

        <div class="hero-actions">
          <a href="#menu-section" onclick="smoothScrollToMenu(event)" class="btn-primary" style="padding: 1rem 2.5rem; font-size: 1.1rem;">
            🍹 Ver Menú y Ordenar
          </a>
        </div>
      </section>

      <!-- BIG CATEGORY BUTTON CARDS -->
      <section class="section-container" style="padding-bottom: 1rem;">
        <div class="section-header" style="margin-bottom: 1rem;">
          <div>
            <h2 class="section-title">Explora por Categoría</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Toca una categoría para ver sus opciones</p>
          </div>
          ${selectedCategoryFilter !== 'all' ? `
            <button onclick="setMenuFilter('all')" style="color: var(--secondary-baby-blue-hover); font-weight: 800; font-size: 0.85rem; background: var(--baby-blue-light); border: 1.5px solid var(--baby-blue-border); padding: 5px 14px; border-radius: var(--radius-full); cursor: pointer;">
              🔄 Ver Todos (${selectedCategoryFilter.toUpperCase()})
            </button>
          ` : ''}
        </div>

        <div class="categories-grid">
          ${categories.map(cat => `
            <div class="category-card ${selectedCategoryFilter === cat.id ? 'active' : ''}" onclick="selectCategoryAndScroll('${cat.id}')">
              <span class="category-icon">${cat.icon}</span>
              <span class="category-name">${cat.name}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- INTEGRATED MENU CATALOG & PRODUCTS GRID -->
      <section class="section-container" id="menu-section" style="scroll-margin-top: 90px; padding-top: 0.5rem;">
        <div class="section-header" style="flex-direction: column; align-items: flex-start; gap: 0.4rem; margin-bottom: 1rem;">
          <h2 class="section-title" style="font-size: 1.8rem;">Menú de Antojos</h2>
          <p style="color: var(--text-secondary); font-size: 0.92rem;">
            ${selectedCategoryObj ? `Mostrando opciones para <strong>${selectedCategoryObj.name}</strong>` : 'Elige una opción y personalízala a tu estilo.'}
          </p>
        </div>

        <!-- SMALL CATEGORY FILTER PILLS BAR (OPTIONAL VIA ADMIN TOGGLE) -->
        ${settings.showCategoryFilterPills ? `
          <div style="display: flex; gap: 0.6rem; overflow-x: auto; padding: 0.5rem 0 1rem; margin-bottom: 1.25rem; -webkit-overflow-scrolling: touch;">
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
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--baby-blue-light); border: 1.5px solid var(--baby-blue-border); padding: 0.6rem 1.25rem; border-radius: var(--radius-full); margin-bottom: 1.5rem;">
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
    const sec = document.getElementById('menu-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
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

    return `
      <div class="product-card ${hasImage ? 'has-prod-image' : ''} ${isSoldOut ? 'is-sold-out' : ''}">
        <div class="product-image-container">
          ${isSoldOut ? `<span class="product-sold-out-badge">🚫 AGOTADO</span>` : ''}
          ${hasImage ? `
            <img src="${imgUrl}" alt="${prod.name}" class="product-image" />
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
    const cat = store.getCategories().find(c => c.id === catId);
    return cat ? cat.icon : '🍹';
  }

  // --- PRODUCT CUSTOMIZER MODAL ---
  window.openProductCustomizer = (productId) => {
    const product = store.getProductBySlug(productId);
    if (!product) return;

    activeModalProduct = product;
    const isMegaTe = product.category === 'mega-te' || product.category === 'versa-to-go';

    activeCustomizerState = {
      mode: isMegaTe ? 'personaliza' : 'original',
      size: product.sizes && product.sizes.length > 0 ? product.sizes[0] : (product.category === 'versa-to-go' ? '16 oz' : '32 oz'),
      flavors: product.flavors && product.flavors.length > 0 ? [product.flavors[0]] : [],
      ingredients: [...(product.baseIngredients || [])],
      extras: [],
      quantity: 1
    };

    renderCustomizerModalHTML(true); // Full initial render
  };

  function renderCustomizerModalHTML(isFullRender = false) {
    const prod = activeModalProduct;
    const state = activeCustomizerState;
    if (!prod) return;

    const isMegaTe = prod.category === 'mega-te' || prod.category === 'versa-to-go';
    let existingModal = document.getElementById('customizer-modal');

    // If modal already exists and this is an in-place update, just sync targeted summary nodes & classes
    if (existingModal && !isFullRender) {
      updateCustomizerSummaryDOM();
      return;
    }

    const modalHTML = `
      <div class="modal-backdrop open" id="customizer-modal">
        <div class="modal-card">
          <button onclick="closeCustomizerModal()" class="modal-close-btn">&times;</button>
          
          <div style="display: flex; gap: 1rem; align-items: center;">
            <div style="font-size: 2.5rem;">${getCategoryIcon(prod.category)}</div>
            <div>
              <span class="product-category-tag">${prod.category.toUpperCase()}</span>
              <h2 style="font-size: 1.4rem; font-weight: 800;">${prod.name}</h2>
            </div>
          </div>

          <p style="color: var(--text-secondary); font-size: 0.9rem;">${prod.description}</p>

          ${isMegaTe ? `
            <div style="background: var(--gold-light); border: 1.5px solid var(--gold-border); padding: 0.6rem 1rem; border-radius: var(--radius-full); text-align: center; font-weight: 800; color: var(--accent-gold-dark); margin-bottom: 0.5rem; font-size: 0.88rem;">
              ✨ Bebida 100% Personalizada (<span id="mega-te-counter-badge">${state.flavors.length} Sabor${state.flavors.length === 1 ? '' : 'es'} Seleccionado${state.flavors.length === 1 ? '' : 's'}</span>)
            </div>
          ` : `
            <!-- MODE SELECTOR: ORIGINAL VS PERSONALIZA FOR OTHER PRODUCTS -->
            <div>
              <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 0.4rem;">¿CÓMO LO QUIERES?</div>
              <div class="option-mode-grid">
                <div class="mode-choice-card ${state.mode === 'original' ? 'selected' : ''}" id="mode-btn-original" onclick="setCustomizerMode('original')">
                  <div class="mode-choice-title">ORIGINAL</div>
                  <div class="mode-choice-sub">"Disfrútalo como viene"</div>
                </div>
                <div class="mode-choice-card ${state.mode === 'personaliza' ? 'selected' : ''}" id="mode-btn-personaliza" onclick="setCustomizerMode('personaliza')">
                  <div class="mode-choice-title">PERSONALIZA</div>
                  <div class="mode-choice-sub">"Hazlo a tu manera"</div>
                </div>
              </div>
            </div>
          `}

          <div id="customizer-options-container">
            ${renderCustomizerOptionsContentHTML()}
          </div>

          <!-- LIVE SUMMARY BOX -->
          <div class="live-summary-box">
            <div class="summary-title">Resumen de tu Orden</div>
            <div style="font-size: 0.95rem; font-weight: 700;" id="summary-title-text">${prod.name} (<span id="summary-size-text">${state.size}</span>)</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);" id="summary-flavors-text">
              ${state.flavors.length > 0 ? `Frutas/Sabores: ${state.flavors.join(', ')}` : 'Sin frutas seleccionadas'}
              ${state.extras.length > 0 ? ` | Extras: ${state.extras.join(', ')}` : ''}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
              <div class="qty-counter">
                <button class="qty-btn" onclick="updateCustomizerQty(-1)">-</button>
                <span style="font-weight: 800;" id="summary-qty-text">${state.quantity}</span>
                <button class="qty-btn" onclick="updateCustomizerQty(1)">+</button>
              </div>

              <button onclick="confirmAddToCart()" class="btn-primary" style="padding: 0.6rem 1.25rem; font-size: 0.9rem;">
                🛒 Añadir al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function renderCustomizerOptionsContentHTML() {
    const prod = activeModalProduct;
    const state = activeCustomizerState;
    const isMegaTe = prod.category === 'mega-te' || prod.category === 'versa-to-go';

    if (state.mode === 'original' && !isMegaTe) {
      return `
        <div style="background: var(--bg-surface-dark); padding: 1rem; border-radius: var(--radius-md);">
          <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--accent-green);">
            ✓ Receta Original Incluye:
          </div>
          <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--text-secondary);">
            ${prod.baseIngredients.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    return `
      <!-- SIZES -->
      ${prod.sizes && prod.sizes.length > 1 ? `
        <div style="margin-bottom: 0.9rem;">
          <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-secondary);">TAMAÑO</label>
          <div class="ingredient-list">
            ${prod.sizes.map(sz => `
              <div class="flavor-chip ${state.size === sz ? 'selected' : ''}" data-size="${sz}" onclick="setCustomizerSize('${sz}', this)">
                ${sz}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- FLAVORS -->
      ${prod.flavors && prod.flavors.length > 0 ? `
        <div style="margin-bottom: 0.9rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <label style="font-weight: 800; font-size: 0.85rem; color: var(--text-secondary);">FRUTAS / SABORES DISPONIBLES</label>
            <span style="font-size: 0.78rem; font-weight: 800; color: var(--accent-gold-dark);" id="mega-te-counter-header">${state.flavors.length} Seleccionados</span>
          </div>

          <!-- RECTANGLE WARNING CALLOUT WHEN 3 OR MORE FLAVORS ARE SELECTED -->
          <div id="flavor-warning-rect-modal" class="flavor-warning-rect" style="display: ${state.flavors.length >= 3 ? 'flex' : 'none'};">
            <span class="flavor-warning-icon">⚠️</span>
            <div>
              <strong>Aviso de Sabores:</strong> Las primeras 2 frutas/sabores están incluidas sin costo adicional. A partir del 3er sabor en adelante, aplica un cargo adicional.
            </div>
          </div>

          <div class="ingredient-list" style="max-height: 200px; overflow-y: auto; padding-right: 0.3rem;">
            ${prod.flavors.map(flv => `
              <div class="flavor-chip ${state.flavors.includes(flv) ? 'selected' : ''}" data-flavor="${flv}" onclick="toggleCustomizerFlavor('${flv}', this)">
                <span class="chip-icon">${state.flavors.includes(flv) ? '✓' : '+'}</span> ${flv}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- INGREDIENTS TOGGLE -->
      <div style="margin-bottom: 0.9rem;">
        <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-secondary);">INGREDIENTES INCLUIDOS EN LA BASE</label>
        <div class="ingredient-list">
          ${prod.baseIngredients.map(ing => `
            <div class="ingredient-chip ${state.ingredients.includes(ing) ? 'active' : ''}" data-ingredient="${ing}" onclick="toggleCustomizerIngredient('${ing}', this)">
              <span class="chip-icon">${state.ingredients.includes(ing) ? '✓' : '+'}</span> ${ing}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- EXTRAS -->
      ${prod.extras && prod.extras.length > 0 ? `
        <div style="margin-bottom: 0.9rem;">
          <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-secondary);">EXTRAS OPCIONALES</label>
          <div class="ingredient-list">
            ${prod.extras.map(ext => `
              <div class="ingredient-chip ${state.extras.includes(ext) ? 'active' : ''}" data-extra="${ext}" onclick="toggleCustomizerExtra('${ext}', this)">
                <span class="chip-icon">${state.extras.includes(ext) ? '✓' : '+'}</span> ${ext}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
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

    store.addToCart({
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      mode: state.mode,
      size: state.size,
      flavors: [...state.flavors],
      ingredients: [...state.ingredients],
      extras: [...state.extras],
      quantity: state.quantity,
      unitPrice: prod.publicPrice || 0,
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
          <h2 class="step-title">Paso 1: Elige tu base</h2>
          <p class="step-desc">Selecciona los elementos base para tu bebida personal</p>
          <div class="ingredient-list">
            ${['Té Concentrado', 'Aloe Vera', 'Lift Off'].map(b => `
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
          <p class="step-desc">Añade beneficios de digestión y salud intestinal</p>
          <div class="ingredient-list">
            ${['Fibra Activa', 'Probiótico Boost', 'Miel de Agave'].map(ext => `
              <div class="ingredient-chip ${wizardData.extras.includes(ext) ? 'active' : ''}" onclick="toggleWizardExtra('${ext}', this)">
                <span class="chip-icon">${wizardData.extras.includes(ext) ? '✓' : '+'}</span> ${ext}
              </div>
            `).join('')}
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
                <div style="font-size: 2rem;">🍹</div>
                <div class="cart-item-info">
                  <div class="cart-item-title">${item.name} (${item.size || 'Estándar'})</div>
                  <div class="cart-item-meta">
                    ${item.flavors && item.flavors.length > 0 ? `Sabores: ${item.flavors.join(', ')}` : ''}
                    ${item.extras && item.extras.length > 0 ? ` | Extras: ${item.extras.join(', ')}` : ''}
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

  // --- CHECKOUT VIEW WITH STREAMLINED WHATSAPP INTEGRATION ---
  function renderCheckoutView() {
    const cart = store.getCart();

    if (cart.length === 0) {
      window.location.hash = 'carrito';
      return;
    }

    appContainer.innerHTML = `
      <section class="section-container" style="max-width: 550px;">
        <h1 class="section-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Finalizar Pedido</h1>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Ingresa tus datos de contacto para enviar tu orden por WhatsApp.</p>

        <form id="checkout-form" onsubmit="handleCheckoutSubmit(event)" style="background: var(--bg-card-dark); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.5rem;">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input type="text" id="cust-name" class="form-input" required placeholder="Ej. Maria Lopez" />
          </div>

          <div class="form-group">
            <label>Teléfono de Contacto *</label>
            <input type="tel" id="cust-phone" class="form-input" required placeholder="Ej. 939-312-0599" />
          </div>

          <div class="form-group">
            <label>Correo Electrónico (Opcional)</label>
            <input type="email" id="cust-email" class="form-input" placeholder="maria@ejemplo.com" />
          </div>

          <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-surface-dark); border-radius: var(--radius-md);">
            <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--primary);">Resumen del Pedido</div>
            <div style="font-size: 0.88rem; color: var(--text-secondary);">
              ${cart.length} antojo${cart.length > 1 ? 's' : ''} listo${cart.length > 1 ? 's' : ''} para ser enviado por WhatsApp
            </div>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1rem; font-size: 1.1rem; justify-content: center;">
            📲 Enviar Pedido por WhatsApp
          </button>
        </form>
      </section>
    `;
  }

  window.handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const email = document.getElementById('cust-email') ? document.getElementById('cust-email').value : '';

    const cart = store.getCart();
    const settings = store.getSettings();

    const newOrder = store.addOrder({
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      items: cart
    });

    store.clearCart();

    // Dispatch Meta WhatsApp Cloud API Notification in background
    if (window.VerstailWhatsApp && window.VerstailWhatsApp.sendMetaWhatsAppCloudNotification) {
      window.VerstailWhatsApp.sendMetaWhatsAppCloudNotification(newOrder, settings);
    }

    // Render Order Confirmation View on website (Customer never leaves the page)
    appContainer.innerHTML = `
      <section class="section-container" style="max-width: 550px; text-align: center; padding-top: 2rem;">
        <div style="background: var(--bg-card-dark); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 2.5rem 1.5rem;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">✅</div>
          <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 0.5rem; color: var(--accent-green);">¡Pedido Confirmado!</h1>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary); margin-bottom: 1rem;">Orden #${newOrder.id}</div>
          
          <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 420px; margin: 0 auto 1.5rem;">
            ¡Gracias <strong>${name}</strong>! Tu pedido ha sido registrado exitosamente y notificado automáticamente a nuestro equipo por WhatsApp. Te contactaremos al <strong>${phone}</strong>.
          </p>

          <div style="background: var(--bg-surface-dark); padding: 1rem; border-radius: var(--radius-md); text-align: left; margin-bottom: 1.5rem; border: 1px solid var(--glass-border);">
            <div style="font-weight: 800; font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--primary);">Resumen de tu Pedido:</div>
            ${newOrder.items.map(item => `
              <div style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.25rem;">
                • <strong>${item.name}</strong> (x${item.quantity}) ${item.size ? `— ${item.size}` : ''}
              </div>
            `).join('')}
          </div>

          <a href="#home" class="btn-primary" style="padding: 0.85rem 2rem; font-size: 1rem;">
            🏠 Volver al Inicio
          </a>
        </div>
      </section>
    `;
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

  // --- ADMIN DASHBOARD ---
  function renderAdminDashboardHTML() {
    const products = store.getProducts();
    const orders = store.getOrders();

    return `
      <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 1.5rem;">Dashboard de Administración</h1>
      
      <div class="admin-stats-grid">
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

      <div style="background: #FFFFFF; border: 1.5px solid var(--baby-blue-border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--card-shadow);">
        <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem;">Órdenes Recientes</h3>
        ${orders.length > 0 ? `
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice(0, 5).map(o => `
                  <tr>
                    <td><strong>#${o.id}</strong></td>
                    <td>${o.customerName}</td>
                    <td>${o.customerPhone}</td>
                    <td><span class="badge-status active">${o.status}</span></td>
                    <td>
                      <button onclick="deleteOrderFromAdmin('${o.id}')" style="background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer;">
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
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

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl })
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
      baseIngredients: existing ? existing.baseIngredients : ['Té Concentrado', 'Aloe Vera'],
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

      <!-- CATEGORY PILLS BAR TOGGLE BANNER -->
      <div style="background: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-md); border: 1.5px solid var(--baby-blue-border); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--card-shadow);">
        <div>
          <div style="font-weight: 900; font-size: 1rem; color: var(--text-primary);">🏷️ Mostrar Barra de Píldoras de Filtro (Categorías)</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Controla la pequeña barra de pestañas/píldoras sobre los productos. (Desactivado por defecto para mantener el diseño limpio de tarjetas grandes).
          </div>
        </div>
        <button onclick="toggleCategoryPillsFromAdmin()" style="background: ${settings.showCategoryFilterPills ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${settings.showCategoryFilterPills ? '#059669' : '#DC2626'}; border: 1.5px solid ${settings.showCategoryFilterPills ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; padding: 8px 16px; border-radius: var(--radius-full); font-weight: 800; cursor: pointer;">
          ${settings.showCategoryFilterPills ? '✅ Activadas (Visibles en Sitio)' : '🙈 Ocultas (Recomendado)'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Icono</th>
              <th>Categoría</th>
              <th>Imagen de Fondo</th>
              <th>Estado Visibilidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map(c => `
              <tr>
                <td style="font-size: 1.5rem;">${c.icon}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.image ? '🖼️ Imagen Configurada' : '<span style="color: var(--text-muted);">Sin imagen</span>'}</td>
                <td>
                  <button onclick="toggleCategoryActiveFromAdmin('${c.id}')" style="background: ${c.active !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${c.active !== false ? '#059669' : '#DC2626'}; border: 1.5px solid ${c.active !== false ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; padding: 5px 12px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 800; cursor: pointer;">
                    ${c.active !== false ? '👁️ Activa' : '🙈 Oculta'}
                  </button>
                </td>
                <td>
                  <button onclick="openCategoryEditorModal('${c.id}')" style="background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--baby-blue-border); padding: 5px 12px; border-radius: 6px; font-weight: 800; cursor: pointer;">Editar Imagen</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  window.toggleCategoryPillsFromAdmin = () => {
    store.toggleCategoryFilterPillsSetting();
    renderAdminPortal();
  };

  window.toggleCategoryActiveFromAdmin = (id) => {
    store.toggleCategoryActive(id);
    renderAdminPortal();
  };

  window.openCategoryEditorModal = (catId) => {
    const cat = store.getCategories().find(c => c.id === catId);
    if (!cat) return;

    const modalHTML = `
      <div class="modal-backdrop open" id="category-editor-modal">
        <div class="modal-card" style="max-width: 550px;">
          <button onclick="closeCategoryEditorModal()" class="modal-close-btn">&times;</button>
          <h2 style="font-size: 1.4rem; font-weight: 800;">Editar Categoría: ${cat.name}</h2>
          
          <form onsubmit="saveCategoryFromForm(event, '${cat.id}')">
            <div class="form-group">
              <label>Nombre de Categoría *</label>
              <input type="text" id="c-name" class="form-input" required value="${cat.name}" />
            </div>

            <div class="form-group">
              <label>Icono Emoji *</label>
              <input type="text" id="c-icon" class="form-input" required value="${cat.icon}" />
            </div>

            <div class="form-group">
              <label>Imagen de Fondo (Subir archivo desde celular/dispositivo o URL)</label>
              <input type="file" id="c-file-input" accept="image/*" onchange="handleCategoryFileSelect(event)" class="form-input" style="padding: 0.4rem; margin-bottom: 0.5rem;" />
              <input type="text" id="c-image" class="form-input" value="${cat.image || ''}" placeholder="O URL de imagen (https://...)" />
              <div style="margin-top: 0.5rem;">
                <img id="c-image-preview" src="${cat.image || ''}" style="max-height: 120px; width: 100%; object-fit: cover; border-radius: var(--radius-sm); display: ${cat.image ? 'block' : 'none'}; border: 1px solid var(--glass-border);" />
              </div>
            </div>

            <div class="form-group">
              <label class="toggle-switch">
                <input type="checkbox" id="c-active" ${cat.active ? 'checked' : ''} />
                <span>Categoría Activa</span>
              </label>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem; justify-content: center;">Guardar Categoría</button>
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

  window.handleCategoryFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressAndResizeImage(file, async (dataUrl) => {
        const finalUrl = await uploadImageToServer(dataUrl);
        document.getElementById('c-image').value = finalUrl;
        const preview = document.getElementById('c-image-preview');
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
      cat.image = document.getElementById('c-image').value;
      cat.active = document.getElementById('c-active').checked;
      store.saveCategory(cat);
    }
    closeCategoryEditorModal();
    renderAdminPortal();
  };

  // --- ADMIN ORDERS ---
  function renderAdminOrdersHTML() {
    const orders = store.getOrders();

    return `
      <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 1.5rem;">Órdenes Recibidas</h1>
      ${orders.length > 0 ? `
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>${new Date(o.createdAt).toLocaleString()}</td>
                  <td>${o.customerName}</td>
                  <td>${o.customerPhone}</td>
                  <td>
                    <select onchange="updateOrderStatusFromAdmin('${o.id}', this.value)" class="form-input" style="padding: 2px 6px; font-size: 0.85rem; width: auto;">
                      <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                      <option value="En Preparación" ${o.status === 'En Preparación' ? 'selected' : ''}>En Preparación</option>
                      <option value="Listo" ${o.status === 'Listo' ? 'selected' : ''}>Listo</option>
                      <option value="Entregado" ${o.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                    </select>
                  </td>
                  <td>
                    <button onclick="deleteOrderFromAdmin('${o.id}')" style="background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer;">
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `<p style="color: var(--text-secondary);">No hay órdenes registradas.</p>`}
    `;
  }

  window.updateOrderStatusFromAdmin = (id, status) => {
    store.updateOrderStatus(id, status);
  };

  window.deleteOrderFromAdmin = (id) => {
    if (confirm(`¿Eliminar permanentemente la orden #${id}?`)) {
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
      callMeBotApiKey: document.getElementById('set-callMeBotApiKey').value,
      metaPhoneId: document.getElementById('set-metaPhoneId').value,
      metaApiToken: document.getElementById('set-metaApiToken').value
    });

    alert('¡Configuración de WhatsApp guardada exitosamente!');
    renderAdminPortal();
  };

  // Initial load
  renderApp();
});
