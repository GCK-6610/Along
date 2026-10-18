// ==========================================================================
// Along | Executive Investor & Partner Deck Controller (10 Slides)
// Clean presentation mode, keyboard navigation, and interactive mockup switcher
// ==========================================================================

const TOTAL_SLIDES = 10;
let currentSlide = 0;

// DOM Elements
const slides = document.querySelectorAll('.deck-slide');
const slideBadgeDisplay = document.getElementById('slideBadgeDisplay');
const progressBar = document.getElementById('progressBar');
const slideDotsRow = document.getElementById('slideDotsRow');
const prevSlideBtn = document.getElementById('prevSlideBtn');
const nextSlideBtn = document.getElementById('nextSlideBtn');
const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');

// 1. Dots Setup
function initDots() {
  if (!slideDotsRow) return;
  slideDotsRow.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = `dot-indicator ${idx === currentSlide ? 'active' : ''}`;
    dot.title = `Slide ${idx + 1}`;
    dot.addEventListener('click', () => goToSlide(idx));
    slideDotsRow.appendChild(dot);
  });
}

// 2. Slide Navigation
function goToSlide(index) {
  if (index < 0 || index >= TOTAL_SLIDES) return;

  slides[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');

  const slideTitle = slides[currentSlide].getAttribute('data-title') || `Slide ${currentSlide + 1}`;
  const curNum = String(currentSlide + 1).padStart(2, '0');
  const totNum = String(TOTAL_SLIDES).padStart(2, '0');

  if (slideBadgeDisplay) {
    slideBadgeDisplay.textContent = `${curNum} / ${totNum} | ${slideTitle}`;
  }

  if (progressBar) {
    progressBar.style.width = `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%`;
  }

  const dots = document.querySelectorAll('.dot-indicator');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlide);
  });

  slides[currentSlide].scrollTop = 0;
}

function nextSlide() {
  if (currentSlide < TOTAL_SLIDES - 1) {
    goToSlide(currentSlide + 1);
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    goToSlide(currentSlide - 1);
  }
}

// 3. Fullscreen Toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// 4. Mobile Mockup Feature Switcher (Slide 4)
function initMobileMockup() {
  const featureItems = document.querySelectorAll('.feature-card-item');
  const screenViews = document.querySelectorAll('.phone-screen-view');

  featureItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-mock-screen');

      featureItems.forEach(f => f.classList.remove('active'));
      item.classList.add('active');

      screenViews.forEach(v => {
        if (v.id === `mock-${target}`) {
          v.classList.add('active');
        } else {
          v.classList.remove('active');
        }
      });
    });
  });
}

// 5. Keyboard Navigation
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
    e.preventDefault();
    nextSlide();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    prevSlide();
  } else if (e.key.toLowerCase() === 'f') {
    toggleFullscreen();
  } else if (e.key === 'Home') {
    goToSlide(0);
  } else if (e.key === 'End') {
    goToSlide(TOTAL_SLIDES - 1);
  }
});

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initDots();
  initMobileMockup();

  prevSlideBtn?.addEventListener('click', prevSlide);
  nextSlideBtn?.addEventListener('click', nextSlide);
  fullscreenToggleBtn?.addEventListener('click', toggleFullscreen);
});
