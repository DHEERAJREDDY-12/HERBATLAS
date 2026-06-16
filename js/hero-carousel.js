/**
 * hero-carousel.js
 * Rotates the right-column hero card.
 * The left column (.hero-content) is never touched.
 */
(function () {
  'use strict';

  const INTERVAL_MS   = 4000;
  const TRANSITION_MS = 500; // must match CSS transition duration

  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;

  const slides    = Array.from(carousel.querySelectorAll('.hc-slide'));
  const dots      = Array.from(carousel.querySelectorAll('.hc-dot'));
  const prevBtn   = carousel.querySelector('.hc-arrow--prev');
  const nextBtn   = carousel.querySelector('.hc-arrow--next');
  const offerBtn  = carousel.querySelector('[data-hero-offer]');

  if (!slides.length) return;

  const TOTAL       = slides.length;
  let   current     = 0;
  let   timer       = null;
  let   transitioning = false;

  // Respect prefers-reduced-motion — skip fade, show instantly
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Core: go to a specific slide ────────────────────────── */
  function goTo(index, fromInteraction = false) {
    if (transitioning || index === current) return;
    transitioning = true;

    // Deactivate old
    slides[current].classList.remove('hc-slide--active');
    slides[current].setAttribute('aria-hidden', 'true');
    dots[current].classList.remove('hc-dot--active');
    dots[current].setAttribute('aria-selected', 'false');

    current = ((index % TOTAL) + TOTAL) % TOTAL;

    // Activate new
    slides[current].classList.add('hc-slide--active');
    slides[current].setAttribute('aria-hidden', 'false');
    dots[current].classList.add('hc-dot--active');
    dots[current].setAttribute('aria-selected', 'true');

    // Announce to screen readers
    carousel.setAttribute('aria-label', `Featured herbs carousel, slide ${current + 1} of ${TOTAL}`);

    // Allow next transition after CSS completes
    setTimeout(() => { transitioning = false; }, prefersReduced ? 0 : TRANSITION_MS);

    if (fromInteraction) {
      resetTimer();
    }
  }

  /* ── Auto-rotate timer ────────────────────────────────────── */
  function startTimer() {
    if (timer) return;
    timer = setInterval(() => goTo(current + 1), INTERVAL_MS);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function resetTimer() {
    stopTimer();
    startTimer();
  }

  /* ── Arrow buttons ────────────────────────────────────────── */
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopTimer();
      goTo(current - 1, true);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopTimer();
      goTo(current + 1, true);
    });
  }

  if (offerBtn) {
    offerBtn.addEventListener('click', () => {
      localStorage.setItem('showCoupon', 'true');
    });
  }

  /* ── Dot buttons ──────────────────────────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopTimer();
      goTo(i, true);
    });
  });

  /* ── Keyboard navigation ──────────────────────────────────── */
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      stopTimer();
      goTo(current - 1, true);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      stopTimer();
      goTo(current + 1, true);
      e.preventDefault();
    }
  });

  /* ── Pause on hover / focus ───────────────────────────────── */
  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);
  carousel.addEventListener('focusin',    stopTimer);
  carousel.addEventListener('focusout', (e) => {
    // Only restart if focus has left the carousel entirely
    if (!carousel.contains(e.relatedTarget)) {
      startTimer();
    }
  });

  /* ── Touch / swipe support ────────────────────────────────── */
  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    stopTimer();
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      goTo(delta < 0 ? current + 1 : current - 1, true);
    } else {
      startTimer();
    }
  }, { passive: true });

  /* ── Boot ─────────────────────────────────────────────────── */
  // Skip auto-rotate entirely when reduced motion is preferred
  if (!prefersReduced) {
    startTimer();
  }

}());
