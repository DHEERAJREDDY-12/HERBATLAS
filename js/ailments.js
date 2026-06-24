const HERBS_PER_AILMENT_PAGE = 4;

let allHerbs = [];
let allAilments = [];
let selectedAilmentId = null;
let currentResultsPage = 1;

function getSafetyLabel(safety) {
  return safety === 'safe' ? 'Generally Safe' : 'Use with Caution';
}

function loadData() {
  allHerbs = window.HERBS_DATA || [];
  allAilments = window.AILMENTS_DATA || [];
  renderAilmentCards();
}

function renderAilmentCards() {
  document.getElementById('ailmentCards').innerHTML = allAilments.map(a => `
    <div class="ailment-card" onclick="selectAilment(${a.id})">
      <div class="ailment-icon">
        <img src="${a.icon}" alt="${a.name}" loading="lazy" onerror="this.parentElement.innerHTML='Herb'">
      </div>
      <h3>${a.name}</h3>
      <p>${a.description}</p>
      <span class="ailment-count">${a.herb_ids.length} herbs</span>
    </div>
  `).join('');
}

function getSelectedAilmentHerbs() {
  const ailment = allAilments.find(a => a.id === selectedAilmentId);
  if (!ailment) return [];
  return allHerbs.filter(h => ailment.herb_ids.includes(h.id));
}

function renderAilmentHerbs() {
  const herbs = getSelectedAilmentHerbs();
  const start = (currentResultsPage - 1) * HERBS_PER_AILMENT_PAGE;
  const end = Math.min(start + HERBS_PER_AILMENT_PAGE, herbs.length);
  const pageHerbs = herbs.slice(start, end);

  document.getElementById('resultsLabel').textContent = `Showing ${start + 1}-${end} of ${herbs.length} herbs`;
  document.getElementById('ailmentHerbsGrid').innerHTML = pageHerbs.map(herb => `
    <div class="herb-card" onclick="window.location.href='herb-detail.html?id=${herb.id}'">
      <div class="herb-card-img">
        <img src="${herb.image}" alt="${herb.name}" loading="lazy" onerror="this.style.display='none'">
        <span class="herb-card-badge">${getSafetyLabel(herb.safety)}</span>
      </div>
      <div class="herb-card-body">
        <h3>${herb.name}</h3>
        <span class="herb-card-sci">${herb.scientific_name}</span>
        <p>${herb.description.substring(0, 80)}...</p>
        <div class="tags">
          <span class="tag tag-green">${herb.best_for}</span>
          <span class="tag tag-${herb.safety}">${getSafetyLabel(herb.safety)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAilmentPagination() {
  const pagination = document.getElementById('ailmentPagination');
  const herbs = getSelectedAilmentHerbs();
  const totalPages = Math.ceil(herbs.length / HERBS_PER_AILMENT_PAGE);

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `<button class="page-num arrow ${currentResultsPage === 1 ? 'disabled' : ''}"
    aria-label="Previous page" title="Previous page" onclick="changeAilmentPage(${currentResultsPage - 1})">&larr;</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-num ${i === currentResultsPage ? 'active' : ''}"
      onclick="changeAilmentPage(${i})">${i}</button>`;
  }

  html += `<button class="page-num arrow ${currentResultsPage === totalPages ? 'disabled' : ''}"
    aria-label="Next page" title="Next page" onclick="changeAilmentPage(${currentResultsPage + 1})">&rarr;</button>`;

  pagination.innerHTML = html;
}

function selectAilment(id) {
  const ailment = allAilments.find(a => a.id === id);
  if (!ailment) return;

  selectedAilmentId = id;
  currentResultsPage = 1;

  document.querySelectorAll('.ailment-card').forEach((card, i) => {
    card.classList.toggle('active', allAilments[i].id === id);
  });

  document.getElementById('resultsTitle').innerHTML = `Herbs for <em>${ailment.name}</em>`;
  document.getElementById('resultsTip').textContent = ailment.tip;

  renderAilmentHerbs();
  renderAilmentPagination();

  const results = document.getElementById('ailmentResults');
  results.classList.add('show');
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeAilmentPage(page) {
  const totalPages = Math.ceil(getSelectedAilmentHerbs().length / HERBS_PER_AILMENT_PAGE);
  if (page < 1 || page > totalPages) return;
  currentResultsPage = page;
  renderAilmentHerbs();
  renderAilmentPagination();
  document.getElementById('ailmentResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('clearAilment').addEventListener('click', () => {
  selectedAilmentId = null;
  currentResultsPage = 1;
  document.querySelectorAll('.ailment-card').forEach(c => c.classList.remove('active'));
  document.getElementById('ailmentPagination').innerHTML = '';
  document.getElementById('ailmentResults').classList.remove('show');
});

loadData();

// Auto-select ailment from URL param e.g. ailments.html?ailment=Stress+%26+Anxiety
(function checkUrlAilment() {
  const param = new URLSearchParams(window.location.search).get('ailment');
  if (!param) return;
  const match = allAilments.find(a => a.name.toLowerCase() === param.toLowerCase());
  if (match) selectAilment(match.id);
})();
