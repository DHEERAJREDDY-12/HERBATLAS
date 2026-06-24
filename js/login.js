const SVG_EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const SVG_EYE_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

let currentTab = 'signin';

function getRequestedTab() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') === 'register' ? 'register' : 'signin';
}

function switchTab(tab) {
  if (tab === currentTab) return;

  const signinForm = document.getElementById('signinForm');
  const registerForm = document.getElementById('registerForm');
  const signinTab = document.getElementById('signinTab');
  const registerTab = document.getElementById('registerTab');
  const indicator = document.getElementById('tabIndicator');

  const outClass = tab === 'register' ? 'form-slide-out-left' : 'form-slide-out-right';
  const inClass = tab === 'register' ? 'form-slide-in-right' : 'form-slide-in-left';
  const outEl = tab === 'register' ? signinForm : registerForm;
  const inEl = tab === 'register' ? registerForm : signinForm;

  outEl.classList.add(outClass);

  setTimeout(() => {
    outEl.classList.add('hidden');
    outEl.classList.remove(outClass);
    inEl.classList.remove('hidden');
    inEl.classList.add(inClass);
    setTimeout(() => inEl.classList.remove(inClass), 360);
  }, 260);

  // Slide tab indicator
  if (tab === 'register') {
    indicator.classList.add('right');
    signinTab.classList.remove('active');
    registerTab.classList.add('active');
  } else {
    indicator.classList.remove('right');
    signinTab.classList.add('active');
    registerTab.classList.remove('active');
  }

  currentTab = tab;
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.innerHTML = showing ? SVG_EYE : SVG_EYE_OFF;
  btn.style.color = showing ? '' : 'var(--green-mid)';
}

function getPasswordRules(val) {
  return {
    length: val.length >= 6,
    upper: /[A-Z]/.test(val),
    lower: /[a-z]/.test(val),
    number: /[0-9]/.test(val),
    symbol: /[^A-Za-z0-9]/.test(val)
  };
}

function isPasswordValid(val) {
  return Object.values(getPasswordRules(val)).every(Boolean);
}

function showPasswordRequirements() {
  const panel = document.getElementById('passwordRequirements');
  if (panel) panel.classList.add('open');
}

function hidePasswordRequirementsIfEmpty() {
  const input = document.getElementById('regPassword');
  const panel = document.getElementById('passwordRequirements');
  if (input && panel && !input.value) panel.classList.remove('open');
}

function updatePasswordRules(val) {
  const rules = getPasswordRules(val);
  Object.entries(rules).forEach(([rule, isMet]) => {
    const item = document.querySelector(`[data-password-rule="${rule}"]`);
    if (item) item.classList.toggle('met', isMet);
  });
}

function updatePasswordFeedback(val) {
  showPasswordRequirements();
  updatePasswordRules(val);
  checkStrength(val);
}

function checkStrength(val) {
  const fill = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill) return;

  if (!val) {
    fill.style.width = '0';
    label.textContent = '';
    return;
  }

  let score = 0;
  if (val.length >= 6) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: '20%', color: '#e57373', text: 'Very weak' },
    { pct: '40%', color: '#ffb74d', text: 'Weak' },
    { pct: '60%', color: '#ffd54f', text: 'Fair' },
    { pct: '80%', color: '#81c784', text: 'Strong' },
    { pct: '100%', color: '#388e3c', text: 'Very strong' },
  ];

  const lvl = levels[Math.min(score - 1, 4)];
  fill.style.width = lvl.pct;
  fill.style.backgroundColor = lvl.color;
  label.textContent = lvl.text;
}

function isValidEmail(email) {
  /* Accept any properly formatted email address */
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function signIn() {
  const email = document.getElementById('signinEmail').value.trim();
  const password = document.getElementById('signinPassword').value;
  const error = document.getElementById('signinError');

  if (!email || !password) { showError(error, 'Please fill in all fields.'); return; }

  if (!isValidEmail(email)) {
    showError(error, 'Please enter a valid email.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const emailMatch = users.find(u => u.email === email);
  const fullMatch = users.find(u => u.email === email && u.password === password);

  if (!emailMatch) {
    showError(error, 'No account found with that email. Redirecting to sign up…');
    setTimeout(() => {
      const regEmail = document.getElementById('regEmail');
      if (regEmail) regEmail.value = email;
      switchTab('register');
      error.classList.add('hidden');
    }, 1400);
    return;
  }

  if (!fullMatch) { showError(error, 'Incorrect password. Please try again.'); return; }

  localStorage.setItem('loggedIn', 'true');
  localStorage.setItem('userName', fullMatch.firstName);
  localStorage.setItem('userEmail', fullMatch.email);
  queueToast('Account signed in successfully', 'success');
  window.location.href = getReturnUrl();
}

function register() {
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName = document.getElementById('regLastName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const error = document.getElementById('registerError');

  if (!firstName || !lastName || !email || !password || !confirm) {
    showError(error, 'Please fill in all fields.'); return;
  }
  if (!isValidEmail(email)) {
    showError(error, 'Please enter a valid email.');
    return;
  }
  if (!isPasswordValid(password)) {
    showPasswordRequirements();
    updatePasswordRules(password);
    showError(error, 'Password must include at least 6 characters, one uppercase letter, one lowercase letter, one number and one symbol.'); return;
  }
  if (password !== confirm) {
    showError(error, 'Passwords do not match.'); return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.find(u => u.email === email)) {
    showError(error, 'An account with this email already exists. Redirecting to sign in…');
    setTimeout(() => {
      document.getElementById('signinEmail').value = email;
      switchTab('signin');
      error.classList.add('hidden');
    }, 1400);
    return;
  }

  users.push({ firstName, lastName, email, password });
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('loggedIn', 'true');
  localStorage.setItem('userName', firstName);
  localStorage.setItem('userEmail', email);
  queueToast('Account created successfully. Welcome to HerbAtlas!', 'success');
  window.location.href = getReturnUrl();
}

function showError(el, msg, notify = true) {
  el.textContent = msg;
  el.classList.remove('hidden');
  if (notify) {
    showToast(msg, 'error');
  }
}

// Dynamic herb count in the visual panel
(function () {
  const herbs = window.HERBS_DATA || [];
  const el = document.getElementById('loginHerbCount');
  if (el && herbs.length) el.textContent = herbs.length + '+';
})();

// Redirect if already logged in
if (localStorage.getItem('loggedIn') === 'true') {
  window.location.href = getReturnUrl();
} else {
  if (getRequestedTab() === 'register') {
    switchTab('register');
  }
  const notice = sessionStorage.getItem('authNotice') || new URLSearchParams(window.location.search).get('notice');
  if (notice) {
    const message = notice === 'cart'
      ? 'Sign in required to add items to your cart.'
      : notice;
    showToast(message, notice === 'cart' ? 'warning' : 'info');
    showError(document.getElementById('signinError'), message, false);
    sessionStorage.removeItem('authNotice');
  }
}

function getReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get('return') || 'index.html';
  const safeTarget = target.includes('://') ? 'index.html' : target;
  return params.get('notice') === 'cart' && safeTarget === 'shop.html'
    ? 'shop.html?cartReady=1'
    : safeTarget;
}
