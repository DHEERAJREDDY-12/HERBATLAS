/* ============================================================
   orders.js — Order history page
   ============================================================ */

/* Auth gate */
if (localStorage.getItem('loggedIn') !== 'true') {
  window.location.href = 'login.html?return=orders.html';
}

const userEmail = localStorage.getItem('userEmail') || '';

function getOrders() {
  const all = JSON.parse(localStorage.getItem('orders') || '{}');
  return all[userEmail] || [];
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return iso; }
}

function statusClass(status) {
  const map = {
    'Pending': 'pending', 'Processing': 'processing',
    'Shipped': 'shipped', 'Delivered': 'delivered'
  };
  return map[status] || 'pending';
}

function renderOrders() {
  const orders   = getOrders();
  const subtitle = document.getElementById('ordersSubtitle');
  const list     = document.getElementById('ordersList');
  if (!list) return;

  if (subtitle) {
    subtitle.textContent = orders.length
      ? `${orders.length} order${orders.length !== 1 ? 's' : ''} placed`
      : 'No orders yet';
  }

  if (orders.length === 0) {
    list.innerHTML = `
      <div class="orders-empty">
        <h3>No orders yet</h3>
        <p>Browse our herb shop and place your first order.</p>
        <a href="shop.html" class="btn-primary">Browse Shop</a>
      </div>`;
    return;
  }

  list.innerHTML = orders.map((order, idx) => {
    const addr = order.address || {};
    const addrStr = [addr.addressLine1, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');

    const itemRows = (order.items || []).map(item => `
      <tr>
        <td>${escHtml(item.name)}</td>
        <td>${escHtml(item.weight)}</td>
        <td>${item.qty}</td>
        <td>Rs.${item.price * item.qty}</td>
      </tr>`).join('');

    const discountRow = order.discount > 0
      ? `<div class="order-total-row discount">
           <span>Discount${order.couponCode ? ' (' + escHtml(order.couponCode) + ')' : ''}</span>
           <span>−Rs.${order.discount}</span>
         </div>`
      : '';

    return `
      <div class="order-card" id="orderCard-${idx}" onclick="toggleOrder(${idx})">
        <div class="order-card-head">
          <div>
            <div class="order-id">${escHtml(order.orderId)}</div>
            <div class="order-date">${formatDate(order.createdAt)}</div>
          </div>
          <span class="order-status-badge ${statusClass(order.status)}">${escHtml(order.status)}</span>
          <div class="order-amount">Rs.${order.total}</div>
          <span class="order-toggle-icon" aria-hidden="true">&#9660;</span>
        </div>

        <div class="order-detail">
          <div class="order-detail-grid">
            <div class="order-detail-block">
              <h4>Delivery Address</h4>
              <p>
                <strong>${escHtml(addr.fullName || '')}</strong><br>
                ${escHtml(addr.phone || '')}<br>
                ${escHtml(addrStr)}
              </p>
            </div>
            <div class="order-detail-block">
              <h4>Payment Method</h4>
              <p>${escHtml(order.paymentMethod || '')}</p>
            </div>
          </div>

          <table class="order-items-table" aria-label="Order items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Weight</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div class="order-totals">
            <div class="order-total-row"><span>Subtotal</span><span>Rs.${order.subtotal}</span></div>
            ${discountRow}
            <div class="order-total-row">
              <span>Shipping</span>
              <span>${order.shipping === 0 ? 'Free' : 'Rs.' + order.shipping}</span>
            </div>
            <div class="order-total-row"><span>GST</span><span>Rs.${order.tax}</span></div>
            <div class="order-total-row grand"><span>Total</span><span>Rs.${order.total}</span></div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleOrder(idx) {
  const card = document.getElementById(`orderCard-${idx}`);
  if (card) card.classList.toggle('open');
}

renderOrders();
