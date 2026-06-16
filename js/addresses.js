/* ============================================================
   addresses.js — Address book CRUD
   Supports ?return=checkout.html to redirect after save.
   ============================================================ */

/* Auth gate */
if (localStorage.getItem('loggedIn') !== 'true') {
  window.location.href = 'login.html?return=addresses.html';
}

const userEmail  = localStorage.getItem('userEmail') || '';
const returnUrl  = new URLSearchParams(window.location.search).get('return') || null;
const pendingDeleteIds = new Map();

/* ── Storage helpers ─────────────────────────────────────── */
function getAllAddresses() {
  const store = JSON.parse(localStorage.getItem('addresses') || '{}');
  return store[userEmail] || [];
}

function saveAllAddresses(list) {
  const store = JSON.parse(localStorage.getItem('addresses') || '{}');
  store[userEmail] = list;
  localStorage.setItem('addresses', JSON.stringify(store));
}

/* ── Render address list ─────────────────────────────────── */
function renderAddressList() {
  const list = getAllAddresses();
  const container = document.getElementById('addressList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="addresses-empty">
        <p>No saved addresses yet. Add your first delivery address.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(addr => `
    <div class="address-card ${addr.isDefault ? 'is-default' : ''}" id="addrCard-${addr.id}">
      ${addr.isDefault ? '<span class="address-default-badge">Default</span>' : ''}
      <div class="address-card-name">${escHtml(addr.fullName)}</div>
      <div class="address-card-phone">${escHtml(addr.phone)}</div>
      <div class="address-card-lines">
        ${escHtml(addr.addressLine1)}${addr.addressLine2 ? ', ' + escHtml(addr.addressLine2) : ''}<br>
        ${addr.area ? escHtml(addr.area) + ', ' : ''}${escHtml(addr.city)}, ${escHtml(addr.state)} — ${escHtml(addr.pincode)}
      </div>
      <div class="address-card-actions">
        <button class="addr-action-btn" onclick="editAddress('${addr.id}')">Edit</button>
        ${!addr.isDefault ? `<button class="addr-action-btn set-default" onclick="setDefault('${addr.id}')">Set Default</button>` : ''}
        <button class="addr-action-btn delete" onclick="deleteAddress('${addr.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

/* ── HTML escape helper ──────────────────────────────────── */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Form helpers ────────────────────────────────────────── */
function clearForm() {
  document.getElementById('addrEditId').value    = '';
  document.getElementById('addrFullName').value  = '';
  document.getElementById('addrPhone').value     = '';
  document.getElementById('addrLine1').value     = '';
  document.getElementById('addrLine2').value     = '';
  document.getElementById('addrArea').value      = '';
  document.getElementById('addrCity').value      = '';
  document.getElementById('addrState').value     = '';
  document.getElementById('addrPincode').value   = '';
  document.getElementById('addrSetDefault').checked = false;
  document.getElementById('addrFormTitle').textContent = 'Add New Address';
  document.getElementById('addrSaveBtn').textContent   = 'Save Address';
  document.getElementById('addrCancelBtn').classList.add('hidden');
  clearErrors();
}

function clearErrors() {
  ['errFullName','errPhone','errLine1','errCity','errState','errPincode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ['addrFullName','addrPhone','addrLine1','addrCity','addrState','addrPincode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error');
  });
}

function setError(fieldId, errId, message) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add('error');
  if (err)   err.textContent = message;
}

/* ── Validation ──────────────────────────────────────────── */
function validateForm() {
  clearErrors();
  let valid = true;

  const fullName = document.getElementById('addrFullName').value.trim();
  const phone    = document.getElementById('addrPhone').value.trim();
  const line1    = document.getElementById('addrLine1').value.trim();
  const city     = document.getElementById('addrCity').value.trim();
  const state    = document.getElementById('addrState').value;
  const pincode  = document.getElementById('addrPincode').value.trim();

  if (!fullName) {
    setError('addrFullName', 'errFullName', 'Full name is required.'); valid = false;
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    setError('addrPhone', 'errPhone', 'Enter a valid 10-digit phone number.'); valid = false;
  }
  if (!line1) {
    setError('addrLine1', 'errLine1', 'House / flat number is required.'); valid = false;
  }
  if (!city) {
    setError('addrCity', 'errCity', 'City is required.'); valid = false;
  }
  if (!state) {
    setError('addrState', 'errState', 'Please select a state.'); valid = false;
  }
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    setError('addrPincode', 'errPincode', 'Enter a valid 6-digit pincode.'); valid = false;
  }

  return valid;
}

/* ── Save address (add or edit) ──────────────────────────── */
function saveAddress(e) {
  e.preventDefault();
  if (!validateForm()) {
    showToast('Please correct the highlighted address fields.', 'error');
    return;
  }

  const editId     = document.getElementById('addrEditId').value;
  const setDefault = document.getElementById('addrSetDefault').checked;

  const data = {
    id:           editId || 'addr_' + Date.now(),
    fullName:     document.getElementById('addrFullName').value.trim(),
    phone:        document.getElementById('addrPhone').value.trim(),
    addressLine1: document.getElementById('addrLine1').value.trim(),
    addressLine2: document.getElementById('addrLine2').value.trim(),
    area:         document.getElementById('addrArea').value.trim(),
    city:         document.getElementById('addrCity').value.trim(),
    state:        document.getElementById('addrState').value,
    pincode:      document.getElementById('addrPincode').value.trim(),
    isDefault:    setDefault
  };

  let list = getAllAddresses();

  if (editId) {
    /* Update existing */
    list = list.map(a => a.id === editId ? { ...a, ...data } : a);
  } else {
    /* New address */
    list.push(data);
  }

  /* If set as default, clear default on all others */
  if (setDefault) {
    list = list.map(a => ({ ...a, isDefault: a.id === data.id }));
  }

  /* First address is always default */
  if (list.length === 1) list[0].isDefault = true;

  saveAllAddresses(list);
  clearForm();
  renderAddressList();

  /* If came from checkout, redirect back */
  if (returnUrl) {
    queueToast('Address saved successfully', 'success');
    window.location.href = returnUrl;
    return;
  }

  showToast('Address saved successfully', 'success');
}

/* ── Edit address ────────────────────────────────────────── */
function editAddress(id) {
  const addr = getAllAddresses().find(a => a.id === id);
  if (!addr) return;

  document.getElementById('addrEditId').value    = addr.id;
  document.getElementById('addrFullName').value  = addr.fullName;
  document.getElementById('addrPhone').value     = addr.phone;
  document.getElementById('addrLine1').value     = addr.addressLine1;
  document.getElementById('addrLine2').value     = addr.addressLine2 || '';
  document.getElementById('addrArea').value      = addr.area || '';
  document.getElementById('addrCity').value      = addr.city;
  document.getElementById('addrState').value     = addr.state;
  document.getElementById('addrPincode').value   = addr.pincode;
  document.getElementById('addrSetDefault').checked = addr.isDefault;

  document.getElementById('addrFormTitle').textContent = 'Edit Address';
  document.getElementById('addrSaveBtn').textContent   = 'Update Address';
  document.getElementById('addrCancelBtn').classList.remove('hidden');

  /* Scroll form into view on mobile */
  document.getElementById('addressFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Delete address ──────────────────────────────────────── */
function deleteAddress(id) {
  if (!pendingDeleteIds.has(id)) {
    const timeoutId = window.setTimeout(() => pendingDeleteIds.delete(id), 4000);
    pendingDeleteIds.set(id, timeoutId);
    showToast('Press delete again within a few seconds to remove this address.', 'warning');
    return;
  }

  window.clearTimeout(pendingDeleteIds.get(id));
  pendingDeleteIds.delete(id);
  let list = getAllAddresses().filter(a => a.id !== id);

  /* Re-assign default if needed */
  if (list.length > 0 && !list.some(a => a.isDefault)) {
    list[0].isDefault = true;
  }
  saveAllAddresses(list);
  renderAddressList();
  showToast('Address deleted successfully', 'success');
}

/* ── Set default ─────────────────────────────────────────── */
function setDefault(id) {
  const list = getAllAddresses().map(a => ({ ...a, isDefault: a.id === id }));
  saveAllAddresses(list);
  renderAddressList();
}

/* ── Event wiring ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('addressForm');
  const showBtn   = document.getElementById('showAddFormBtn');
  const cancelBtn = document.getElementById('addrCancelBtn');

  if (form)      form.addEventListener('submit', saveAddress);
  if (cancelBtn) cancelBtn.addEventListener('click', clearForm);
  if (showBtn)   showBtn.addEventListener('click', () => {
    clearForm();
    document.getElementById('addressFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderAddressList();
});
