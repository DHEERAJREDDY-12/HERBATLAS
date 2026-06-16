/* ============================================================
   profile.js — Account hub page
   ============================================================ */

/* Auth gate */
if (localStorage.getItem('loggedIn') !== 'true') {
  window.location.href = 'login.html?return=profile.html';
}

const userEmail = localStorage.getItem('userEmail') || '';
const userName  = localStorage.getItem('userName')  || 'there';

/* ── Populate hero ─────────────────────────────────────── */
const nameEl  = document.getElementById('profileName');
const emailEl = document.getElementById('profileEmail');
if (nameEl)  nameEl.textContent  = userName;
if (emailEl) emailEl.textContent = userEmail;

/* ── Read addresses ───────────────────────────────────── */
function getAddresses() {
  const all = JSON.parse(localStorage.getItem('addresses') || '{}');
  return all[userEmail] || [];
}

/* ── Read orders ──────────────────────────────────────── */
function getOrders() {
  const all = JSON.parse(localStorage.getItem('orders') || '{}');
  return all[userEmail] || [];
}

/* ── Order count badge ───────────────────────────────── */
const orders     = getOrders();
const orderBadge = document.getElementById('orderCountBadge');
if (orderBadge && orders.length > 0) {
  orderBadge.textContent = orders.length;
  orderBadge.classList.remove('hidden');
}

/* ── Address count badge ─────────────────────────────── */
const addresses = getAddresses();
const addrBadge = document.getElementById('addrCountBadge');
if (addrBadge && addresses.length > 0) {
  addrBadge.textContent = addresses.length;
  addrBadge.classList.remove('hidden');
}

/* ── Default address strip ───────────────────────────── */
const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
if (defaultAddr) {
  const strip    = document.getElementById('profileAddressStrip');
  const addrName = document.getElementById('profileAddrName');
  const addrDet  = document.getElementById('profileAddrDetail');
  if (strip) {
    addrName.textContent = defaultAddr.fullName + ' · ' + defaultAddr.phone;
    addrDet.textContent  = [defaultAddr.city, defaultAddr.state, defaultAddr.pincode]
      .filter(Boolean).join(', ');
    strip.classList.remove('hidden');
  }
}

/* ── Logout ──────────────────────────────────────────── */
const logoutBtn = document.getElementById('profileLogoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedCoupon');
    if (typeof updateCartBadge === 'function') updateCartBadge();
    queueToast('Account signed out successfully', 'info');
    window.location.href = 'index.html';
  });
}
