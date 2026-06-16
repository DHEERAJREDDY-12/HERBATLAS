/* ============================================================
   order-success.js — Order confirmation page
   ============================================================ */

const orderId   = new URLSearchParams(window.location.search).get('orderId');
const userEmail = localStorage.getItem('userEmail') || '';

if (!orderId) {
  window.location.href = 'orders.html';
}

function getOrder() {
  const all    = JSON.parse(localStorage.getItem('orders') || '{}');
  const orders = all[userEmail] || [];
  return orders.find(o => o.orderId === orderId) || null;
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch { return ''; }
}

function estimatedDelivery(iso) {
  try {
    const base = new Date(iso);
    base.setDate(base.getDate() + 5); /* +5 business days (simplified) */
    return base.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return '3–5 Business Days'; }
}

function renderSuccess() {
  const order = getOrder();

  if (!order) {
    /* Order not found — show a fallback */
    const card = document.getElementById('successCard');
    if (card) {
      const subtitle = document.getElementById('successSubtitle');
      if (subtitle) subtitle.textContent = 'Order details could not be found.';
    }
    return;
  }

  const addr    = order.address || {};
  const addrStr = [
    addr.addressLine1,
    addr.addressLine2,
    addr.area,
    addr.city,
    addr.state,
    addr.pincode
  ].filter(Boolean).join(', ');

  /* Details grid */
  const detailsEl = document.getElementById('successDetails');
  if (detailsEl) {
    detailsEl.innerHTML = `
      <div class="osd-row">
        <span class="osd-label">Order ID</span>
        <div class="osd-value"><strong>${escHtml(order.orderId)}</strong></div>
      </div>
      <div class="osd-row">
        <span class="osd-label">Order Date</span>
        <div class="osd-value">${formatDate(order.createdAt)}</div>
      </div>
      <div class="osd-row">
        <span class="osd-label">Payment</span>
        <div class="osd-value">${escHtml(order.paymentMethod)}</div>
      </div>
      <div class="osd-row">
        <span class="osd-label">Deliver To</span>
        <div class="osd-value">
          <strong>${escHtml(addr.fullName)}</strong>
          ${escHtml(addr.phone)}<br>${escHtml(addrStr)}
        </div>
      </div>
      <div class="osd-row">
        <span class="osd-label">Total Paid</span>
        <div class="osd-value"><strong>Rs.${order.total}</strong></div>
      </div>`;
  }

  /* Estimated delivery */
  const estEl = document.getElementById('estimatedDelivery');
  if (estEl) estEl.textContent = `By ${estimatedDelivery(order.createdAt)} (3–5 business days)`;

  /* Page title */
  document.title = `Order ${order.orderId} Confirmed — HerbAtlas`;
}

renderSuccess();
