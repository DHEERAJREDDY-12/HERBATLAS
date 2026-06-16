const userEmail = localStorage.getItem('userEmail');
const userName = localStorage.getItem('userName') || 'there';
const profileKey = 'userProfiles';

if (localStorage.getItem('loggedIn') !== 'true' || !userEmail) {
  sessionStorage.setItem('authNotice', 'Sign in required to open your account.');
  window.location.href = `login.html?notice=${encodeURIComponent('Sign in required to open your account.')}&return=${encodeURIComponent('account.html')}`;
}

const profileForm = document.getElementById('profileForm');
const saveStatus = document.getElementById('saveStatus');
const accountIntro = document.getElementById('accountIntro');
const summaryGoals = document.getElementById('summaryGoals');
const summaryMeta = document.getElementById('summaryMeta');

accountIntro.textContent = `Hi ${userName}, save your details once and HerbAtlas will tune home-page recommendations to your profile.`;

function getProfiles() {
  return JSON.parse(localStorage.getItem(profileKey) || '{}');
}

function getProfile() {
  return getProfiles()[userEmail] || null;
}

function setCheckedValues(containerId, values) {
  document.querySelectorAll(`#${containerId} input`).forEach(input => {
    input.checked = values.includes(input.value);
  });
}

function getCheckedValues(containerId) {
  return [...document.querySelectorAll(`#${containerId} input:checked`)].map(input => input.value);
}

function triggerGenderCheck() {
  const sexValue = document.getElementById('sex').value;
  const isFemale = sexValue === 'female';
  document.getElementById('pregnantOption').style.display = isFemale ? 'inline' : 'none';
  document.getElementById('breastfeedingOption').style.display = isFemale ? 'inline' : 'none';
}

function loadProfile() {
  const profile = getProfile();
  if (!profile) {
    updateSummary(null);
    triggerGenderCheck();
    return;
  }

  document.getElementById('age').value = profile.age || '';
  document.getElementById('sex').value = profile.sex || 'any';
  document.getElementById('safety').value = profile.safety || 'safe';
  setCheckedValues('goalOptions', profile.goals || []);
  setCheckedValues('avoidOptions', profile.avoid || []);
  saveStatus.textContent = 'Profile saved';
  triggerGenderCheck();
  updateSummary(profile);
}

function updateSummary(profile) {
  if (!profile || !profile.goals || profile.goals.length === 0) {
    summaryGoals.textContent = 'No goals saved yet';
    summaryMeta.textContent = 'Complete the form to unlock home-page recommendations.';
    return;
  }

  summaryGoals.textContent = profile.goals.slice(0, 3).join(', ');
  summaryMeta.textContent = `${profile.safety === 'safe' ? 'Safe-only' : 'All suitable'} recommendations.`;
}

profileForm.addEventListener('submit', event => {
  event.preventDefault();
  const profile = {
    age: parseInt(document.getElementById('age').value, 10) || 0,
    sex: document.getElementById('sex').value,
    safety: document.getElementById('safety').value,
    goals: getCheckedValues('goalOptions'),
    avoid: getCheckedValues('avoidOptions').map(value => value.toLowerCase()),
    savedAt: new Date().toISOString()
  };

  const profiles = getProfiles();
  profiles[userEmail] = profile;
  localStorage.setItem(profileKey, JSON.stringify(profiles));
  saveStatus.textContent = 'Profile saved successfully';
  saveStatus.style.color = 'green';
  saveStatus.style.display = 'block';
  updateSummary(profile);
  showToast('Profile saved successfully', 'success');
  setTimeout(() => {
    saveStatus.textContent = 'Profile saved';
    saveStatus.style.color = '';
    saveStatus.style.display = 'none';
  }, 3000);
});

document.getElementById('sex').addEventListener('change', () => {
  triggerGenderCheck();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('cart');
  if (typeof updateCartBadge === 'function') updateCartBadge();
  queueToast('Account signed out successfully', 'info');
  window.location.href = 'index.html';
});

loadProfile();
