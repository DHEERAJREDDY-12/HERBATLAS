const herbs = window.HERBS_DATA || [];
const herbCount = herbs.length;

const heroHerbCount = document.getElementById('heroHerbCount');
const heroHerbSub = document.getElementById('heroHerbSub');
if (heroHerbCount) heroHerbCount.textContent = herbCount;
if (heroHerbSub) heroHerbSub.textContent = herbCount;

function getSafetyLabel(safety) {
  return safety === 'safe' ? 'Generally Safe' : 'Use with Caution';
}

function getWeightValue(weight) {
  return parseInt((weight || '').replace(/[^0-9]/g, ''), 10) || 0;
}

function getSortedWeights(herb) {
  return [...(herb.weights || [])].sort((a, b) => getWeightValue(a) - getWeightValue(b));
}

function getCardWeight(herb) {
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

// Category strip navigates to ailments with the selected concern preloaded
const ailmentMap = {
  'Stress':     'Stress & Anxiety',
  'Sleep':      'Sleep Issues',
  'Immunity':   'Low Immunity',
  'Digestion':  'Digestion',
  'Skin':       'Skin Problems',
  'Energy':     'Low Energy',
  'Joint Pain': 'Joint Pain',
  'Hormonal':   'Hormonal Balance'
};

document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const label = pill.textContent.trim();
    const ailment = ailmentMap[label];
    if (ailment) {
      window.location.href = `ailments.html?ailment=${encodeURIComponent(ailment)}`;
    }
  });
});

// Render recently added herbs (last 4 in data)
function renderRecentHerbs() {
  const grid = document.getElementById('recentHerbsGrid');
  if (!grid || !herbs.length) return;

  const recent = herbs.slice(-4);

  grid.innerHTML = recent.map(herb => `
    <div class="herb-card" onclick="window.location.href='herb-detail.html?id=${herb.id}'" style="cursor:pointer">
      <div class="herb-card-img">
        <img src="${herb.image}" alt="${herb.name}" loading="lazy" onerror="this.style.display='none'">
        <span class="herb-card-badge">${getSafetyLabel(herb.safety)}</span>
      </div>
      <div class="herb-card-body">
        <h3>${herb.name}</h3>
        <p class="herb-card-sci">${herb.scientific_name}</p>
        <p>${herb.description.substring(0, 90)}...</p>
        <div class="tags">
          <span class="tag tag-green">${herb.best_for}</span>
          <span class="tag tag-brown">${herb.region}</span>
          <span class="tag tag-${herb.safety}">${getSafetyLabel(herb.safety)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

renderRecentHerbs();

function getSavedProfile() {
  const email = localStorage.getItem('userEmail');
  if (!email) return null;
  const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
  return profiles[email] || null;
}

function scoreProfileHerbs(profile) {
  if (!profile || !profile.goals || profile.goals.length === 0) return [];

  return herbs.filter(herb => {
    if (profile.safety === 'safe' && herb.safety !== 'safe') return false;
    if (profile.age > 0 && profile.age < 18 && herb.safety === 'restricted') return false;
    if (profile.sex === 'male' && herb.name === 'Shatavari') return false;

    const warnText = (herb.warnings || []).join(' ').toLowerCase();
    const drugText = (herb.drug_interactions || []).join(' ').toLowerCase();
    return !(profile.avoid || []).some(note => {
      if (note === 'pregnant' && warnText.includes('pregnancy')) return true;
      if (note === 'breastfeeding' && warnText.includes('breastfeeding')) return true;
      return warnText.includes(note) || drugText.includes(note);
    });
  }).map(herb => {
    let score = 0;
    profile.goals.forEach(goal => {
      if (herb.ailments.includes(goal)) score += 10;
    });

    if (herb.safety === 'safe') score += 2;
    return { ...herb, score };
  }).filter(herb => herb.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function renderRecommendedHerbs() {
  const section = document.getElementById('recommendedForYou');
  const grid = document.getElementById('recommendedHerbsGrid');
  const sectionHeader = section?.querySelector('.section-header');
  if (!section || !grid) return;

  const email = localStorage.getItem('userEmail');
  const profile = getSavedProfile();
  const recommendations = scoreProfileHerbs(profile);

  if (!recommendations.length) {
    if (!email) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');
    sectionHeader?.classList.add('hidden');
    grid.innerHTML = `
      <div class="recommendation-empty-state">
        <p class="recommendation-empty-label">Personalized suggestions</p>
        <h3>Create your personal herb profile</h3>
        <p>
          Save your wellness goals and preferences to view herb recommendations
          tailored to your needs.
        </p>
        <a href="account.html" class="btn-primary recommendation-empty-cta">
          Go to Personal Herb Profile
        </a>
      </div>
    `;
    return;
  }

  section.classList.remove('hidden');
  sectionHeader?.classList.remove('hidden');
  grid.innerHTML = recommendations.map((herb, index) => `
    <div class="herb-card" onclick="window.location.href='herb-detail.html?id=${herb.id}'">
      <div class="herb-card-img">
        <img src="${herb.image}" alt="${herb.name}" loading="lazy" onerror="this.style.display='none'">
        <span class="herb-card-badge">${index === 0 ? 'Best match' : getSafetyLabel(herb.safety)}</span>
      </div>
      <div class="herb-card-body">
        <h3>${herb.name}</h3>
        <p class="herb-card-sci">${herb.scientific_name}</p>
        <p>${getRecommendationReason(herb, profile)}</p>
        <div class="tags">
          <span class="tag tag-green">${herb.region}</span>
          <span class="tag tag-${herb.safety}">${getSafetyLabel(herb.safety)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function getRecommendationReason(herb, profile) {
  const matchedGoals = (profile.goals || []).filter(goal => herb.ailments.includes(goal));
  const parts = [];
  if (matchedGoals.length) parts.push(`Matched: ${matchedGoals.slice(0, 2).join(', ')}`);
  if (herb.safety === 'safe') parts.push('Safety: generally safe');
  return parts.join(' | ') || herb.best_for;
}

renderRecommendedHerbs();

/* ============================================================
   Featured Products — 4 bestsellers with Add to Cart
   ============================================================ */

/* Hardcoded bestseller IDs (Ashwagandha, Tulsi, Turmeric, Moringa)
   — highest rated, broadest appeal, in stock */
const BESTSELLER_IDS = [1, 2, 3, 7];
const BESTSELLER_BADGES = { 1: 'bestseller', 2: 'bestseller', 3: 'bestseller', 7: 'bestseller' };
const BESTSELLER_LABELS = { 1: 'Bestseller', 2: 'Top Rated', 3: 'Most Popular', 7: 'Staff Pick' };

function homeAddToCart(herbId) {
  const herb = herbs.find(h => h.id === herbId);
  if (!herb || !herb.stock) return;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const defaultWeight = getCardWeight(herb);
  const selectedPrice = getPriceForWeight(herb, defaultWeight);
  const existingIndex = cart.findIndex(item => item.id === herbId && item.weight === defaultWeight);

  if (existingIndex !== -1) {
    cart[existingIndex].qty += 1;
    cart[existingIndex].price = selectedPrice;
  } else {
    cart.push({
      id: herb.id,
      name: herb.name,
      image: herb.image,
      price: selectedPrice,
      weight: defaultWeight,
      qty: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  /* Update badge */
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

  /* Button feedback */
  const btn = document.getElementById(`fpAddBtn-${herbId}`);
  if (btn) {
    btn.textContent = 'Added ✓';
    btn.classList.add('added');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '+ Add to Cart';
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1800);
  }

  if (window.showToast) {
    showToast(`${herb.name} ${defaultWeight} added to your cart.`, 'success');
  }
}
window.homeAddToCart = homeAddToCart;

function renderFeaturedProducts() {
  const grid = document.getElementById('featuredProductsGrid');
  if (!grid || !herbs.length) return;

  const featured = BESTSELLER_IDS
    .map(id => herbs.find(h => h.id === id))
    .filter(Boolean);

  grid.innerHTML = featured.map(herb => {
    const herbName = herb.image.split('/').pop().replace(/\.(jpg|png|webp)$/, '');
    const shopImage = `images/shop/${herbName}-product.webp`;
    const badgeClass = BESTSELLER_BADGES[herb.id] || '';
    const badgeLabel = BESTSELLER_LABELS[herb.id] || 'Organic';
    const cardWeight = getCardWeight(herb);
    const cardPrice = getPriceForWeight(herb, cardWeight);
    const detailUrl = `shop-detail.html?id=${herb.id}&weight=${encodeURIComponent(cardWeight)}`;

    return `
      <div class="fp-card" onclick="window.location.href='${detailUrl}'" role="article" aria-label="${herb.name}">
        <div class="fp-card-img">
          <img src="${shopImage}" alt="${herb.name}" loading="lazy"
            onerror="this.src='${herb.image}'">
          <span class="fp-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="fp-card-body">
          <h3 class="fp-card-name">${herb.name}</h3>
          <span class="fp-card-sci">${herb.scientific_name}</span>
          <p class="fp-card-use">${herb.best_for}</p>
        </div>
        <div class="fp-card-footer">
          <div class="fp-price">
            <span class="fp-price-amount">&#8377;${cardPrice}</span>
            <span class="fp-price-weight">${cardWeight}</span>
          </div>
          <button
            class="fp-add-btn"
            id="fpAddBtn-${herb.id}"
            onclick="event.stopPropagation(); homeAddToCart(${herb.id})"
            ${!herb.stock ? 'disabled' : ''}
            aria-label="Add ${herb.name} to cart"
          >
            ${herb.stock ? '+ Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

renderFeaturedProducts();

/* ============================================================
   Customer Reviews — 4 hand-picked reviews from reviews.json
   ============================================================ */

/* Reviews to feature: one each from 4 different popular herbs */
const FEATURED_REVIEWS = [
  { herb_id: 1,  review_id: 0 },   /* Ashwagandha — Rahul M. ★5 */
  { herb_id: 11, review_id: 0 },   /* Chamomile — Sarah K. ★5 */
  { herb_id: 7,  review_id: 1 },   /* Moringa — Fatima A. ★5 */
  { herb_id: 3,  review_id: 2 }    /* Turmeric — Lakshmi V. ★5 */
];

function getStarsHtml(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="review-star${i > rating ? ' empty' : ''}">★</span>`;
  }
  return html;
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

async function renderHomeReviews() {
  const grid = document.getElementById('homeReviewsGrid');
  const aggregate = document.getElementById('reviewsAggregate');
  if (!grid) return;

  let allReviewData = [];
  try {
    const res = await fetch('data/reviews.json');
    allReviewData = await res.json();
  } catch {
    /* silently skip if fetch fails */
    grid.closest('.home-reviews-section')?.style.setProperty('display', 'none');
    return;
  }

  /* Collect the 4 featured reviews */
  const picked = [];
  for (const { herb_id, review_id } of FEATURED_REVIEWS) {
    const group = allReviewData.find(g => g.herb_id === herb_id);
    if (!group) continue;
    const review = group.reviews[review_id];
    if (!review) continue;
    const herb = herbs.find(h => h.id === herb_id);
    picked.push({ ...review, herbName: herb ? herb.name : '' });
  }

  if (!picked.length) {
    grid.closest('.home-reviews-section')?.style.setProperty('display', 'none');
    return;
  }

  grid.innerHTML = picked.map(r => `
    <article class="review-card">
      <div class="review-stars">${getStarsHtml(r.rating)}</div>
      <p class="review-text">${r.review}</p>
      <div class="review-meta">
        <div class="review-avatar" aria-hidden="true">${getInitial(r.name)}</div>
        <div>
          <span class="review-name">${r.name}</span>
          <span class="review-product">${r.herbName}</span>
        </div>
        ${r.verified ? '<span class="review-verified">Verified</span>' : ''}
      </div>
    </article>
  `).join('');

  /* Aggregate strip — compute across all reviews */
  const allRatings = allReviewData.flatMap(g => g.reviews.map(r => r.rating));
  const avg = allRatings.length
    ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
    : '5.0';

  if (aggregate) {
    aggregate.innerHTML = `
      <div class="reviews-agg-score">
        <span class="reviews-agg-num">${avg}</span>
        <span class="reviews-agg-label">out of 5</span>
      </div>
      <div class="reviews-agg-stars">
        <div class="reviews-agg-star-row">${getStarsHtml(Math.round(parseFloat(avg)))}</div>
        <span class="reviews-agg-count">${allRatings.length} verified reviews</span>
      </div>
      <div class="reviews-agg-divider" aria-hidden="true"></div>
      <div class="reviews-agg-badges">
        <span class="reviews-agg-badge">100% Organic</span>
        <span class="reviews-agg-badge">Fast Delivery</span>
        <span class="reviews-agg-badge">Verified Buyers</span>
      </div>
    `;
  }
}

renderHomeReviews();
