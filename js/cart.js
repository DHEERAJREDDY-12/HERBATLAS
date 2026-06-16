/* ============================================================
   cart.js - HerbAtlas shopping cart
   Coupon logic is provided by coupon-utils.js (loaded in cart.html).
   If coupon-utils.js is not loaded, functions fall back safely.
   ============================================================ */

if (!window.COUPONS) {
  window.COUPONS = { HERB10: { type: 'percentage', value: 10, label: '10% off' } };
  window.calcDiscount = function(subtotal, code) {
    if (!code) return 0;
    const coupon = window.COUPONS[code];
    if (!coupon) return 0;
    if (coupon.type === 'percentage') return Math.round(subtotal * coupon.value / 100);
    if (coupon.type === 'fixed') return Math.min(coupon.value, subtotal);
    return 0;
  };
  window.calcTotals = function(cart, code) {
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = window.calcDiscount(subtotal, code);
    const discounted = subtotal - discount;
    const shipping = discounted >= 999 ? 0 : 99;
    const tax = Math.round(discounted * 0.05);
    const total = discounted + shipping + tax;
    return { itemCount, subtotal, discount, shipping, tax, total };
  };
}

let activeCoupon = localStorage.getItem('appliedCoupon') || null;
if (activeCoupon && !window.COUPONS[activeCoupon]) {
  activeCoupon = null;
  localStorage.removeItem('appliedCoupon');
}

function getCartRenderSignature(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = window.calcDiscount(subtotal, activeCoupon);
  const hasFreeShipping = subtotal - discount >= 999;

  return cart
    .map(item => `${item.id}:${item.weight}:${item.qty}:${item.price}:${item.name}:${item.image}`)
    .sort()
    .join('|') + `|coupon:${activeCoupon || ''}|discount:${discount}|free:${hasFreeShipping}`;
}

function renderSummary() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const summary = document.getElementById('cartSummary');
  if (!summary) return;

  const { itemCount, subtotal, discount, shipping, tax, total } = window.calcTotals(cart, activeCoupon);
  const subtotalLabel = document.getElementById('cartSummarySubtotalLabel');
  const subtotalValue = document.getElementById('cartSummarySubtotalValue');
  const discountRow = document.getElementById('cartSummaryDiscountRow');
  const discountLabel = document.getElementById('cartSummaryDiscountLabel');
  const discountValue = document.getElementById('cartSummaryDiscountValue');
  const shippingRow = document.getElementById('cartSummaryShippingRow');
  const shippingValue = document.getElementById('cartSummaryShippingValue');
  const taxValue = document.getElementById('cartSummaryTaxValue');
  const totalValue = document.getElementById('cartSummaryTotalValue');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');

  if (!subtotalLabel || !subtotalValue || !discountRow || !discountLabel || !discountValue ||
      !shippingRow || !shippingValue || !taxValue || !totalValue || !checkoutBtn) {
    return;
  }

  subtotalLabel.textContent = `Subtotal (${itemCount} item${itemCount !== 1 ? 's' : ''})`;
  subtotalValue.textContent = `Rs.${subtotal}`;

  if (activeCoupon) {
    discountRow.classList.remove('is-empty');
    discountLabel.textContent = `Discount (${activeCoupon})`;
    discountValue.textContent = `-Rs.${discount}`;
  } else {
    discountRow.classList.add('is-empty');
    discountLabel.textContent = 'Discount';
    discountValue.textContent = 'Rs.0';
  }

  shippingRow.classList.toggle('free', shipping === 0);
  shippingValue.textContent = shipping === 0 ? 'Free' : `Rs.${shipping}`;
  taxValue.textContent = `Rs.${tax}`;
  totalValue.textContent = `Rs.${total}`;
  checkoutBtn.disabled = false;
  checkoutBtn.onclick = checkout;
}

function syncCouponUI() {
  const input = document.getElementById('couponInput');
  const applyBtn = document.getElementById('couponApplyBtn');
  const appliedEl = document.getElementById('couponApplied');
  const codeEl = document.getElementById('couponAppliedCode');
  const msgEl = document.getElementById('couponMsg');

  if (!input || !applyBtn || !appliedEl || !codeEl) return;

  if (activeCoupon) {
    input.value = activeCoupon;
    input.disabled = true;
    applyBtn.disabled = true;
    codeEl.textContent = activeCoupon;
    appliedEl.classList.remove('is-hidden');
  } else {
    input.value = '';
    input.disabled = false;
    applyBtn.disabled = false;
    appliedEl.classList.add('is-hidden');
    if (msgEl && msgEl.classList.contains('success')) {
      msgEl.textContent = '';
      msgEl.className = 'coupon-msg';
    }
  }
}

function setCouponMsg(text, type) {
  const msgEl = document.getElementById('couponMsg');
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = 'coupon-msg' + (type ? ` ${type}` : '');
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const applyBtn = document.getElementById('couponApplyBtn');
  if (!input || !applyBtn) return;

  const code = input.value.trim().toUpperCase();

  if (activeCoupon && activeCoupon === code) {
    setCouponMsg('Coupon already applied.', 'error');
    showToast('Coupon already applied.', 'warning');
    return;
  }

  applyBtn.disabled = true;
  applyBtn.textContent = '...';

  setTimeout(() => {
    applyBtn.textContent = 'Apply';

    if (!code) {
      setCouponMsg('Please enter a coupon code.', 'error');
      showToast('Please enter a coupon code.', 'warning');
      applyBtn.disabled = false;
      return;
    }

    if (!window.COUPONS[code]) {
      setCouponMsg('Invalid coupon code.', 'error');
      showToast('Invalid coupon code', 'error');
      applyBtn.disabled = false;
      return;
    }

    activeCoupon = code;
    localStorage.setItem('appliedCoupon', code);
    const coupon = window.COUPONS[code];
    setCouponMsg(`${code} applied successfully. ${coupon.label} added.`, 'success');
    showToast('Coupon applied successfully', 'success');
    syncCouponUI();
    renderSummary();
  }, 350);
}

function removeCoupon() {
  activeCoupon = null;
  localStorage.removeItem('appliedCoupon');
  setCouponMsg('', '');
  syncCouponUI();
  renderSummary();
  showToast('Coupon removed successfully', 'info');
}

function renderCartItem(item, index) {
  let displayImage = item.image;
  if (displayImage && displayImage.includes('images/herbs/')) {
    const name = displayImage.split('/').pop().replace(/\.(jpg|png|webp)$/, '');
    displayImage = `images/shop/${name}-pack.webp`;
  }

  return `
    <div class="cart-item" id="item-${item.id}-${item.weight}"
         style="cursor:pointer"
         onclick="window.location.href='shop-detail.html?id=${item.id}&weight=${encodeURIComponent(item.weight)}'">
      <div class="cart-item-img">
        <img src="${displayImage}" alt="${item.name}" width="128" height="128"
          ${index === 0 ? 'fetchpriority="high" decoding="async"' : index === 1 ? 'decoding="async"' : 'loading="lazy" decoding="async"'}
          onerror="this.style.display='none'">
      </div>
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p>${item.weight} - Certified Organic</p>
        <div class="cart-controls" onclick="event.stopPropagation()">
          <button class="qty-btn" aria-label="Decrease quantity"
            onclick="changeQty(${item.id}, '${item.weight}', -1)">-</button>
          <span class="qty-num" id="qty-${item.id}-${item.weight}">${item.qty}</span>
          <button class="qty-btn" aria-label="Increase quantity"
            onclick="changeQty(${item.id}, '${item.weight}', 1)">+</button>
          <button class="remove-btn"
            onclick="removeItem(${item.id}, '${item.weight}')">Remove</button>
        </div>
      </div>
      <div class="cart-item-price">
        Rs.<span id="price-${item.id}-${item.weight}">${item.price * item.qty}</span>
      </div>
    </div>
  `;
}

function renderFreeShippingNotice(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = window.calcDiscount(subtotal, activeCoupon);

  if (subtotal - discount < 999) return '';

  return `
    <div class="free-shipping-notice">
      <strong>Great news!</strong> You qualify for free shipping on this order.
    </div>
  `;
}

function loadCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const displayCart = [...cart].reverse();
  const cartItems = document.getElementById('cartItems');
  const cartBody = document.getElementById('cartBody');
  const emptyCart = document.getElementById('emptyCart');
  const cartSubtitle = document.getElementById('cartSubtitle');

  if (!cartItems || !cartBody || !emptyCart || !cartSubtitle) return;

  if (!cart.length) {
    cartBody.classList.add('hidden');
    emptyCart.classList.remove('hidden');
    cartSubtitle.textContent = 'Your cart is empty';
    return;
  }

  cartBody.classList.remove('hidden');
  emptyCart.classList.add('hidden');

  const { itemCount } = window.calcTotals(cart, null);
  cartSubtitle.textContent = itemCount === 1 ? '1 item in your cart' : `${itemCount} items in your cart`;
  const renderSignature = getCartRenderSignature(cart);
  const nextMarkup = displayCart.map(renderCartItem).join('') + renderFreeShippingNotice(cart);

  if (cartItems.dataset.renderSignature !== renderSignature) {
    cartItems.innerHTML = nextMarkup;
    cartItems.dataset.renderSignature = renderSignature;
  }

  renderSummary();
  syncCouponUI();
}

function changeQty(id, weight, change) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const itemIndex = cart.findIndex(entry => entry.id === id && entry.weight === weight);
  if (itemIndex === -1) return;

  const item = cart[itemIndex];
  item.qty = Math.max(1, item.qty + change);
  cart.splice(itemIndex, 1);
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
  updateBadge();
}

function removeItem(id, weight) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart = cart.filter(item => !(item.id === id && item.weight === weight));
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
  updateBadge();
}

function checkout() {
  if (localStorage.getItem('loggedIn') !== 'true') {
    queueToast('Please sign in to proceed to checkout.', 'warning');
    window.location.href = 'login.html?return=checkout.html';
    return;
  }
  window.location.href = 'checkout.html';
}

function updateBadge() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

window.updateCartBadge = updateBadge;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('couponForm');
  const applyBtn = document.getElementById('couponApplyBtn');
  const removeBtn = document.getElementById('couponRemoveBtn');
  const input = document.getElementById('couponInput');
  const availableCouponCard = document.querySelector('.coupon-available-card[data-coupon-code]');

  if (form) form.addEventListener('submit', applyCoupon);
  if (applyBtn) applyBtn.addEventListener('click', applyCoupon);
  if (removeBtn) removeBtn.addEventListener('click', removeCoupon);

  if (input) {
    input.addEventListener('input', () => {
      const msgEl = document.getElementById('couponMsg');
      if (msgEl && msgEl.classList.contains('error')) {
        msgEl.textContent = '';
        msgEl.className = 'coupon-msg';
      }
    });
  }

  if (availableCouponCard && input) {
    const applyAvailableCoupon = () => {
      if (input.disabled) return;
      input.value = availableCouponCard.dataset.couponCode || '';
      applyCoupon();
    };

    availableCouponCard.addEventListener('click', applyAvailableCoupon);
    availableCouponCard.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        applyAvailableCoupon();
      }
    });
  }
});
loadCart();
