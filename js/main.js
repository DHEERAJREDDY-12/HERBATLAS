

const cartBadge = document.getElementById('cartBadge');
const navUser   = document.getElementById('navUser');
const menuBtn   = document.getElementById('menuBtn');
const navLinks  = document.getElementById('navLinks');

function closeAccountMenu() {
  document.querySelectorAll('.nav-user-wrap.open').forEach(wrap => {
    wrap.classList.remove('open');
    const trigger = wrap.querySelector('.nav-user');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function updateCartBadge() {
  const cart  = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartBadge) cartBadge.textContent = total;
}
window.updateCartBadge = updateCartBadge;

function toggleMobileMenu() {
  if (!menuBtn || !navLinks) return;
  
  const isOpen = navLinks.classList.contains('open');
  
  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  navLinks.classList.add('open');
  menuBtn.classList.add('open');
  document.body.classList.add('nav-open');
  
  // Create backdrop if it doesn't exist
  if (!document.querySelector('.nav-backdrop')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
    
    setTimeout(() => backdrop.classList.add('visible'), 10);
    backdrop.addEventListener('click', closeMobileMenu);
  } else {
    document.querySelector('.nav-backdrop').classList.add('visible');
  }
  
  // Update drawer with auth items
  updateMobileDrawerAuth();
}

function closeMobileMenu() {
  navLinks.classList.remove('open');
  menuBtn.classList.remove('open');
  document.body.classList.remove('nav-open');
  
  const backdrop = document.querySelector('.nav-backdrop');
  if (backdrop) {
    backdrop.classList.remove('visible');
  }
}

function updateMobileDrawerAuth() {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  const name     = localStorage.getItem('userName') || '';
  
  // Remove existing auth items
  document.querySelectorAll('.drawer-divider, .drawer-greeting, .drawer-auth-item').forEach(el => el.remove());
  
  // Add divider
  const divider = document.createElement('div');
  divider.className = 'drawer-divider';
  navLinks.appendChild(divider);
  
  if (loggedIn) {
    // Add greeting
    const greeting = document.createElement('div');
    greeting.className = 'drawer-greeting';
    greeting.textContent = name ? `Hi, ${name}` : 'My Account';
    navLinks.appendChild(greeting);
    
    // Add auth links
    const authLinks = [
      { text: 'My Account',           href: 'profile.html'   },
      { text: 'My Orders',            href: 'orders.html'    },
      { text: 'My Addresses',         href: 'addresses.html' },
      { text: 'Personal Herb Profile',href: 'account.html'   },
      { text: 'Contact Us',           href: 'contact.html'   },
      { text: 'Cart',                 href: 'cart.html'      }
    ];
    
    authLinks.forEach(link => {
      const li = document.createElement('li');
      li.className = 'drawer-auth-item';
      li.innerHTML = `<a href="${link.href}">${link.text}</a>`;
      navLinks.appendChild(li);
    });
    
    // Add sign out button
    const signOutLi = document.createElement('li');
    signOutLi.className = 'drawer-auth-item';
    const signOutBtn = document.createElement('button');
    signOutBtn.className = 'drawer-signout-btn';
    signOutBtn.textContent = 'Sign Out';
    signOutBtn.addEventListener('click', logout);
    signOutLi.appendChild(signOutBtn);
    navLinks.appendChild(signOutLi);
    
  } else {
    // Add sign in link
    const signInLi = document.createElement('li');
    signInLi.className = 'drawer-auth-item';
    signInLi.innerHTML = `<a href="login.html" class="drawer-signin-link">Sign In</a>`;
    navLinks.appendChild(signInLi);
  }
}

if (menuBtn) {
  menuBtn.addEventListener('click', toggleMobileMenu);
}

// Close mobile menu when any nav link is clicked — delegated, attached once
if (navLinks) {
  navLinks.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    
    // Let the browser's default navigation fire first,
    // then close the menu on the next tick (relevant for same-page hash links)
    setTimeout(() => closeMobileMenu(), 0);
  });
}

/* ----------------------------------------------------------
   NAV USER — Desktop only
   ---------------------------------------------------------- */
function updateNavUser() {
  if (!navUser) return;

  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  const name     = localStorage.getItem('userName') || '';

  if (loggedIn) {
    navUser.textContent = name ? 'Hi, ' + name : 'Account';
    navUser.href = '#';
    navUser.setAttribute('aria-haspopup', 'true');
    navUser.setAttribute('aria-expanded', 'false');
    navUser.classList.add('nav-user-active');

    /* Desktop dropdown — build once */
    if (!document.querySelector('.account-menu')) {
      const menu = document.createElement('div');
      menu.className = 'account-menu';
      menu.innerHTML = `
        <a href="profile.html">My Account</a>
        <a href="orders.html">My Orders</a>
        <a href="addresses.html">My Addresses</a>
        <a href="account.html">Personal Herb Profile</a>
        <a href="contact.html">Contact Us</a>
        <button type="button" class="account-logout-btn">Sign Out</button>
      `;
      
      /* Wrap navUser in a container for proper dropdown positioning */
      const wrap = document.createElement('div');
      wrap.className = 'nav-user-wrap';
      navUser.parentNode.insertBefore(wrap, navUser);
      wrap.appendChild(navUser);
      wrap.appendChild(menu);
      
      menu.querySelector('.account-logout-btn').addEventListener('click', logout);
    }

    navUser.onclick = (e) => {
      e.preventDefault();
      const wrap = navUser.closest('.nav-user-wrap');
      if (!wrap) return;

      const isOpen = wrap.classList.contains('open');
      closeAccountMenu();

      if (!isOpen) {
        wrap.classList.add('open');
        navUser.setAttribute('aria-expanded', 'true');
      }
    };
  } else {
    navUser.textContent = 'Sign In';
    navUser.href = 'login.html';
    navUser.className = 'nav-user';
    navUser.removeAttribute('aria-haspopup');
    navUser.removeAttribute('aria-expanded');
    navUser.onclick = null;
    
    /* Remove wrap if exists */
    const wrap = navUser.closest('.nav-user-wrap');
    if (wrap) {
      wrap.replaceWith(navUser);
    }
    document.querySelectorAll('.account-menu').forEach(el => el.remove());
  }
}

function logout() {
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('cart');
  updateCartBadge();
  closeMobileMenu();
  queueToast('Account signed out successfully', 'info');
  window.location.href = 'index.html';
}
window.logout = logout;

function updateFooterAccountLinks() {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  document.querySelectorAll('.footer-auth-guest').forEach(link => {
    link.hidden = loggedIn;
  });
  document.querySelectorAll('.footer-auth-user, .footer-logout-btn').forEach(link => {
    link.hidden = !loggedIn;
  });
}

/* ----------------------------------------------------------
   SEARCH with suggestions
   ---------------------------------------------------------- */
const navSearch = document.querySelector('.nav-search');
const mobileSearch = document.getElementById('mobileSearchInput');
const searchInputs = [navSearch, mobileSearch].filter(Boolean);

if (searchInputs.length) {
  const sugEl = document.createElement('div');
  let activeSearchInput = null;
  sugEl.className = 'herb-suggestions';
  document.body.appendChild(sugEl);

  function hideSuggestions() {
    sugEl.classList.remove('visible');
    activeSearchInput = null;
  }

  function updateSugPos() {
    if (!activeSearchInput) return;
    const r = activeSearchInput.getBoundingClientRect();
    const sideMargin = window.innerWidth <= 768 ? 16 : 0;
    const width = window.innerWidth <= 768
      ? Math.min(window.innerWidth - (sideMargin * 2), r.width)
      : Math.max(r.width, 220);

    sugEl.style.top = (r.bottom + 6) + 'px';
    sugEl.style.left = (window.innerWidth <= 768 ? sideMargin : r.left) + 'px';
    sugEl.style.width = width + 'px';
  }

  function debounce(fn, wait = 150) {
    let timeoutId;
    return (...args) => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), wait);
    };
  }

  function renderSuggestions(input) {
    const q = input.value.trim().toLowerCase();
    const herbs = window.HERBS_DATA || [];
    activeSearchInput = input;

    if (!q || !herbs.length) {
      hideSuggestions();
      return;
    }

    const matches = herbs.filter(h =>
      h.name.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!matches.length) {
      hideSuggestions();
      return;
    }

    updateSugPos();
    sugEl.innerHTML = matches.map(h => `
      <button type="button" class="herb-sug-item" data-herb-id="${h.id}">
        <img src="${h.image}" alt="${h.name}" loading="lazy" onerror="this.style.display='none'">
        <div>
          <span class="sug-name">${h.name}</span>
        </div>
      </button>
    `).join('');
    sugEl.classList.add('visible');
  }

  const debouncedRenderSuggestions = debounce(renderSuggestions, 120);

  function submitSearch(input) {
    const value = input.value.trim();
    if (!value) return;
    hideSuggestions();
    window.location.href = `browse.html?search=${encodeURIComponent(value)}`;
  }

  searchInputs.forEach(input => {
    input.addEventListener('input', () => debouncedRenderSuggestions(input));
    input.addEventListener('focus', () => {
      if (input.value.trim()) renderSuggestions(input);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitSearch(input);
      }
      if (e.key === 'Escape') hideSuggestions();
    });
  });

  sugEl.addEventListener('click', e => {
    const item = e.target.closest('.herb-sug-item');
    if (!item) return;
    const herbId = item.dataset.herbId;
    hideSuggestions();
    window.location.href = `herb-detail.html?id=${herbId}`;
  });

  window.addEventListener('resize', updateSugPos);
  window.addEventListener('scroll', () => {
    if (sugEl.classList.contains('visible')) updateSugPos();
  }, true);

  document.addEventListener('click', e => {
    const clickedSearch = searchInputs.some(input => input.contains(e.target));
    if (!clickedSearch && !sugEl.contains(e.target)) {
      hideSuggestions();
    }
  });
}

document.addEventListener('click', e => {
  if (!e.target.closest('.nav-user-wrap')) {
    closeAccountMenu();
  }
});

/* ----------------------------------------------------------
   CATALOG FILTER STICKY FALLBACK (Browse / Shop)
   ---------------------------------------------------------- */
function bindCatalogStickyFallback() {
  const catalog = document.querySelector('.catalog-results');
  if (!catalog) return;

  const bars = [
    catalog.querySelector('.filter-bar'),
    catalog.querySelector('.filter-drawer-bar')
  ].filter(Boolean);

  if (!bars.length) return;

  const spacers = new Map();
  let ticking = false;

  function ensureSpacer(bar) {
    if (spacers.has(bar)) return spacers.get(bar);
    const spacer = document.createElement('div');
    spacer.className = 'filter-sticky-spacer';
    bar.insertAdjacentElement('afterend', spacer);
    spacers.set(bar, spacer);
    return spacer;
  }

  function isVisible(bar) {
    return window.getComputedStyle(bar).display !== 'none';
  }

  function getStickyTop() {
    const nav = document.querySelector('.navbar');
    const mobileSearch = document.querySelector('.mobile-search-bar');
    const mobileVisible = mobileSearch && window.getComputedStyle(mobileSearch).display !== 'none';
    if (mobileVisible) {
      return Math.round(mobileSearch.getBoundingClientRect().bottom);
    }
    return nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
  }

  function resetBar(bar) {
    const spacer = ensureSpacer(bar);
    spacer.classList.remove('active');
    spacer.style.height = '0px';
    bar.classList.remove('is-fixed', 'is-bottom');
    bar.style.top = '';
    bar.style.left = '';
    bar.style.right = '';
    bar.style.bottom = '';
    bar.style.width = '';
  }

  function updateStickyBar() {
    ticking = false;

    bars.forEach(resetBar);

    const activeBar = bars.find(isVisible);
    if (!activeBar) return;

    const spacer = ensureSpacer(activeBar);
    const stickyTop = getStickyTop();
    const catalogRect = catalog.getBoundingClientRect();
    const barRect = activeBar.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset;
    const barDocTop = scrollTop + barRect.top;
    const catalogDocTop = scrollTop + catalogRect.top;
    const barHeight = activeBar.offsetHeight;
    const maxFixedScroll = catalogDocTop + catalog.offsetHeight - barHeight - stickyTop;

    if (scrollTop + stickyTop <= barDocTop) {
      return;
    }

    spacer.classList.add('active');
    spacer.style.height = `${barHeight}px`;

    if (scrollTop < maxFixedScroll) {
      activeBar.classList.add('is-fixed');
      activeBar.style.top = `${stickyTop}px`;
      activeBar.style.left = `${Math.round(catalogRect.left)}px`;
      activeBar.style.width = `${Math.round(catalogRect.width)}px`;
      return;
    }

    activeBar.classList.add('is-bottom');
    activeBar.style.bottom = '0px';
    activeBar.style.width = '100%';
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateStickyBar);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', requestUpdate);
  requestUpdate();
}

function updateNavUser() {
  if (!navUser) return;

  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  const name = localStorage.getItem('userName') || '';

  if (loggedIn) {
    navUser.innerHTML = `
      <span class="nav-user-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Zm0 2c-3.27 0-5.93 1.78-6.81 4.55a1 1 0 0 0 .96 1.3h11.7a1 1 0 0 0 .96-1.3C17.93 15.78 15.27 14 12 14Z"></path>
        </svg>
      </span>
      <span class="nav-user-label">${name || 'Account'}</span>
    `;
    navUser.href = 'profile.html';
    navUser.className = 'nav-user nav-user-active';
    navUser.removeAttribute('aria-haspopup');
    navUser.removeAttribute('aria-expanded');
    navUser.onclick = null;

    const wrap = navUser.closest('.nav-user-wrap');
    if (wrap) {
      wrap.replaceWith(navUser);
    }
    document.querySelectorAll('.account-menu').forEach(el => el.remove());
    return;
  }

  navUser.textContent = 'Sign In';
  navUser.href = 'login.html';
  navUser.className = 'nav-user';
  navUser.removeAttribute('aria-haspopup');
  navUser.removeAttribute('aria-expanded');
  navUser.onclick = null;

  const wrap = navUser.closest('.nav-user-wrap');
  if (wrap) {
    wrap.replaceWith(navUser);
  }
  document.querySelectorAll('.account-menu').forEach(el => el.remove());
}

function updateFooterAccountLinks() {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';

  document.querySelectorAll('.footer-auth-guest').forEach(link => {
    link.hidden = loggedIn;
  });

  document.querySelectorAll('.footer-auth-user').forEach(link => {
    link.hidden = !loggedIn;
  });

  document.querySelectorAll('.footer-logout-btn').forEach(link => {
    link.hidden = !loggedIn;
  });
}

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
updateCartBadge();
updateNavUser();
updateFooterAccountLinks();
bindCatalogStickyFallback();

document.querySelectorAll('.footer-logout-btn').forEach(btn => {
  btn.addEventListener('click', logout);
});
