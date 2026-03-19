// ===============================================================
// CIVIC LENS — Landing Page (Government Style)
// Clean, simple interactions — vanilla JS, no GSAP
// ===============================================================

// --- Set current date in top bar ---
const dateEl = document.getElementById('current-date');
if (dateEl) {
  const now = new Date();
  dateEl.textContent = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// --- Font size controls ---
const fontBtns = {
  decrease: document.getElementById('font-decrease'),
  default: document.getElementById('font-default'),
  increase: document.getElementById('font-increase'),
};

let currentFontSize = 100;
const FONT_STEP = 10;
const FONT_MIN = 80;
const FONT_MAX = 130;

if (fontBtns.decrease) {
  fontBtns.decrease.addEventListener('click', () => {
    currentFontSize = Math.max(FONT_MIN, currentFontSize - FONT_STEP);
    document.documentElement.style.fontSize = currentFontSize + '%';
  });
}
if (fontBtns.default) {
  fontBtns.default.addEventListener('click', () => {
    currentFontSize = 100;
    document.documentElement.style.fontSize = '100%';
  });
}
if (fontBtns.increase) {
  fontBtns.increase.addEventListener('click', () => {
    currentFontSize = Math.min(FONT_MAX, currentFontSize + FONT_STEP);
    document.documentElement.style.fontSize = currentFontSize + '%';
  });
}

// --- Mobile menu toggle ---
const menuToggle = document.getElementById('mobile-menu-toggle');
const navMenu = document.getElementById('navbar-nav');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
  });

  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('open');
    });
  });
}

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// --- Active nav link highlighting on scroll ---
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveNav() {
  const scrollPos = window.scrollY + 120;
  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + id) {
          link.classList.add('active');
        }
      });
    }
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });

// --- Scroll Reveal (IntersectionObserver) ---
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// --- Counter Animation ---
function animateCounter(el, target, duration = 2000) {
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(target * eased);
    el.textContent = current.toLocaleString('en-IN');
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString('en-IN');
    }
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('.counter');
        counters.forEach((counter) => {
          const target = parseInt(counter.dataset.target, 10);
          animateCounter(counter, target);
        });
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

const statsSection = document.querySelector('.statistics-section');
if (statsSection) counterObserver.observe(statsSection);

// --- Navbar shadow on scroll ---
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
    } else {
      navbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    }
  }, { passive: true });
}

// ===============================================================
// SNAPSHOTS CAROUSEL
// Horizontal scrollable carousel with arrow nav + dot indicators
// ===============================================================
(function initCarousel() {
  const track = document.getElementById('snap-track');
  const viewport = document.getElementById('snap-viewport');
  const prevBtn = document.getElementById('snap-prev');
  const nextBtn = document.getElementById('snap-next');
  const dotsContainer = document.getElementById('snap-dots');

  if (!track || !viewport || !prevBtn || !nextBtn || !dotsContainer) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const slideCount = slides.length;
  let currentIndex = 0;
  let slideWidth = 0;
  let gap = 20;
  let visibleSlides = 1;

  function calcDimensions() {
    if (slides.length === 0) return;
    slideWidth = slides[0].offsetWidth;
    gap = parseFloat(getComputedStyle(track).gap) || 20;
    const vpWidth = viewport.offsetWidth;
    visibleSlides = Math.floor(vpWidth / (slideWidth + gap));
    if (visibleSlides < 1) visibleSlides = 1;
  }

  function maxIndex() {
    return Math.max(0, slideCount - visibleSlides);
  }

  function updatePosition() {
    const offset = currentIndex * (slideWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
  }

  function updateButtons() {
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= maxIndex();
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    const dotCount = maxIndex() + 1;
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex()));
    updatePosition();
    updateButtons();
    updateDots();
  }

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  // Drag/swipe support
  let isDragging = false;
  let startX = 0;
  let startTranslate = 0;

  function getTranslateX() {
    const style = getComputedStyle(track);
    const matrix = new DOMMatrix(style.transform);
    return matrix.m41;
  }

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startTranslate = getTranslateX();
    track.style.transition = 'none';
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    track.style.transform = `translateX(${startTranslate + dx}px)`;
  });

  viewport.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = '';
    const dx = e.clientX - startX;
    const threshold = slideWidth * 0.25;

    if (Math.abs(dx) > threshold) {
      if (dx < 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }
    } else {
      goTo(currentIndex);
    }
  });

  // Initialize
  function init() {
    calcDimensions();
    buildDots();
    updateButtons();
    updatePosition();
  }

  init();
  window.addEventListener('resize', () => {
    calcDimensions();
    buildDots();
    goTo(Math.min(currentIndex, maxIndex()));
  });
})();
