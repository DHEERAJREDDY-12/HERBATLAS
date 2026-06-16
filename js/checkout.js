/* ============================================================
   checkout.js - Multi-step checkout page
   Depends on: coupon-utils.js

   Two modes:
   - Normal (cart mode):  checkout.html
     Reads items from localStorage 'cart'. Shows coupon panel.

   - Direct (buy-now mode): checkout.html?mode=direct
     Reads a single item from sessionStorage 'directCheckoutItem'.
     Hides the coupon panel (no coupon on single-item direct buy).
     Does NOT clear the cart on order placement.
   ============================================================ */

if (localStorage.getItem('loggedIn') !== 'true') {
  /* Preserve mode=direct so the return URL brings them back correctly */
  const returnTarget = window.location.search.includes('mode=direct')
    ? 'checkout.html?mode=direct'
    : 'checkout.html';
  window.location.href = 'login.html?return=' + encodeURIComponent(returnTarget);
}

/* ── Detect mode ──────────────────────────────────────────── */
const checkoutMode = new URLSearchParams(window.location.search).get('mode'); // 'direct' | null
const isDirect = checkoutMode === 'direct';

/* ── Resolve items for this session ──────────────────────── */
let cartData;

if (isDirect) {
  /* Buy Now path — single item from sessionStorage */
  const directItem = JSON.parse(sessionStorage.getItem('directCheckoutItem') || 'null');
  if (!directItem) {
    /* Nothing to buy — fall back to cart or shop */
    window.location.href = localStorage.getItem('cart')
      ? 'cart.html'
      : 'shop.html';
  }
  cartData = [directItem];
} else {
  /* Normal cart path */
  cartData = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cartData.length === 0) {
    window.location.href = 'cart.html';
  }
}

const userEmail = localStorage.getItem('userEmail') || '';

/* Coupons only apply in cart mode */
let activeCoupon = isDirect ? null : (localStorage.getItem('appliedCoupon') || null);

if (activeCoupon && !window.COUPONS[activeCoupon]) {
  activeCoupon = null;
  localStorage.removeItem('appliedCoupon');
}

let selectedAddressId = null;

function getAddresses() {
  const store = JSON.parse(localStorage.getItem('addresses') || '{}');
  return store[userEmail] || [];
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAddresses() {
  const addresses = getAddresses();
  const container = document.getElementById('addressListCO');
  const addAddrBtn = document.getElementById('coAddAddrBtn');
  if (!container) return;

  if (addresses.length === 0) {
    const returnUrl = isDirect ? 'checkout.html?mode=direct' : 'checkout.html';
    const addUrl = `addresses.html?return=${encodeURIComponent(returnUrl)}`;

    container.innerHTML = `
      <div class="checkout-addr-empty">
        <div class="checkout-addr-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <h3 class="checkout-addr-empty-title">No delivery address saved</h3>
        <p class="checkout-addr-empty-sub">
          You need at least one delivery address to place your order.
        </p>
        <a href="${addUrl}" class="checkout-addr-empty-cta">
          + Add Delivery Address
        </a>
      </div>`;

    /* Hide the secondary dashed button — the CTA above is sufficient */
    if (addAddrBtn) addAddrBtn.style.display = 'none';

    selectedAddressId = null;
    updatePlaceOrderBtn();
    return;
  }

  /* Addresses exist — show the dashed "add another" button */
  if (addAddrBtn) addAddrBtn.style.display = '';

  const preselect = addresses.find(addr => addr.isDefault) || addresses[0];
  if (!selectedAddressId) selectedAddressId = preselect.id;
  container.innerHTML = `
    <div class="checkout-addr-list" role="radiogroup" aria-label="Select delivery address">
      ${addresses.map(addr => `
        <label class="checkout-addr-card ${addr.id === selectedAddressId ? 'selected' : ''}" for="coAddr-${addr.id}">
          <input
            type="radio"
            name="coAddress"
            id="coAddr-${addr.id}"
            value="${addr.id}"
            ${addr.id === selectedAddressId ? 'checked' : ''}
          >
          <div class="checkout-addr-card-body">
            <div class="checkout-addr-name">${escHtml(addr.fullName)}</div>
            <div class="checkout-addr-phone">${escHtml(addr.phone)}</div>
            <div class="checkout-addr-text">
              ${escHtml(addr.addressLine1)}${addr.addressLine2 ? ', ' + escHtml(addr.addressLine2) : ''}<br>
              ${addr.area ? escHtml(addr.area) + ', ' : ''}${escHtml(addr.city)}, ${escHtml(addr.state)} - ${escHtml(addr.pincode)}
            </div>
          </div>
        </label>
      `).join('')}
    </div>`;

  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedAddressId = radio.value;
      container.querySelectorAll('.checkout-addr-card').forEach(card => {
        card.classList.toggle('selected', card.querySelector('input').value === selectedAddressId);
      });
      updatePlaceOrderBtn();
      markStepDone('step1Indicator');
    });
  });

  updatePlaceOrderBtn();
}

function renderItems() {
  const list = document.getElementById('coItemList');
  if (!list) return;

  const fragment = document.createDocumentFragment();

  cartData.forEach(item => {
    const row = document.createElement('div');
    row.className = 'co-item-row';

    const copy = document.createElement('div');

    const name = document.createElement('div');
    name.className = 'co-item-name';
    name.textContent = item.name;

    const weight = document.createElement('div');
    weight.className = 'co-item-weight';
    weight.textContent = item.weight;

    const qty = document.createElement('span');
    qty.className = 'co-item-qty';
    qty.textContent = `x${item.qty}`;

    const price = document.createElement('span');
    price.className = 'co-item-price';
    price.textContent = `Rs.${item.price * item.qty}`;

    copy.appendChild(name);
    copy.appendChild(weight);
    row.appendChild(copy);
    row.appendChild(qty);
    row.appendChild(price);
    fragment.appendChild(row);
  });

  list.replaceChildren(fragment);
  list.removeAttribute('aria-busy');
}

function renderTotals() {
  const totals = window.calcTotals(cartData, activeCoupon);
  const totalsWrap = document.getElementById('coTotals');
  if (!totalsWrap) return;

  const subtotalValue = document.getElementById('coSubtotalValue');
  const discountRow = document.getElementById('coDiscountRow');
  const discountLabel = document.getElementById('coDiscountLabel');
  const discountValue = document.getElementById('coDiscountValue');
  const shippingRow = document.getElementById('coShippingRow');
  const shippingValue = document.getElementById('coShippingValue');
  const taxValue = document.getElementById('coTaxValue');
  const totalValue = document.getElementById('coTotalValue');

  if (subtotalValue) subtotalValue.textContent = `Rs.${totals.subtotal}`;
  if (taxValue) taxValue.textContent = `Rs.${totals.tax}`;
  if (totalValue) totalValue.textContent = `Rs.${totals.total}`;

  if (shippingValue) {
    shippingValue.textContent = totals.shipping === 0 ? 'Free' : `Rs.${totals.shipping}`;
  }
  if (shippingRow) {
    shippingRow.classList.toggle('free', totals.shipping === 0);
  }

  if (discountRow && discountLabel && discountValue) {
    if (activeCoupon) {
      discountLabel.textContent = `Discount (${activeCoupon})`;
      discountValue.textContent = `-Rs.${totals.discount}`;
      discountRow.classList.remove('hidden');
    } else {
      discountLabel.textContent = 'Discount';
      discountValue.textContent = '-Rs.0';
      discountRow.classList.add('hidden');
    }
  }

  totalsWrap.removeAttribute('aria-busy');
}

function getSelectedPaymentLabel() {
  const method = document.querySelector('input[name="paymentMethod"]:checked');
  if (!method) return null;

  if (method.value === 'upi') {
    const sub = document.querySelector('input[name="upiOption"]:checked');
    if (!sub) return null;
    if (sub.value === 'Other UPI') {
      const upiId = document.getElementById('upiIdInput').value.trim();
      return upiId ? `UPI (${upiId})` : null;
    }
    return `${sub.value} (UPI)`;
  }

  if (method.value === 'netbanking') {
    const bank = document.querySelector('input[name="bankOption"]:checked');
    return bank ? `${bank.value} Net Banking` : null;
  }

  if (method.value === 'card') {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    return cardNumber.length >= 4 ? `Card ending ${cardNumber.slice(-4)}` : null;
  }

  if (method.value === 'cod') {
    return 'Cash on Delivery';
  }

  return null;
}

function showFieldError(id, message) {
  const error = document.getElementById(id);
  if (error) error.textContent = message;
  const input = error?.previousElementSibling;
  if (input && input.tagName === 'INPUT') input.classList.add('error');
}

function clearFieldError(id) {
  const error = document.getElementById(id);
  if (error) error.textContent = '';
  const input = error?.previousElementSibling;
  if (input && input.tagName === 'INPUT') input.classList.remove('error');
}

function isExpiryFuture(expiry) {
  const [mm, yy] = expiry.split('/').map(Number);
  const now = new Date();
  const exp = new Date(2000 + yy, mm - 1);
  return exp > now;
}

function validatePayment() {
  const method = document.querySelector('input[name="paymentMethod"]:checked');
  if (!method) return { valid: false, msg: 'Please select a payment method.' };

  if (method.value === 'upi') {
    const sub = document.querySelector('input[name="upiOption"]:checked');
    if (!sub) return { valid: false, msg: 'Please select a UPI option.' };
    if (sub.value === 'Other UPI') {
      const upiId = document.getElementById('upiIdInput').value.trim();
      if (!upiId) {
        showFieldError('errUpiId', 'Please enter your UPI ID.');
        return { valid: false, msg: 'Please enter your UPI ID.' };
      }
      clearFieldError('errUpiId');
    }
    return { valid: true };
  }

  if (method.value === 'netbanking') {
    const bank = document.querySelector('input[name="bankOption"]:checked');
    return bank ? { valid: true } : { valid: false, msg: 'Please select a bank.' };
  }

  if (method.value === 'card') {
    let valid = true;
    const number = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const holder = document.getElementById('cardHolder').value.trim();
    const expiry = document.getElementById('cardExpiry').value.trim();
    const cvv = document.getElementById('cardCvv').value.trim();

    if (!/^\d{16}$/.test(number)) {
      showFieldError('errCardNum', 'Enter a valid 16-digit card number.');
      valid = false;
    } else {
      clearFieldError('errCardNum');
    }

    if (!holder) {
      showFieldError('errCardHolder', 'Card holder name is required.');
      valid = false;
    } else {
      clearFieldError('errCardHolder');
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) || !isExpiryFuture(expiry)) {
      showFieldError('errCardExpiry', 'Enter a valid future expiry (MM/YY).');
      valid = false;
    } else {
      clearFieldError('errCardExpiry');
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      showFieldError('errCardCvv', 'Enter a valid CVV.');
      valid = false;
    } else {
      clearFieldError('errCardCvv');
    }

    return valid ? { valid: true } : { valid: false, msg: 'Please fix card details.' };
  }

  if (method.value === 'cod') {
    return { valid: true };
  }

  return { valid: false, msg: 'Please select a payment method.' };
}

function updatePlaceOrderBtn() {
  const button = document.getElementById('placeOrderBtn');
  if (!button) return;

  const ready = Boolean(selectedAddressId);
  button.disabled = !ready;
  button.setAttribute('aria-disabled', String(!ready));
}

function markStepDone(stepId) {
  const step = document.getElementById(stepId);
  if (!step) return;
  step.classList.remove('active');
  step.classList.add('done');
}

function setupPaymentToggles() {
  const methods = ['upi', 'netbanking', 'card', 'cod'];
  const panelMap = {
    upi: 'pmUpiPanel',
    netbanking: 'pmNetPanel',
    card: 'pmCardPanel',
    cod: 'pmCodPanel'
  };
  const triggerMap = {
    upi: 'pmUpiTrigger',
    netbanking: 'pmNetTrigger',
    card: 'pmCardTrigger',
    cod: 'pmCodTrigger'
  };

  methods.forEach(method => {
    const radio = document.getElementById(`pm${method.charAt(0).toUpperCase()}${method.slice(1)}`);
    if (!radio) return;

    radio.addEventListener('change', () => {
      methods.forEach(name => {
        const panel = document.getElementById(panelMap[name]);
        const trigger = document.getElementById(triggerMap[name]);
        if (panel) panel.classList.remove('visible');
        if (trigger) trigger.classList.remove('selected');
      });

      const panel = document.getElementById(panelMap[method]);
      const trigger = document.getElementById(triggerMap[method]);
      if (panel) panel.classList.add('visible');
      if (trigger) trigger.classList.add('selected');
      markStepDone('step2Indicator');
    });
  });

  document.querySelectorAll('input[name="upiOption"]').forEach(option => {
    option.addEventListener('change', () => {
      const wrap = document.getElementById('upiIdWrap');
      if (wrap) wrap.classList.toggle('visible', option.value === 'Other UPI');
      document.querySelectorAll('.payment-sub-opt').forEach(label => {
        label.classList.toggle('selected', label.querySelector('input') === option);
      });
    });
  });

  document.querySelectorAll('input[name="bankOption"]').forEach(option => {
    option.addEventListener('change', () => {
      document.querySelectorAll('input[name="bankOption"]').forEach(bank => {
        bank.closest('.payment-sub-opt')?.classList.toggle('selected', bank === option);
      });
    });
  });

  const cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', event => {
      let value = event.target.value.replace(/\D/g, '').slice(0, 16);
      event.target.value = value.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  const cardExpiry = document.getElementById('cardExpiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', event => {
      let value = event.target.value.replace(/\D/g, '').slice(0, 4);
      if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
      event.target.value = value;
    });
  }
}

function setCouponMsg(text, type = '') {
  const msg = document.getElementById('coCouponMsg');
  if (!msg) return;
  msg.textContent = text;
  msg.className = `coupon-msg${type ? ` ${type}` : ''}`;
}

function syncCouponUI() {
  const input = document.getElementById('coCouponInput');
  const applyBtn = document.getElementById('coCouponApplyBtn');
  const applied = document.getElementById('coCouponApplied');
  const code = document.getElementById('coCouponAppliedCode');
  const msg = document.getElementById('coCouponMsg');
  if (!input || !applyBtn || !applied || !code) return;

  if (activeCoupon) {
    input.value = activeCoupon;
    input.disabled = true;
    applyBtn.disabled = true;
    code.textContent = activeCoupon;
    applied.classList.remove('hidden');
  } else {
    input.value = '';
    input.disabled = false;
    applyBtn.disabled = false;
    applied.classList.add('hidden');
    if (msg?.classList.contains('success')) {
      msg.textContent = '';
      msg.className = 'coupon-msg';
    }
  }
}

function applyCoupon() {
  const input = document.getElementById('coCouponInput');
  const applyBtn = document.getElementById('coCouponApplyBtn');
  if (!input || !applyBtn) return;

  const code = input.value.trim().toUpperCase();

  if (activeCoupon && activeCoupon === code) {
    setCouponMsg('Coupon already applied.', 'error');
    showToast('Coupon already applied.', 'warning');
    return;
  }

  applyBtn.disabled = true;
  applyBtn.textContent = '...';

  window.setTimeout(() => {
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
    setCouponMsg(`${code} applied. ${window.COUPONS[code].label} added.`, 'success');
    showToast('Coupon applied successfully', 'success');
    syncCouponUI();
    renderTotals();
  }, 350);
}

function removeCoupon() {
  activeCoupon = null;
  localStorage.removeItem('appliedCoupon');
  setCouponMsg('');
  syncCouponUI();
  renderTotals();
  showToast('Coupon removed successfully', 'info');
}

function generateOrderId() {
  const year = new Date().getFullYear();
  const counter = parseInt(localStorage.getItem('orderCounter') || '0', 10) + 1;
  localStorage.setItem('orderCounter', String(counter));
  return `HERB-${year}-${String(counter).padStart(6, '0')}`;
}

function showPlaceErr(message) {
  const error = document.getElementById('placeOrderErr');
  showToast(message, 'error');
  if (error) {
    error.textContent = message;
    window.setTimeout(() => {
      error.textContent = '';
    }, 4000);
  }
}

function placeOrder() {
  if (!selectedAddressId) {
    showPlaceErr('Please select a delivery address.');
    return;
  }

  const paymentState = validatePayment();
  if (!paymentState.valid) {
    showPlaceErr(paymentState.msg);
    return;
  }

  const address = getAddresses().find(item => item.id === selectedAddressId);
  const paymentLabel = getSelectedPaymentLabel();
  const totals = window.calcTotals(cartData, activeCoupon);

  const order = {
    orderId: generateOrderId(),
    userId: userEmail,
    items: cartData.map(item => ({
      id: item.id,
      name: item.name,
      weight: item.weight,
      qty: item.qty,
      price: item.price
    })),
    address: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      area: address.area || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode
    },
    paymentMethod: paymentLabel,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    couponCode: activeCoupon || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  const allOrders = JSON.parse(localStorage.getItem('orders') || '{}');
  const userOrders = allOrders[userEmail] || [];
  userOrders.unshift(order);
  allOrders[userEmail] = userOrders;
  localStorage.setItem('orders', JSON.stringify(allOrders));

  if (isDirect) {
    /* Buy Now — only clear the direct item, leave cart intact */
    sessionStorage.removeItem('directCheckoutItem');
  } else {
    /* Cart checkout — clear cart and coupon */
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedCoupon');
  }

  queueToast('Order placed successfully', 'success');
  window.location.href = `order-success.html?orderId=${encodeURIComponent(order.orderId)}`;
}

function initCheckout() {
  /* In direct/Buy-Now mode, hide the coupon panel — no bulk discounts on instant buy */
  if (isDirect) {
    const couponPanel = document.getElementById('coCouponPanel');
    if (couponPanel) couponPanel.style.display = 'none';

    /* Update page subtitle to reflect single-item context */
    const headerDesc = document.querySelector('.checkout-header p:last-child');
    if (headerDesc) headerDesc.textContent = 'Review your item, select a delivery address and payment method';
  }

  renderAddresses();
  renderItems();
  renderTotals();
  setupPaymentToggles();
  syncCouponUI();

  const form = document.getElementById('coCouponForm');
  const applyBtn = document.getElementById('coCouponApplyBtn');
  const removeBtn = document.getElementById('coCouponRemoveBtn');
  const couponInput = document.getElementById('coCouponInput');
  const availableCouponCard = document.querySelector('.coupon-available-card[data-coupon-code]');
  const placeBtn = document.getElementById('placeOrderBtn');
  const addAddrBtn = document.getElementById('coAddAddrBtn');

  if (form) form.addEventListener('submit', applyCoupon);
  if (applyBtn) applyBtn.addEventListener('click', applyCoupon);
  if (removeBtn) removeBtn.addEventListener('click', removeCoupon);
  if (placeBtn) placeBtn.addEventListener('click', placeOrder);

  if (availableCouponCard && couponInput) {
    const applyAvailableCoupon = () => {
      if (couponInput.disabled) return;
      couponInput.value = availableCouponCard.dataset.couponCode || '';
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

  if (couponInput) {
    couponInput.addEventListener('input', () => {
      const msg = document.getElementById('coCouponMsg');
      if (msg?.classList.contains('error')) {
        msg.textContent = '';
        msg.className = 'coupon-msg';
      }
    });
  }

  if (addAddrBtn) {
    /* Return to the correct checkout URL after adding an address */
    const returnUrl = isDirect ? 'checkout.html?mode=direct' : 'checkout.html';
    addAddrBtn.addEventListener('click', () => {
      window.location.href = `addresses.html?return=${encodeURIComponent(returnUrl)}`;
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout, { once: true });
} else {
  initCheckout();
}
