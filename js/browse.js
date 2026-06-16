let allHerbs = [];
let filteredHerbs = [];
let currentPage = 1;
let activeSafety = '';
let currentSearch = '';
let drawerSafety = '';

function getHerbsPerPage() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (width >= 960 && width <= 1100 && height >= 1500) {
    return 9;
  }

  return 8;
}

function loadHerbs() {
  allHerbs = window.HERBS_DATA || [];
  filteredHerbs = [...allHerbs];

  // Apply URL params from search inputs only.
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get('search');

  if (searchParam) {
    currentSearch = searchParam.toLowerCase();
  }

  if (searchParam) {
    applyFilters();
  } else {
    renderHerbs();
    renderPagination();
  }
}

function renderHerbs() {
  const grid = document.getElementById('herbsGrid');
  const noResults = document.getElementById('noResults');
  const filterCount = document.getElementById('filterCount');
  const herbsPerPage = getHerbsPerPage();
  const start = (currentPage - 1) * herbsPerPage;
  const end = Math.min(start + herbsPerPage, filteredHerbs.length);
  const total = filteredHerbs.length;
  const pageHerbs = filteredHerbs.slice(start, end);

  if (total === 0) {
    filterCount.textContent = '0 herbs found';
  } else {
    filterCount.textContent = `Showing ${start + 1}–${end} of ${total} herbs`;
  }

  if (total === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  grid.innerHTML = pageHerbs.map((herb, idx) => `
    <div class="herb-card" onclick="goToDetail(${herb.id})" role="article" aria-label="${herb.name}">
      <div class="herb-card-img">
        <img
          src="${herb.image}"
          alt="${herb.name} — ${herb.scientific_name}"
          width="300" height="190"
          ${idx === 0 && currentPage === 1 ? 'fetchpriority="high"' : 'loading="lazy"'}
          onerror="this.style.display='none'"
        >
        <span class="herb-card-badge">${herb.safety}</span>
      </div>
      <div class="herb-card-body">
        <h2 class="herb-card-name">${herb.name}</h2>
        <span class="herb-card-sci">${herb.scientific_name}</span>
        <p>${herb.description.substring(0, 90)}...</p>
        <div class="tags">
          <span class="tag tag-green">${herb.best_for}</span>
          <span class="tag tag-brown">${herb.region}</span>
          <span class="tag tag-${herb.safety}">${herb.safety}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredHerbs.length / getHerbsPerPage());

  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = `<button class="page-num arrow ${currentPage === 1 ? 'disabled' : ''}"
    aria-label="Previous page" ${currentPage === 1 ? 'aria-disabled="true"' : ''} onclick="changePage(${currentPage - 1})">&larr;</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-num ${i === currentPage ? 'active' : ''}"
      aria-label="Page ${i}" ${i === currentPage ? 'aria-current="page"' : ''}
      onclick="changePage(${i})">${i}</button>`;
  }

  html += `<button class="page-num arrow ${currentPage === totalPages ? 'disabled' : ''}"
    aria-label="Next page" ${currentPage === totalPages ? 'aria-disabled="true"' : ''} onclick="changePage(${currentPage + 1})">&rarr;</button>`;

  pagination.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredHerbs.length / getHerbsPerPage());
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderHerbs();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
  const region = document.getElementById('regionFilter').value;
  const type = document.getElementById('typeFilter').value;
  const search = currentSearch;

  filteredHerbs = allHerbs.filter(herb => {
    if (region && herb.region !== region) return false;
    if (type && herb.type !== type) return false;
    if (activeSafety && herb.safety !== activeSafety) return false;
    if (search) {
      const match = herb.name.toLowerCase().includes(search);
      if (!match) return false;
    }
    return true;
  });

  currentPage = 1;
  renderHerbs();
  renderPagination();
}

function syncDrawerFromDesktop() {
  const region = document.getElementById('drawerRegionFilter');
  const type = document.getElementById('drawerTypeFilter');
  if (!region || !type) return;

  region.value = document.getElementById('regionFilter').value;
  type.value = document.getElementById('typeFilter').value;
  drawerSafety = activeSafety;
  document.querySelectorAll('[data-drawer-safety]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.drawerSafety === drawerSafety);
  });
}

function applyDrawerFilters() {
  const region = document.getElementById('drawerRegionFilter');
  const type = document.getElementById('drawerTypeFilter');
  if (!region || !type) return;

  document.getElementById('regionFilter').value = region.value;
  document.getElementById('typeFilter').value = type.value;
  activeSafety = drawerSafety;
  document.querySelectorAll('.filter-bar .filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.safety === activeSafety);
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
    document.getElementById('drawerTypeFilter').value = '';
    drawerSafety = '';
    document.querySelectorAll('[data-drawer-safety]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.drawerSafety === '');
    });
    currentSearch = '';
    applyDrawerFilters();
    closeDrawer();
  });

  document.querySelectorAll('[data-drawer-safety]').forEach(chip => {
    chip.addEventListener('click', () => {
      drawerSafety = chip.dataset.drawerSafety;
      document.querySelectorAll('[data-drawer-safety]').forEach(c => c.classList.remove('active'));
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

function goToDetail(id) {
  window.location.href = `herb-detail.html?id=${id}`;
}

// Event listeners
document.getElementById('regionFilter').addEventListener('change', applyFilters);
document.getElementById('typeFilter').addEventListener('change', applyFilters);

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeSafety = chip.dataset.safety;
    applyFilters();
  });
});

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('regionFilter').value = '';
  document.getElementById('typeFilter').value = '';
  currentSearch = '';
  activeSafety = '';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.filter-chip').classList.add('active');
  filteredHerbs = [...allHerbs];
  currentPage = 1;
  renderHerbs();
  renderPagination();
});

window.addEventListener('resize', () => {
  const totalPages = Math.max(1, Math.ceil(filteredHerbs.length / getHerbsPerPage()));
  if (currentPage > totalPages) currentPage = totalPages;
  renderHerbs();
  renderPagination();
});

setupFilterDrawer();
loadHerbs();
