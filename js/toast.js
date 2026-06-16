(function () {
  const TOAST_QUEUE_KEY = 'toastQueue';
  const TOAST_DURATION = 3600;
  const TOAST_TYPES = new Set(['success', 'error', 'warning', 'info']);

  let toastRoot = null;

  function getToastRoot() {
    if (toastRoot && document.body.contains(toastRoot)) return toastRoot;

    toastRoot = document.createElement('div');
    toastRoot.className = 'toast-root';
    toastRoot.setAttribute('aria-live', 'polite');
    toastRoot.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(toastRoot);
    return toastRoot;
  }

  function normalizeType(type) {
    return TOAST_TYPES.has(type) ? type : 'info';
  }

  function getEyebrow(type) {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      default: return 'Info';
    }
  }

  function removeToast(toast) {
    if (!toast || toast.dataset.state === 'leaving') return;

    toast.dataset.state = 'leaving';
    toast.classList.remove('is-visible');
    toast.classList.add('is-leaving');

    window.setTimeout(() => {
      toast.remove();
      if (toastRoot && !toastRoot.children.length) {
        toastRoot.remove();
        toastRoot = null;
      }
    }, 260);
  }

  function scheduleRemoval(toast) {
    let timerId = window.setTimeout(() => removeToast(toast), TOAST_DURATION);

    const restartTimer = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => removeToast(toast), TOAST_DURATION);
    };

    toast.addEventListener('mouseenter', () => window.clearTimeout(timerId));
    toast.addEventListener('mouseleave', restartTimer);
    toast.addEventListener('focusin', () => window.clearTimeout(timerId));
    toast.addEventListener('focusout', event => {
      if (!toast.contains(event.relatedTarget)) restartTimer();
    });
  }

  function showToast(message, type = 'info') {
    if (!message) return;

    const resolvedType = normalizeType(type);
    const root = getToastRoot();
    const toast = document.createElement('section');
    toast.className = `toast toast--${resolvedType}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.dataset.state = 'entering';

    const content = document.createElement('div');
    content.className = 'toast__content';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'toast__eyebrow';
    eyebrow.textContent = getEyebrow(resolvedType);

    const messageEl = document.createElement('p');
    messageEl.className = 'toast__message';
    messageEl.textContent = message;

    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'toast__dismiss';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.setAttribute('aria-label', `Dismiss ${resolvedType} notification`);
    dismissBtn.addEventListener('click', () => removeToast(toast));

    toast.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        removeToast(toast);
      }
    });

    content.append(eyebrow, messageEl);
    toast.append(content, dismissBtn);
    root.prepend(toast);

    window.requestAnimationFrame(() => {
      toast.dataset.state = 'visible';
      toast.classList.add('is-visible');
    });

    scheduleRemoval(toast);
  }

  function queueToast(message, type = 'info') {
    if (!message) return;

    const queue = JSON.parse(sessionStorage.getItem(TOAST_QUEUE_KEY) || '[]');
    queue.push({ message, type: normalizeType(type) });
    sessionStorage.setItem(TOAST_QUEUE_KEY, JSON.stringify(queue));
  }

  function flushQueuedToasts() {
    const queue = JSON.parse(sessionStorage.getItem(TOAST_QUEUE_KEY) || '[]');
    if (!queue.length) return;

    sessionStorage.removeItem(TOAST_QUEUE_KEY);
    queue.forEach(item => showToast(item.message, item.type));
  }

  window.showToast = showToast;
  window.queueToast = queueToast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', flushQueuedToasts, { once: true });
  } else {
    flushQueuedToasts();
  }
}());
