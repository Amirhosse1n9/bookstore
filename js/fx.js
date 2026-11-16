/* =========================================================
   fx.js — جلوه‌های حرکتی: ظاهر شدن با اسکرول، نوار پیشرفت،
   هدر هوشمند، حرکت پارالاکس هیرو، دکمه‌ی بازگشت به بالا
   ========================================================= */
(function () {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ظاهر شدن با اسکرول ---------- */
  const SELECTOR = [
    '.section-head', '.page-title', '.cat-tile', '.card', '.crumbs',
    '.book-cover', '.book-info', '.related', '.result-count', '.toolbar',
  ].join(',');

  let io;
  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver((entries) => {
      let n = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        const delay = Math.min(n++, 7) * 70;
        el.style.transitionDelay = delay + 'ms';
        requestAnimationFrame(() => el.classList.add('in'));
        setTimeout(() => { el.removeAttribute('data-reveal'); el.classList.remove('in'); el.style.transitionDelay = ''; }, 1000 + delay);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  }
  function scan(root) {
    if (!io) return;
    (root || document).querySelectorAll(SELECTOR).forEach((el) => {
      if (el.dataset.fx) return;
      el.dataset.fx = '1';
      el.setAttribute('data-reveal', '');
      io.observe(el);
    });
  }

  /* ---------- نوار پیشرفت + هدر + بازگشت به بالا ---------- */
  function initScroll() {
    const bar = document.createElement('div'); bar.className = 'scroll-progress';
    const top = document.createElement('button'); top.className = 'to-top'; top.setAttribute('aria-label', 'بازگشت به بالا');
    top.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.append(bar, top);
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
    const header = document.querySelector('.site-header');
    let ticking = false;
    const update = () => {
      const y = window.scrollY; const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (header) header.classList.toggle('scrolled', y > 8);
      top.classList.toggle('show', y > 600);
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- پارالاکس هیرو ---------- */
  function initHeroTilt() {
    const hero = document.querySelector('.hero-books');
    if (!hero || reduced || !window.matchMedia('(hover:hover)').matches) return;
    const area = hero.closest('.hero') || hero;
    area.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      hero.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      hero.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
    });
    area.addEventListener('mouseleave', () => { hero.style.setProperty('--ry', '0deg'); hero.style.setProperty('--rx', '0deg'); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initScroll(); initHeroTilt(); scan();
    if (io) new MutationObserver((muts) => {
      if (muts.some((m) => m.addedNodes.length)) scan();
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
