// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Landing Page with Parallax Hero
// Aceternity-style 3D parallax card rows using GSAP
// ═══════════════════════════════════════════════════════════

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Parallax showcase data ───
// Civic infrastructure + governance themed images (Unsplash)
const showcaseItems = [
  // Row 1 (5 items) — Indian civic issues & cities
  {
    title: 'Pothole on Indian Road',
    badge: 'issue',
    thumbnail: `${import.meta.env.BASE_URL}2017_5$largeimg15_Monday_2017_015927112.jpg`,
  },
  {
    title: 'Mumbai Cityscape',
    badge: 'feature',
    thumbnail: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=600&fit=crop',
  },
  {
    title: 'Broken Indian Streetlight',
    badge: 'issue',
    thumbnail: 'https://images.unsplash.com/photo-1760782063883-83af1fc0fc83?q=80&w=991&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Smart City Dashboard',
    badge: 'feature',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
  },
  {
    title: 'Indian Road Construction',
    badge: 'progress',
    thumbnail: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=800&h=600&fit=crop',
  },
  // Row 2 (5 items) — Indian governance & infrastructure
  {
    title: 'Civic Sense in India',
    badge: 'resolved',
    thumbnail: `${import.meta.env.BASE_URL}civic-sense-in-india.jpg`,
  },
  {
    title: 'Water Pipeline Repair',
    badge: 'progress',
    thumbnail: 'https://images.unsplash.com/photo-1693907986952-3cd372e4c9d8?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Delhi Urban Planning',
    badge: 'feature',
    thumbnail: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
  },
  {
    title: 'Indian Street Flooding',
    badge: 'issue',
    thumbnail: 'https://images.unsplash.com/photo-1561631918-0e0d6af260af?w=800&h=600&fit=crop',
  },
  {
    title: 'Community Governance',
    badge: 'resolved',
    thumbnail: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=600&fit=crop',
  },
  // Row 3 (5 items) — Indian cities & resolution
  {
    title: 'Indian Park Renovation',
    badge: 'resolved',
    thumbnail: 'https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800&h=600&fit=crop',
  },
  {
    title: 'Indian City Traffic',
    badge: 'feature',
    thumbnail: 'https://images.unsplash.com/photo-1711358876889-ed28e5594e2f?q=80&w=1973&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Indian Sidewalk Issues',
    badge: 'issue',
    thumbnail: 'https://images.unsplash.com/photo-1695834195972-9fd5877b8ad0?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Jaipur Smart City',
    badge: 'resolved',
    thumbnail: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&h=600&fit=crop',
  },
  {
    title: 'Indian City Analytics',
    badge: 'feature',
    thumbnail: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=600&fit=crop',
  },
];

const badgeLabels = {
  issue: '⚠ Issue',
  resolved: '✓ Resolved',
  progress: '↻ In Progress',
  feature: '★ Feature',
};

// ─── Build parallax card HTML ───
function createCard(item) {
  const card = document.createElement('div');
  card.className = 'parallax-card';
  card.innerHTML = `
    <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
    <div class="card-overlay"></div>
    <span class="card-badge ${item.badge}">${badgeLabels[item.badge]}</span>
    <div class="card-title">${item.title}</div>
  `;
  return card;
}

// ─── Inject cards into rows ───
function populateRows() {
  const row1 = document.getElementById('parallax-row-1');
  const row2 = document.getElementById('parallax-row-2');
  const row3 = document.getElementById('parallax-row-3');

  showcaseItems.slice(0, 5).forEach(item => row1.appendChild(createCard(item)));
  showcaseItems.slice(5, 10).forEach(item => row2.appendChild(createCard(item)));
  showcaseItems.slice(10, 15).forEach(item => row3.appendChild(createCard(item)));
}

populateRows();

// ─── Navbar scroll morph ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ─── GSAP Hero Text Entrance ───
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

heroTl
  .from('#hero-title', { y: 60, opacity: 0, duration: 1, delay: 0.3 })
  .from('#hero-sub', { y: 40, opacity: 0, duration: 0.8 }, '-=0.5')
  .from('#hero-btns', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4');

// ─── GSAP Parallax Scroll Animation ───
// This recreates the Aceternity parallax effect:
// - Cards start with 3D rotation (rotateX + rotateZ)
// - On scroll, rotation goes to 0
// - Rows translate horizontally in alternating directions
// - Opacity fades in

const parallaxSection = document.getElementById('hero-parallax');
const parallaxCards = document.getElementById('parallax-cards');

// 3D perspective + rotation animation
gsap.fromTo(parallaxCards,
  {
    rotateX: 15,
    rotateZ: 10,
    translateY: -200,
    opacity: 0.3,
  },
  {
    rotateX: 0,
    rotateZ: 0,
    translateY: 200,
    opacity: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: parallaxSection,
      start: 'top top',
      end: '40% top',
      scrub: 1,
    },
  }
);

// Row 1: translate right on scroll
gsap.fromTo('#parallax-row-1',
  { x: 0 },
  {
    x: 400,
    ease: 'none',
    scrollTrigger: {
      trigger: parallaxSection,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  }
);

// Row 2: translate left on scroll
gsap.fromTo('#parallax-row-2',
  { x: 0 },
  {
    x: -400,
    ease: 'none',
    scrollTrigger: {
      trigger: parallaxSection,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  }
);

// Row 3: translate right on scroll
gsap.fromTo('#parallax-row-3',
  { x: 0 },
  {
    x: 400,
    ease: 'none',
    scrollTrigger: {
      trigger: parallaxSection,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  }
);

// ─── Scroll Reveal (IntersectionObserver) ───
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

// ─── Counter Animation ───
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('.counter');
        counters.forEach((counter) => {
          const target = parseInt(counter.dataset.target, 10);
          gsap.to(counter, {
            innerText: target,
            duration: 2,
            snap: { innerText: 1 },
            ease: 'power2.out',
          });
        });
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

const statsSection = document.querySelector('.stats-strip');
if (statsSection) counterObserver.observe(statsSection);

// ─── GSAP ScrollTrigger for sticky section content ───
gsap.utils.toArray('.sticky-body-layout').forEach((layout) => {
  gsap.from(layout, {
    scrollTrigger: {
      trigger: layout,
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
    y: 50,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
  });
});

// ─── Glowing Effect: Mouse-tracking border glow ───
// Adapted from Aceternity GlowingEffect component
(function initGlowingEffect() {
  const PROXIMITY = 64;
  const INACTIVE_ZONE = 0.01;
  const glowBorders = document.querySelectorAll('.glow-border');

  function handlePointerMove(e) {
    glowBorders.forEach((el) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const centerX = left + width * 0.5;
      const centerY = top + height * 0.5;

      // Check proximity
      const isActive =
        mouseX > left - PROXIMITY &&
        mouseX < left + width + PROXIMITY &&
        mouseY > top - PROXIMITY &&
        mouseY < top + height + PROXIMITY;

      // Check inactive zone (very center)
      const distFromCenter = Math.hypot(mouseX - centerX, mouseY - centerY);
      const inactiveRadius = 0.5 * Math.min(width, height) * INACTIVE_ZONE;

      if (distFromCenter < inactiveRadius) {
        el.style.setProperty('--active', '0');
        return;
      }

      el.style.setProperty('--active', isActive ? '1' : '0');

      if (!isActive) return;

      // Calculate angle from center to cursor
      const angle =
        (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) / Math.PI + 90;

      el.style.setProperty('--start', String(angle));
    });
  }

  document.body.addEventListener('pointermove', handlePointerMove, { passive: true });

  // Also update on scroll (recalcs positions)
  window.addEventListener('scroll', () => {
    const lastEvent = { clientX: 0, clientY: 0 };
    handlePointerMove(lastEvent);
  }, { passive: true });
})();

// ─── SCROLL-ANIMATED EXPANDING IMAGE (adapted from HeroScrollVideo) ───
(function initScrollExpand() {
  const headline = document.getElementById('hsv-headline');
  const scrollTriggerEl = document.getElementById('hsv-scroll-trigger');
  const mediaBox = document.getElementById('hsv-media-box');
  const darken = document.getElementById('hsv-darken');
  const overlay = document.getElementById('hsv-overlay');
  const caption = document.getElementById('hsv-caption');
  const content = document.getElementById('hsv-overlay-content');

  if (!scrollTriggerEl || !mediaBox) return;

  // Headline roll-away on scroll
  if (headline) {
    const headlineChildren = headline.querySelectorAll('.hsv-headline > *');
    const heroExitTl = gsap.timeline({
      scrollTrigger: {
        trigger: headline,
        start: 'top top',
        end: 'top+=400 top',
        scrub: 1,
      },
    });

    headlineChildren.forEach((el, i) => {
      heroExitTl.to(
        el,
        {
          rotationX: 80,
          y: -36,
          scale: 0.86,
          opacity: 0,
          filter: 'blur(4px)',
          transformOrigin: 'center top',
          ease: 'power3.inOut',
        },
        i * 0.08
      );
    });
  }

  // Main expansion timeline
  const mainTl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollTriggerEl,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.1,
    },
  });

  // Set initial state
  gsap.set(mediaBox, {
    width: 340,
    height: 340,
    borderRadius: 20,
  });
  gsap.set(overlay, { clipPath: 'inset(100% 0 0 0)' });
  gsap.set(content, { filter: 'blur(10px)', scale: 1.05, y: 30 });
  gsap.set(caption, { y: 30 });

  // Animate: expand box → darken → reveal overlay → slide content
  mainTl
    .to(mediaBox, {
      width: '92vw',
      height: '92vh',
      borderRadius: 0,
      ease: 'expo.out',
    }, 0)
    .to(darken, {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      ease: 'power2.out',
    }, 0)
    .to(overlay, {
      clipPath: 'inset(0% 0 0 0)',
      backdropFilter: 'blur(10px)',
      ease: 'expo.out',
    }, 0.35)
    .to(caption, {
      y: 0,
      ease: 'expo.out',
    }, 0.4)
    .to(content, {
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      ease: 'expo.out',
    }, 0.4);
})();
