let currentHerb = null;
let allHerbs = [];
let selectedWeight = '';
let quantity = 1;
let selectedRating = 0;
let seededReviewsCache = [];

let currentImageIndex = 0;
let galleryImages = [];

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  const requestedWeight = params.get('weight');

  if (!id) {
    window.location.href = 'shop.html';
    return;
  }

  allHerbs = window.HERBS_DATA || [];
  currentHerb = allHerbs.find(h => h.id === id);

  if (!currentHerb) {
    window.location.href = 'shop.html';
    return;
  }

  seededReviewsCache = await loadSeededReviews(id);
  selectedWeight = currentHerb.weights.includes(requestedWeight)
    ? requestedWeight
    : currentHerb.weights[0];

  document.title = `${currentHerb.name} - HerbAtlas Shop`;

  renderPage();
  handlePendingCartAdd();
}

async function loadSeededReviews(id) {
  try {
    const response = await fetch('data/reviews.json');
    const reviewData = await response.json();
    const group = reviewData.find(item => item.herb_id === id);
    return group ? group.reviews : [];
  } catch (error) {
    return getFallbackReviews();
  }
}

function getFallbackReviews() {
  return [
    {
      name: 'Verified Customer',
      rating: 5,
      review: `${currentHerb.name} arrived fresh, well packed and easy to use. The quality felt premium compared with regular store products.`,
      date: 'Jan 2024',
      verified: true
    },
    {
      name: 'HerbAtlas Buyer',
      rating: 4,
      review: `Good product for ${currentHerb.best_for.toLowerCase()}. Clear instructions and quick delivery made the purchase smooth.`,
      date: 'Feb 2024',
      verified: true
    },
    {
      name: 'Repeat Buyer',
      rating: 5,
      review: `I liked the aroma, packaging and overall quality. I would buy ${currentHerb.name} again.`,
      date: 'Mar 2024',
      verified: true
    }
  ];
}

function getLocalReviews() {
  return JSON.parse(localStorage.getItem(`reviews-${currentHerb.id}`) || '[]');
}

function getAllReviews() {
  const seededReviews = seededReviewsCache.map(review => ({
    ...review,
    __isLocal: false
  }));
  const localReviews = getLocalReviews().map(review => ({
    ...review,
    __isLocal: true
  }));

  return [...seededReviews, ...localReviews].sort((a, b) => getReviewTimestamp(b) - getReviewTimestamp(a));
}

function getReviewTimestamp(review) {
  if (review.createdAt) {
    const timestamp = Date.parse(review.createdAt);
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  if (review.date) {
    const timestamp = Date.parse(`1 ${review.date}`);
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  return 0;
}

function renderPage() {
  const reviews = getAllReviews();
  renderHero(reviews);
  renderInfo();
  renderReviews(reviews, seededReviewsCache.length);
  renderRelated();
}

function getAvgRating(reviews) {
  if (!reviews.length) return '0.0';
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

function getStars(rating) {
  const value = Math.round(rating);
  return '&#9733;'.repeat(value) + '&#9734;'.repeat(5 - value);
}

function getWeightValue(weight) {
  return parseInt((weight || '').replace(/[^0-9]/g, ''), 10) || 0;
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

function getPriceForWeight(weight) {
  if (!currentHerb || !currentHerb.weights.length) return currentHerb ? currentHerb.price : 0;
  const baseWeight = currentHerb.weights[0];
  const baseAmount = getWeightValue(baseWeight);
  const selectedAmount = getWeightValue(weight || selectedWeight);
  if (!baseAmount || !selectedAmount) return currentHerb.price;

  const weightRatio = selectedAmount / baseAmount;
  const linearPrice = currentHerb.price * weightRatio;
  const discountedPrice = linearPrice * (1 - getBulkDiscount(weightRatio));

  return Math.max(currentHerb.price, Math.round(discountedPrice));
}

function updatePriceDisplay() {
  const priceEl = document.querySelector('.sd-price');
  const noteEl = document.querySelector('.sd-price-note');
  if (!priceEl || !noteEl) return;
  const selectedPrice = getPriceForWeight(selectedWeight);
  priceEl.textContent = `Rs.${selectedPrice}`;
  noteEl.textContent = `Price for ${selectedWeight} - Inclusive of all taxes`;
}

function renderHero(reviews) {
  const avg = getAvgRating(reviews);
  const weightPrice = getPriceForWeight(selectedWeight);

  // Build the 4 gallery image paths based on the herb image path
  const herbIdName = currentHerb.image.split('/').pop().replace(/\.(jpg|png|webp)$/, '');
  const shopBase = `images/shop/${herbIdName}`;
  galleryImages = [
    `${shopBase}-product.webp`,
    `${shopBase}-pack.webp`,
    currentHerb.image,
    `${shopBase}-use.webp`
  ];

  document.getElementById('sdHero').innerHTML = `
    <div class="sd-gallery-container">
      <div class="sd-hero-img">
        <img id="sdMainImage" src="${galleryImages[currentImageIndex]}" alt="${currentHerb.name}" onerror="this.onerror=null; this.src='${currentHerb.image}';">
        <button class="sd-gallery-arrow prev" onclick="navigateGallery(-1)" aria-label="Previous image">&#10094;</button>
        <button class="sd-gallery-arrow next" onclick="navigateGallery(1)" aria-label="Next image">&#10095;</button>
      </div>
      <div class="sd-thumbnails-strip" id="sdThumbnails">
        ${galleryImages.map((imgUrl, idx) => `
          <button class="sd-thumbnail ${idx === currentImageIndex ? 'active' : ''}" onclick="selectGalleryImage(${idx})" aria-label="View image ${idx + 1}">
            <img src="${imgUrl}" alt="${currentHerb.name} thumbnail ${idx + 1}" onerror="this.onerror=null; this.src='${currentHerb.image}';">
          </button>
        `).join('')}
      </div>
    </div>
    <div class="sd-hero-content">
      <a href="shop.html" class="sd-back-link">Back to Shop</a>
      <h1>${currentHerb.name}</h1>
      <span class="sd-sci">${currentHerb.scientific_name}</span>
      <div class="sd-rating-row">
        <span class="sd-stars">${getStars(parseFloat(avg))}</span>
        <span class="sd-rating-num">${avg}</span>
        <span class="sd-review-count">(${reviews.length} reviews)</span>
      </div>
      <div class="sd-price">Rs.${weightPrice}</div>
      <span class="sd-price-note">Price for ${selectedWeight} - Inclusive of all taxes</span>
      <span class="sd-weight-label">Select Weight</span>
      <div class="sd-weight-opts" id="weightOpts">
        ${currentHerb.weights.map(weight => `
          <button class="sd-wopt ${weight === selectedWeight ? 'active' : ''}"
            onclick="selectWeight('${weight}')">${weight}</button>
        `).join('')}
      </div>
      <div class="sd-qty-row">
        <span class="sd-qty-label">Quantity</span>
        <button class="sd-qty-btn" onclick="changeQty(-1)">-</button>
        <span class="sd-qty-num" id="qtyNum">${quantity}</span>
        <button class="sd-qty-btn" onclick="changeQty(1)">+</button>
      </div>
      <div class="sd-success" id="addSuccess">Added to cart successfully.</div>
      <div class="sd-btn-row">
        <button class="sd-add-btn" onclick="addToCart()" ${!currentHerb.stock ? 'disabled style="opacity:0.5"' : ''}>
          Add to Cart
        </button>
        <button class="sd-buy-btn" onclick="buyNow()" ${!currentHerb.stock ? 'disabled style="opacity:0.5"' : ''}>
          Buy Now
        </button>
      </div>
      <p class="sd-stock-note ${currentHerb.stock ? 'in' : 'out'}">
        ${currentHerb.stock ? 'In Stock - Ready to ship' : 'Out of Stock'}
      </p>
      <a class="sd-education-link" href="herb-detail.html?id=${currentHerb.id}">Read herb safety and dosage profile</a>
    </div>
  `;
}

function renderInfo() {
  const infoEl = document.getElementById('sdInfo');
  if (!infoEl || !currentHerb) return;

  const dosageCards = Object.entries(currentHerb.dosage || {}).map(([method, instruction]) => `
    <div class="sd-usage-card">
      <h4>${method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}</h4>
      <p>${instruction}</p>
    </div>
  `).join('');

  const benefitsList = (currentHerb.uses || []).map(use => `<li>${use}</li>`).join('');

  infoEl.innerHTML = `
    <div class="sd-info-grid">
      <div class="sd-info-section">
        <h2>Key Benefits</h2>
        <ul class="sd-benefits-list">${benefitsList}</ul>
      </div>
      <div class="sd-info-section">
        <h2>How to Use</h2>
        <div class="sd-usage-cards">${dosageCards}</div>
      </div>
    </div>
  `;
}

function renderReviews(allReviews, seededCount) {
  const avg = getAvgRating(allReviews);
  const reviewCards = allReviews.map((review, index) => {
    const isNew = review.__isLocal === true;
    return `
      <div class="sd-review-card ${isNew ? 'new-review' : ''}">
        <div class="sd-review-top">
          <span class="sd-reviewer-name">${review.name}</span>
          <span class="sd-review-date">${review.date || 'Just now'}</span>
        </div>
        <div class="sd-review-stars">${getStars(review.rating)}</div>
        <p class="sd-review-text">${review.review}</p>
        <span class="${isNew ? 'sd-new-badge' : 'sd-verified-badge'}">
          ${isNew ? 'New Review' : 'Verified Buyer'}
        </span>
      </div>
    `;
  }).join('');

  document.getElementById('sdReviews').innerHTML = `
    <div class="sd-reviews-header">
      <div class="sd-reviews-title">
        <h2>Customer <em>Reviews</em></h2>
        <p class="section-label">${allReviews.length} reviews for ${currentHerb.name}</p>
      </div>
      <div class="sd-overall-rating">
        <div class="sd-overall-num">${avg}</div>
        <div>
          <span class="sd-overall-stars">${getStars(parseFloat(avg))}</span>
          <span class="sd-overall-count">${allReviews.length} reviews</span>
        </div>
      </div>
    </div>
    <div class="sd-reviews-grid">${reviewCards}</div>
    <div class="sd-write-review">
      <h3>Write a Review</h3>
      <p>Share your experience with ${currentHerb.name}. Your review appears immediately.</p>
      <div class="sd-star-select" id="starSelect">
        ${[1, 2, 3, 4, 5].map(value => `
          <button class="sd-star-btn" onclick="setRating(${value})" aria-label="${value} star">&#9733;</button>
        `).join('')}
      </div>
      <input class="sd-review-input" id="reviewName" placeholder="Your name" type="text" value="${localStorage.getItem('userName') || ''}" ${localStorage.getItem('loggedIn') === 'true' ? 'readonly style="background: var(--cream); cursor: not-allowed;"' : ''}>
      <textarea class="sd-review-textarea" id="reviewText" placeholder="Share your experience with this herb..."></textarea>
      <button class="sd-submit-review-btn" onclick="submitReview()">Submit Review</button>
    </div>
  `;
}

function normalizeMatchValues(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim().toLowerCase()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
  return [];
}

function getRelatedByAilment() {
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

function renderRelated() {
  const related = getRelatedByAilment();

  document.getElementById('sdRelated').innerHTML = `
    <h2>Related <em>Products</em></h2>
    <div class="sd-related-grid">
      ${related.map(herb => `
        <div class="herb-card" onclick="window.location.href='shop-detail.html?id=${herb.id}'">
          <div class="herb-card-img">
            <img src="${herb.image}" alt="${herb.name}" loading="lazy" onerror="this.style.display='none'">
            <span class="herb-card-badge">Rs.${herb.price}</span>
          </div>
          <div class="herb-card-body">
            <h3>${herb.name}</h3>
            <span class="herb-card-sci">${herb.scientific_name}</span>
            <p>${herb.best_for}</p>
            <div class="tags">
              <span class="tag tag-green">${herb.weights[0]}</span>
              <span class="tag tag-${herb.safety}">${herb.safety}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function selectWeight(weight) {
  selectedWeight = weight;
  document.querySelectorAll('.sd-wopt').forEach(button => {
    button.classList.toggle('active', button.textContent === weight);
  });
  updatePriceDisplay();
}

function changeQty(change) {
  quantity = Math.max(1, quantity + change);
  document.getElementById('qtyNum').textContent = quantity;
}

function addToCart(options = {}) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const selectedPrice = getPriceForWeight(selectedWeight);
  const existingIndex = cart.findIndex(item => item.id === currentHerb.id && item.weight === selectedWeight);

  if (existingIndex !== -1) {
    const existing = cart[existingIndex];
    existing.qty += quantity;
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
      qty: quantity
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  showCartSuccess();
  updateCartCount(cart);
  if (!options.silentToast) {
    showToast(`${currentHerb.name} added to your cart.`, 'success');
  }
  return true;
}

function buildDirectCheckoutItem() {
  return {
    id: currentHerb.id,
    name: currentHerb.name,
    image: currentHerb.image,
    price: getPriceForWeight(selectedWeight),
    weight: selectedWeight,
    qty: quantity
  };
}

function buyNow() {
  if (!currentHerb.stock) return;

  const directItem = buildDirectCheckoutItem();
  /* Always persist the item so it survives the login redirect if needed */
  sessionStorage.setItem('directCheckoutItem', JSON.stringify(directItem));

  if (localStorage.getItem('loggedIn') !== 'true') {
    queueToast('Please sign in to continue to checkout.', 'warning');
    window.location.href = 'login.html?return=' + encodeURIComponent('checkout.html?mode=direct');
    return;
  }

  window.location.href = 'checkout.html?mode=direct';
}

function showCartSuccess(message = 'Added to cart successfully.') {
  const success = document.getElementById('addSuccess');
  if (!success) return;
  success.textContent = message;
  success.style.display = 'block';
  setTimeout(() => success.style.display = 'none', 2200);
}

function updateCartCount(cart) {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }
}

function handlePendingCartAdd() {
  if (new URLSearchParams(window.location.search).get('cartReady') !== '1') return;

  const pending = JSON.parse(sessionStorage.getItem('pendingShopDetailCart') || 'null');
  if (!pending || pending.id !== currentHerb.id) return;

  sessionStorage.removeItem('pendingShopDetailCart');
  selectedWeight = pending.weight;
  quantity = pending.qty;
  renderHero(getAllReviews());
  addToCart({ skipAuth: true, silentToast: true });
  showCartSuccess('Signed in successfully. The herb has been added to your cart.');
  showToast('Signed in successfully. The herb has been added to your cart.', 'success');
}

function setRating(rating) {
  selectedRating = rating;
  document.querySelectorAll('.sd-star-btn').forEach((button, index) => {
    button.classList.toggle('active', index < rating);
  });
}

function submitReview() {
  if (localStorage.getItem('loggedIn') !== 'true') {
    queueToast('Please sign in to write a review.', 'warning');
    window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
    return;
  }

  const name = document.getElementById('reviewName').value.trim();
  const text = document.getElementById('reviewText').value.trim();

  if (!name || !text) {
    showToast('Please enter your name and review.', 'error');
    return;
  }

  if (selectedRating === 0) {
    showToast('Please select a star rating.', 'warning');
    return;
  }

  const localReviews = getLocalReviews();
  localReviews.push({
    name,
    rating: selectedRating,
    review: text,
    date: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    createdAt: new Date().toISOString(),
    verified: false
  });

  localStorage.setItem(`reviews-${currentHerb.id}`, JSON.stringify(localReviews));
  selectedRating = 0;
  const updatedReviews = getAllReviews();
  renderHero(updatedReviews);
  renderReviews(updatedReviews, seededReviewsCache.length);
  showToast('Review submitted successfully.', 'success');
  document.getElementById('sdReviews').scrollIntoView({ behavior: 'smooth' });
}

function selectGalleryImage(index) {
  currentImageIndex = index;
  const mainImg = document.getElementById('sdMainImage');
  if (mainImg) {
    mainImg.src = galleryImages[currentImageIndex];
  }
  const thumbnails = document.querySelectorAll('.sd-thumbnail');
  thumbnails.forEach((thumb, idx) => {
    if (idx === currentImageIndex) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

function navigateGallery(direction) {
  currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
  selectGalleryImage(currentImageIndex);
}

loadProduct();
