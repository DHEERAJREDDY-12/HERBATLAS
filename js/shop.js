let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let activeStock = '';
let activeSafety = '';
let drawerStock = '';
let drawerSafety = '';

function initCouponBanner() {
  const banner = document.getElementById('shopCouponBanner');
  const closeBtn = document.getElementById('shopCouponBannerClose');
  if (!banner || !closeBtn) return;

  if (localStorage.getItem('showCoupon') === 'true') {
    banner.classList.remove('hidden');
    localStorage.removeItem('showCoupon');
  }

  closeBtn.addEventListener('click', () => {
    banner.classList.add('hidden');
  });
}

function getProductsPerPage() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (width >= 960 && width <= 1100 && height >= 1500) {
    return 9;
  }

  return 8;
}

function loadProducts() {
  allProducts = window.HERBS_DATA || [];
  filteredProducts = [...allProducts];
  renderProducts();
  renderPagination();
  if (new URLSearchParams(window.location.search).get('cartReady') === '1') {
    const pendingId = parseInt(sessionStorage.getItem('pendingCartId'), 10);
    if (pendingId) {
      sessionStorage.removeItem('pendingCartId');
      addToCart(pendingId, { silentToast: true });
      showToast('Signed in successfully. The herb has been added to your cart.', 'success');
    } else {
      showToast('You are signed in. Choose the herb again to add it to your cart.', 'info');
    }
  }
}

function renderProducts() {
  const grid = document.getElementById('shopGrid');
  const noResults = document.getElementById('noResults');
  const filterCount = document.getElementById('filterCount');
  const productsPerPage = getProductsPerPage();
  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const pageProducts = filteredProducts.slice(start, end);
  filterCount.textContent = `${filteredProducts.length} products`;
  if (filteredProducts.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');
  grid.innerHTML = pageProducts.map(herb => {
    const herbName = herb.image.split('/').pop().replace(/\.(jpg|png|webp)$/, '');
    const shopImage = `images/shop/${herbName}-product.webp`;
    return `
    <div class="shop-card" onclick="window.location.href='shop-detail.html?id=${herb.id}'">
      <div class="shop-card-img">
        <img src="${shopImage}" alt="${herb.name}" loading="lazy"
          onerror="this.src='${herb.image}'">
        <span class="organic-badge">Organic</span>
        <span class="stock-badge ${herb.stock ? 'in' : 'out'}">
          ${herb.stock ? 'In Stock' : 'Out of Stock'}
        </span>
        <span class="safety-badge">${herb.safety === 'safe' ? 'Safe' : 'Caution'}</span>
      </div>
      <div class="shop-card-body">
        <h3>${herb.name}</h3>
        <span class="shop-card-sci">${herb.scientific_name}</span>
        <p>${herb.best_for}</p>
        <div class="shop-card-meta">
          <span>${herb.region}</span>
          <span>${herb.weights[0]}</span>
          <span>Ships 2-4 days</span>
        </div>
        <a class="shop-view-link" href="shop-detail.html?id=${herb.id}" onclick="event.stopPropagation()">Product details</a>
      </div>
      <div class="shop-card-footer">
        <div class="shop-price">
          Rs.${herb.price}
          <span>/ ${herb.weights[0]}</span>
        </div>
        <button
          class="add-btn"
          onclick="event.stopPropagation(); addToCart(${herb.id})"
          ${!herb.stock ? 'disabled' : ''}
          id="addBtn-${herb.id}"
        >
          + Cart
        </button>
      </div>
    </div>`;
  }).join('');
}
function renderPagination() {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredProducts.length / getProductsPerPage());

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button class="page-num arrow ${currentPage === 1 ? 'disabled' : ''}"
    aria-label="Previous page" title="Previous page" onclick="changePage(${currentPage - 1})">&larr;</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-num ${i === currentPage ? 'active' : ''}"
      onclick="changePage(${i})">${i}</button>`;
  }

  html += `<button class="page-num arrow ${currentPage === totalPages ? 'disabled' : ''}"
    aria-label="Next page" title="Next page" onclick="changePage(${currentPage + 1})">&rarr;</button>`;

  pagination.innerHTML = html;
}
function changePage(page) {
  const totalPages = Math.ceil(filteredProducts.length / getProductsPerPage());
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function applyFilters() {
  const region = document.getElementById('regionFilter').value;
  const ailment = document.getElementById('ailmentFilter').value;
  const sort = document.getElementById('sortFilter').value;

  filteredProducts = allProducts.filter(herb => {
    if (region && herb.region !== region) return false;
    if (ailment && !herb.ailments.includes(ailment)) return false;
    if (activeStock === 'true' && !herb.stock) return false;
    if (activeSafety === 'safe' && herb.safety !== 'safe') return false;
    return true;
  });

  if (sort === 'price-low') filteredProducts.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filteredProducts.sort((a, b) => b.price - a.price);
  if (sort === 'name') filteredProducts.sort((a, b) => a.name.localeCompare(b.name));

  currentPage = 1;
  renderProducts();
  renderPagination();
}

function syncDrawerFromDesktop() {
  const region = document.getElementById('drawerRegionFilter');
  const ailment = document.getElementById('drawerAilmentFilter');
  const sort = document.getElementById('drawerSortFilter');
  if (!region || !ailment || !sort) return;

  region.value = document.getElementById('regionFilter').value;
  ailment.value = document.getElementById('ailmentFilter').value;
  sort.value = document.getElementById('sortFilter').value;
  drawerStock = activeStock;
  drawerSafety = activeSafety;
  document.querySelectorAll('#drawerStatusChips .filter-chip').forEach(chip => {
    const match = chip.dataset.drawerStock === drawerStock && chip.dataset.drawerSafety === drawerSafety;
    chip.classList.toggle('active', match);
  });
}

function applyDrawerFilters() {
  const region = document.getElementById('drawerRegionFilter');
  const ailment = document.getElementById('drawerAilmentFilter');
  const sort = document.getElementById('drawerSortFilter');
  if (!region || !ailment || !sort) return;

  document.getElementById('regionFilter').value = region.value;
  document.getElementById('ailmentFilter').value = ailment.value;
  document.getElementById('sortFilter').value = sort.value;
  activeStock = drawerStock;
  activeSafety = drawerSafety;
  document.querySelectorAll('.filter-bar .filter-chip').forEach(chip => {
    const isMatch = (chip.dataset.stock || '') === activeStock && (chip.dataset.safety || '') === activeSafety;
    chip.classList.toggle('active', isMatch);
  });
  applyFilters();
}

function setupFilterDrawer() {
  const trigger = document.getElementById('filterDrawerTrigger');
  const drawer = document.getElementById('filterDrawer');
  const overlay = document.getElementById('filterOverlay');
  const closeBtn = document.getElementById('filterDrawerClose');
  const applyBtn = document.getElementById('filterDrawerApply');
  const clearBtn = document.getElementById('filterDrawerClear');
  if (!trigger || !drawer || !overlay || !closeBtn || !applyBtn || !clearBtn) return;

  let lastFocused = null;
  let isOpen = false;

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
    document.body.classList.remove('filter-drawer-open');
    if (lastFocused) lastFocused.focus();
  }

  function openDrawer() {
    if (window.innerWidth >= 768) return;
    lastFocused = trigger;
    isOpen = true;
    syncDrawerFromDesktop();
    overlay.hidden = false;
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('filter-drawer-open');
    const focusTarget = drawer.querySelector('.filter-select, .filter-chip, .filter-drawer-close');
    if (focusTarget) focusTarget.focus();
  }

  trigger.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  applyBtn.addEventListener('click', () => {
    applyDrawerFilters();
    closeDrawer();
  });
  clearBtn.addEventListener('click', () => {
    document.getElementById('drawerRegionFilter').value = '';
    document.getElementById('drawerAilmentFilter').value = '';
    document.getElementById('drawerSortFilter').value = '';
    drawerStock = '';
    drawerSafety = '';
    document.querySelectorAll('#drawerStatusChips .filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.drawerStock === '' && chip.dataset.drawerSafety === '');
    });
    applyDrawerFilters();
    closeDrawer();
  });

  document.querySelectorAll('#drawerStatusChips .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      drawerStock = chip.dataset.drawerStock || '';
      drawerSafety = chip.dataset.drawerSafety || '';
      document.querySelectorAll('#drawerStatusChips .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeDrawer();
    }
  });
}
function addToCart(id, options = {}) {
  const herb = allProducts.find(h => h.id === id);
  if (!herb) return;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const defaultWeight = herb.weights[0];
  const existingIndex = cart.findIndex(item => item.id === id && item.weight === defaultWeight);
  if (existingIndex !== -1) {
    const existing = cart[existingIndex];
    existing.qty += 1;
    cart.splice(existingIndex, 1);
    cart.push(existing);
  } else {
    cart.push({
      id: herb.id,
      name: herb.name,
      image: herb.image,
      price: herb.price,
      weight: defaultWeight,
      qty: 1
    });
  }
  localStorage.setItem('cart', JSON.stringify(cart));

  const btn = document.getElementById(`addBtn-${id}`);
  if (btn) {
    btn.textContent = 'Added';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = '+ Cart';
      btn.classList.remove('added');
    }, 1500);
  }

  const badge = document.getElementById('cartBadge');
  if (badge) {
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = total;
  }

  if (!options.silentToast) {
    showToast(`${herb.name} added to your cart.`, 'success');
  }
}
document.getElementById('regionFilter').addEventListener('change', applyFilters);
document.getElementById('ailmentFilter').addEventListener('change', applyFilters);
document.getElementById('sortFilter').addEventListener('change', applyFilters);
document.querySelectorAll('.filter-chip[data-stock]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeStock = chip.dataset.stock;
    activeSafety = '';   // always reset safety when stock chip clicked
    applyFilters();
  });
});
document.querySelectorAll('.filter-chip[data-safety]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeSafety = chip.dataset.safety;
    activeStock = '';
    applyFilters();
  });
});
document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('regionFilter').value = '';
  document.getElementById('ailmentFilter').value = '';
  document.getElementById('sortFilter').value = '';
  activeStock = '';
  activeSafety = '';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.filter-chip').classList.add('active');
  filteredProducts = [...allProducts];
  currentPage = 1;
  renderProducts();
  renderPagination();
});

window.addEventListener('resize', () => {
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / getProductsPerPage()));
  if (currentPage > totalPages) currentPage = totalPages;
  renderProducts();
  renderPagination();
});

setupFilterDrawer();
initCouponBanner();
loadProducts();
