let currentHerb = null;
let detailStickyBound = false;

function getSafetyLabel(safety) {
  return safety === 'safe' ? 'Generally Safe' : 'Use with Caution';
}

function getWeightValue(weight) {
  return parseInt((weight || '').replace(/[^0-9]/g, ''), 10) || 0;
}

function getSortedWeights(herb) {
  return [...(herb.weights || [])].sort((a, b) => getWeightValue(a) - getWeightValue(b));
}

function getQuickCartWeight(herb) {
  const sortedWeights = getSortedWeights(herb);
  return sortedWeights[1] || sortedWeights[0] || '';
}

function getBulkDiscount(weightRatio) {
  if (weightRatio >= 10) return 0.22;
  if (weightRatio >= 5) return 0.16;
  if (weightRatio >= 4) return 0.14;
  if (weightRatio >= 3) return 0.1;
  if (weightRatio >= 2.5) return 0.08;
  if (weightRatio >= 2) return 0.06;
  return 0;
}

function getPriceForWeight(herb, weight) {
  if (!herb || !herb.weights || !herb.weights.length) return herb ? herb.price : 0;
  const sortedWeights = getSortedWeights(herb);
  const baseAmount = getWeightValue(sortedWeights[0]);
  const selectedAmount = getWeightValue(weight);
  if (!baseAmount || !selectedAmount) return herb.price;

  const weightRatio = selectedAmount / baseAmount;
  const linearPrice = herb.price * weightRatio;
  const discountedPrice = linearPrice * (1 - getBulkDiscount(weightRatio));

  return Math.max(herb.price, Math.round(discountedPrice));
}

function resetDetailStickyRail() {
  const sidebar = document.querySelector('.detail-sidebar');
  const sidebarInner = document.querySelector('.detail-sidebar-inner');
  if (!sidebar || !sidebarInner) return;

  sidebar.style.minHeight = '';
  sidebarInner.style.position = '';
  sidebarInner.style.top = '';
  sidebarInner.style.left = '';
  sidebarInner.style.right = '';
  sidebarInner.style.bottom = '';
  sidebarInner.style.width = '';
}

function updateDetailStickyRail() {
  const detailBody = document.querySelector('.detail-body');
  const sidebar = document.querySelector('.detail-sidebar');
  const sidebarInner = document.querySelector('.detail-sidebar-inner');

  if (!detailBody || !sidebar || !sidebarInner || window.innerWidth < 1000) {
    resetDetailStickyRail();
    return;
  }

  const stickyTop = 90;
  const releaseGap = 56;
  const railHeight = sidebarInner.offsetHeight;
  const bodyRect = detailBody.getBoundingClientRect();
  const sidebarRect = sidebar.getBoundingClientRect();
  const scrollTop = window.scrollY || window.pageYOffset;
  const bodyTop = scrollTop + bodyRect.top;
  const sidebarTop = scrollTop + sidebarRect.top;
  const bodyBottom = bodyTop + detailBody.offsetHeight;
  const stickStart = sidebarTop - stickyTop;
  const stickStop = bodyBottom - railHeight - stickyTop - releaseGap;

  sidebar.style.minHeight = `${railHeight}px`;

  if (scrollTop <= stickStart) {
    resetDetailStickyRail();
    sidebar.style.minHeight = `${railHeight}px`;
    return;
  }

  if (scrollTop >= stickStop) {
    const releaseTop = bodyBottom - scrollTop - railHeight - releaseGap;

    sidebarInner.style.position = 'fixed';
    sidebarInner.style.top = `${releaseTop}px`;
    sidebarInner.style.left = `${sidebarRect.left}px`;
    sidebarInner.style.right = 'auto';
    sidebarInner.style.bottom = 'auto';
    sidebarInner.style.width = `${sidebarRect.width}px`;
    return;
  }

  sidebarInner.style.position = 'fixed';
  sidebarInner.style.top = `${stickyTop}px`;
  sidebarInner.style.left = `${sidebarRect.left}px`;
  sidebarInner.style.right = 'auto';
  sidebarInner.style.bottom = 'auto';
  sidebarInner.style.width = `${sidebarRect.width}px`;
}

function bindDetailStickyRail() {
  if (detailStickyBound) return;
  detailStickyBound = true;

  const queueUpdate = () => window.requestAnimationFrame(updateDetailStickyRail);
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
}

function loadHerb() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));

  if (!id) { window.location.href = 'browse.html'; return; }

  const herbs = window.HERBS_DATA || [];
  currentHerb = herbs.find(h => h.id === id);

  if (!currentHerb) { window.location.href = 'browse.html'; return; }

  document.title = `${currentHerb.name} — HerbAtlas`;
  renderHero();

  const shopLink = document.querySelector('.shop-cta-link');
  if (shopLink) {
    shopLink.href = `shop-detail.html?id=${currentHerb.id}&weight=${encodeURIComponent(getQuickCartWeight(currentHerb))}`;
  }

  const quickCartBtn = document.getElementById('detailQuickCartBtn');
  const quickCartNote = document.getElementById('detailQuickCartNote');
  const quickWeight = getQuickCartWeight(currentHerb);
  if (quickCartBtn) {
    quickCartBtn.disabled = !currentHerb.stock || !quickWeight;
  }
  if (quickCartNote) {
    quickCartNote.textContent = currentHerb.stock && quickWeight
      ? `Adds ${quickWeight} pack directly to your cart.`
      : 'Currently unavailable for direct cart add.';
  }

  renderAtAGlance();
  renderUses();
  renderDosage();
  renderWarnings();
  renderFunFact();
  renderRelated(herbs);
  window.requestAnimationFrame(updateDetailStickyRail);
}

function renderHero() {
  document.getElementById('detailImg').innerHTML = `
    <img src="${currentHerb.image}" alt="${currentHerb.name}"
      width="520" height="520"
      loading="eager" fetchpriority="high" decoding="async"
      onerror="this.style.display='none'">
  `;
  document.getElementById('detailName').textContent = currentHerb.name;
  document.getElementById('detailSci').textContent = currentHerb.scientific_name;
  document.getElementById('detailBadges').innerHTML = `
    <span class="detail-badge badge-${currentHerb.safety}">
      ${getSafetyLabel(currentHerb.safety)}
    </span>
    <span class="detail-badge badge-region">${currentHerb.region}</span>
    <span class="detail-badge badge-region">${currentHerb.type}</span>
  `;
}

function renderAtAGlance() {
  document.getElementById('atAGlance').innerHTML = `
    <div class="ag-item">
      <span class="ag-label">Best For</span>
      <span class="ag-value">${currentHerb.best_for}</span>
    </div>
    <div class="ag-item">
      <span class="ag-label">Origin</span>
      <span class="ag-value">${currentHerb.origin}</span>
    </div>
    <div class="ag-item">
      <span class="ag-label">Part Used</span>
      <span class="ag-value">${currentHerb.type}</span>
    </div>
    <div class="ag-item">
      <span class="ag-label">Preparation</span>
      <span class="ag-value">Powder</span>
    </div>
    <div class="ag-item">
      <span class="ag-label">Safety</span>
      <span class="ag-value ${currentHerb.safety}">
        ${getSafetyLabel(currentHerb.safety)}
      </span>
    </div>
  `;
}

function renderUses() {
  document.getElementById('usesList').innerHTML = currentHerb.uses
    .map(use => `<li>${use}</li>`)
    .join('');
}

function renderDosage() {
  const dosage = currentHerb.dosage;
  document.getElementById('dosageCards').innerHTML = Object.entries(dosage).map(([method, instruction]) => `
    <div class="dosage-card">
      <h4>${method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}</h4>
      <p>${instruction}</p>
    </div>
  `).join('');
}

function renderWarnings() {
  const cautionReasonsBox = document.getElementById('cautionReasonsBox');
  const cautionReasonsList = document.getElementById('cautionReasonsList');
  const cautionReasons = currentHerb.safety === 'caution'
    ? (currentHerb.caution_reasons || [])
    : [];

  if (cautionReasonsBox && cautionReasonsList) {
    cautionReasonsBox.classList.toggle('hidden', cautionReasons.length === 0);
    cautionReasonsList.innerHTML = cautionReasons
      .map(reason => `<li>${reason}</li>`)
      .join('');
  }

  document.getElementById('warningsList').innerHTML = currentHerb.warnings
    .map(w => `<li>${w}</li>`)
    .join('');
  document.getElementById('drugsList').innerHTML = currentHerb.drug_interactions
    .map(d => `<li>${d}</li>`)
    .join('');
}

function renderFunFact() {
  document.getElementById('funFactBox').innerHTML = `
    <h2>Did You Know?</h2>
    <p>${currentHerb.fun_fact}</p>
    <span>Traditional knowledge - ${currentHerb.region}</span>
  `;
}

function normalizeMatchValues(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim().toLowerCase()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
  return [];
}

function getRelatedByAilment(allHerbs) {
  const currentAilments = new Set([
    ...normalizeMatchValues(currentHerb.ailments),
    ...normalizeMatchValues(currentHerb.best_for)
  ]);

  return allHerbs
    .filter(herb => herb.id !== currentHerb.id)
    .map(herb => {
      const herbAilments = [
        ...normalizeMatchValues(herb.ailments),
        ...normalizeMatchValues(herb.best_for)
      ];
      const sharedCount = herbAilments.filter(item => currentAilments.has(item)).length;
      return { herb, sharedCount };
    })
    .filter(item => item.sharedCount > 0)
    .sort((a, b) => b.sharedCount - a.sharedCount || a.herb.name.localeCompare(b.herb.name))
    .slice(0, 4)
    .map(item => item.herb);
}

function renderRelated(allHerbs) {
  const related = getRelatedByAilment(allHerbs);

  document.getElementById('relatedHerbs').innerHTML = related.map(herb => `
    <div class="related-row" onclick="window.location.href='herb-detail.html?id=${herb.id}'">
      <div class="related-thumb">
        <img src="${herb.image}" alt="${herb.name}" width="96" height="96" loading="lazy" decoding="async" onerror="this.style.display='none'">
      </div>
      <div class="related-info">
        <h4>${herb.name}</h4>
        <p>${herb.best_for}</p>
      </div>
    </div>
  `).join('');
}

function addDetailHerbToCart() {
  if (!currentHerb || !currentHerb.stock) return;

  const selectedWeight = getQuickCartWeight(currentHerb);
  if (!selectedWeight) return;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const selectedPrice = getPriceForWeight(currentHerb, selectedWeight);
  const existingIndex = cart.findIndex(item => item.id === currentHerb.id && item.weight === selectedWeight);

  if (existingIndex !== -1) {
    const existing = cart[existingIndex];
    existing.qty += 1;
    existing.price = selectedPrice;
    cart.splice(existingIndex, 1);
    cart.push(existing);
  } else {
    cart.push({
      id: currentHerb.id,
      name: currentHerb.name,
      image: currentHerb.image,
      price: selectedPrice,
      weight: selectedWeight,
      qty: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }

  const quickCartBtn = document.getElementById('detailQuickCartBtn');
  const originalText = quickCartBtn ? quickCartBtn.textContent : '';
  if (quickCartBtn) {
    quickCartBtn.textContent = 'Added to Cart';
    quickCartBtn.classList.add('added');
    setTimeout(() => {
      quickCartBtn.textContent = originalText;
      quickCartBtn.classList.remove('added');
    }, 1500);
  }

  if (typeof showToast === 'function') {
    showToast(`${currentHerb.name} ${selectedWeight} added to your cart.`, 'success');
  }
}

bindDetailStickyRail();
loadHerb();
