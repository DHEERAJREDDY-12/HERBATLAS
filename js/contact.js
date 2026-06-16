(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const STORAGE_KEY = 'contactMessages';

  /* Pre-fill email if the user is already signed in */
  const savedEmail = localStorage.getItem('userEmail');
  const savedName  = localStorage.getItem('userName');
  const emailField = document.getElementById('contactEmail');
  const nameField  = document.getElementById('contactName');
  if (emailField && savedEmail) {
    emailField.value = savedEmail;
  }
  if (nameField && savedName && !nameField.value) {
    nameField.value = savedName;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const name    = document.getElementById('contactName')?.value.trim()    || '';
    const email   = document.getElementById('contactEmail')?.value.trim()   || '';
    const subject = document.getElementById('contactSubject')?.value.trim() || '';
    const message = document.getElementById('contactMessage')?.value.trim() || '';

    if (!name || !email || !subject || !message) {
      if (window.showToast) {
        window.showToast('Please complete all contact form fields', 'warning');
      }
      return;
    }

    /* Basic email format check */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (window.showToast) {
        window.showToast('Please enter a valid email address', 'warning');
      }
      return;
    }

    const existingMessages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existingMessages.push({
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingMessages));

    form.reset();

    /* Re-fill email after reset so it's still pre-populated for a follow-up */
    if (emailField && savedEmail) emailField.value = savedEmail;
    if (nameField  && savedName)  nameField.value  = savedName;

    if (window.showToast) {
      window.showToast('Your message has been sent. We will get back to you shortly.', 'success');
    }
  });
}());
