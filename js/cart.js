/* =========================================================
   cart.js — سبد خرید، علاقه‌مندی‌ها، حالت تیره، پیام‌ها و هدر
   (داده‌ها در localStorage مرورگر نگه‌داری می‌شوند)
   ========================================================= */
(function () {
  const K = { cart: 'kb_cart', wish: 'kb_wish', theme: 'kb_theme' };
  const MAX_QTY = 10;
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const fmt = (n) => (Number(n) || 0).toLocaleString('fa-IR');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const emit = (name) => window.dispatchEvent(new CustomEvent(name));

  const PALETTE = [
    ['#1F2A44', '#F3EFE6'], ['#C8502A', '#FFFFFF'], ['#E8E2D2', '#141414'],
    ['#2F4A3C', '#F3EFE6'], ['#D9C7A3', '#141414'], ['#3A2F3F', '#F3EFE6'],
    ['#B9C4C0', '#141414'], ['#7A2E22', '#F3EFE6'],
  ];
  // رنگ جلد بر اساس id کتاب — در همه‌ی صفحه‌ها یکسان می‌ماند
  const coverColors = (id) => {
    let h = 0; const s = String(id);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  };

  /* ---------- سبد ---------- */
  const cart = {
    items: () => read(K.cart, []),
    count: () => cart.items().reduce((a, i) => a + i.qty, 0),
    total: () => cart.items().reduce((a, i) => a + i.qty * i.price, 0),
    add(b) {
      const items = cart.items();
      const ex = items.find((i) => i.id === String(b.id));
      if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + 1);
      else items.push({ id: String(b.id), title: b.title, author: b.author || '', price: Number(b.price) || 0, qty: 1 });
      write(K.cart, items); emit('kb:cart');
    },
    setQty(id, q) {
      let items = cart.items();
      if (q <= 0) items = items.filter((i) => i.id !== id);
      else items.forEach((i) => { if (i.id === id) i.qty = Math.min(MAX_QTY, q); });
      write(K.cart, items); emit('kb:cart');
    },
    remove: (id) => cart.setQty(id, 0),
    clear() { write(K.cart, []); emit('kb:cart'); },
  };

  /* ---------- علاقه‌مندی ---------- */
  const wish = {
    list: () => read(K.wish, []),
    has: (id) => wish.list().includes(String(id)),
    toggle(id) {
      id = String(id);
      let l = wish.list();
      const on = !l.includes(id);
      l = on ? [...l, id] : l.filter((x) => x !== id);
      write(K.wish, l); emit('kb:wish');
      return on;
    },
  };

  /* ---------- پیام ---------- */
  let toastEl, toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.getElementById('toast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast'; toastEl.id = 'toast';
        toastEl.innerHTML = '<span class="dot"></span><span id="toastText"></span>';
        document.body.appendChild(toastEl);
      }
    }
    toastEl.querySelector('#toastText').textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ---------- حالت تیره ---------- */
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  function setTheme(dark) {
    if (dark) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(K.theme, dark ? 'dark' : 'light'); } catch (e) {}
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // تغییر تم با پخش دایره‌ای از محل دکمه (View Transitions) — در مرورگرهای قدیمی‌تر محو نرم
  function switchTheme(dark, x, y) {
    const root = document.documentElement;
    if (!document.startViewTransition || reduced()) {
      root.classList.add('theme-fade');
      setTheme(dark);
      setTimeout(() => root.classList.remove('theme-fade'), 500);
      return;
    }
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => setTheme(dark));
    t.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
    )).catch(() => {});
  }

  /* ---------- هدر ---------- */
  const ICON = {
    heart: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-9.3-8.6C1.2 8.6 2.6 5 6 5c2 0 3.2 1.1 4 2.3h4C14.8 6.1 16 5 18 5c3.4 0 4.8 3.6 3.3 6.4C19 15.6 12 20 12 20z" transform="translate(0 -.5)"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    sun: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  };
  const QTY_ICONS = {
    plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg class="i-minus" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    trash: '<svg class="i-trash" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  };
  // کنترل تعداد (نوار +/عدد/حذف) که جای دکمه‌ی افزودن می‌نشیند
  const qtyHtml = () => `<div class="qty" role="group" aria-label="تعداد در سبد">
      <button type="button" data-inc aria-label="افزایش تعداد">${QTY_ICONS.plus}</button>
      <span class="qty-n" aria-live="polite">۱</span>
      <button type="button" data-dec aria-label="کاهش تعداد یا حذف">${QTY_ICONS.minus}${QTY_ICONS.trash}</button>
    </div>`;

  function syncSlots() {
    const items = cart.items();
    document.querySelectorAll('.add-slot').forEach((s) => {
      if (!s.querySelector('.qty')) s.insertAdjacentHTML('beforeend', qtyHtml());
      const it = items.find((i) => i.id === s.dataset.id);
      const q = it ? it.qty : 0;
      const was = s.classList.contains('in-cart');
      s.classList.toggle('in-cart', q > 0);
      s.classList.toggle('is-one', q === 1);
      s.classList.toggle('at-max', q >= MAX_QTY);
      s.querySelector('[data-inc]').disabled = q >= MAX_QTY;
      const n = s.querySelector('.qty-n');
      const label = fmt(q || 1);
      if (n.textContent !== label) {
        n.textContent = label;
        if (was && q > 0) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
      }
      if (was && q === 0) { s.classList.remove('back'); void s.offsetWidth; s.classList.add('back'); }
    });
  }

  function initHeader() {
    const actions = document.querySelector('.header-actions');
    const cartBtn = document.getElementById('cartBtn');
    if (!actions || !cartBtn) return;

    const themeBtn = document.createElement('button');
    themeBtn.className = 'icon-btn'; themeBtn.id = 'themeBtn'; themeBtn.setAttribute('aria-label', 'تغییر حالت تیره/روشن');
    const paintTheme = (animate) => {
      themeBtn.innerHTML = isDark() ? ICON.sun : ICON.moon;
      const svg = themeBtn.querySelector('svg');
      if (animate && svg && svg.animate && !reduced()) {
        svg.animate([{ transform: 'rotate(-120deg) scale(.3)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 550, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
      }
    };
    paintTheme(false);
    themeBtn.addEventListener('click', () => {
      const r = themeBtn.getBoundingClientRect();
      switchTheme(!isDark(), r.left + r.width / 2, r.top + r.height / 2);
      paintTheme(true);
    });

    const wishBtn = document.createElement('a');
    wishBtn.className = 'icon-btn'; wishBtn.href = 'books.html?fav=1'; wishBtn.setAttribute('aria-label', 'علاقه‌مندی‌ها');
    wishBtn.innerHTML = ICON.heart + '<span class="cart-count" id="wishCount">0</span>';

    actions.insertBefore(themeBtn, cartBtn);
    actions.insertBefore(wishBtn, cartBtn);

    const search = document.getElementById('headerSearch');
    if (search) search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && search.value.trim()) location.href = 'books.html?q=' + encodeURIComponent(search.value.trim());
    });
  }

  function updateBadges() {
    const setBadge = (el, val) => {
      if (!el) return;
      const t = fmt(val);
      if (el.textContent !== t) {
        el.textContent = t;
        if (el.dataset.ready) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
      }
      el.dataset.ready = '1';
      el.classList.toggle('is-zero', val === 0);
    };
    setBadge(document.getElementById('cartCount'), cart.count());
    setBadge(document.getElementById('wishCount'), wish.list().length);
    syncSlots();
    document.querySelectorAll('[data-wish]').forEach((b) => {
      const on = wish.has(b.dataset.id);
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
  }

  /* ---------- کشوی سبد ---------- */
  let drawer, overlay;
  function buildDrawer() {
    overlay = document.createElement('div'); overlay.className = 'overlay';
    drawer = document.createElement('aside'); drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-label', 'سبد خرید'); drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <div class="drawer-head"><h2>سبد خرید</h2><button class="icon-btn" id="drawerClose" aria-label="بستن"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="drawer-body" id="drawerBody"></div>
      <div class="drawer-foot" id="drawerFoot"></div>`;
    document.body.append(overlay, drawer);
    overlay.addEventListener('click', closeCart);
    drawer.querySelector('#drawerClose').addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
    drawer.addEventListener('click', (e) => {
      const t = e.target.closest('[data-qty]'); if (!t) return;
      const id = t.dataset.id; const it = cart.items().find((i) => i.id === id); if (!it) return;
      cart.setQty(id, it.qty + Number(t.dataset.qty));
    });
    drawer.addEventListener('click', (e) => { const r = e.target.closest('[data-remove]'); if (r) cart.remove(r.dataset.remove); });
  }
  function renderDrawer() {
    if (!drawer) return;
    const items = cart.items();
    const body = drawer.querySelector('#drawerBody'); const foot = drawer.querySelector('#drawerFoot');
    if (!items.length) {
      body.innerHTML = `<div class="drawer-empty"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="17" cy="21" r="1"/></svg><p>سبد خرید خالی است.</p><a class="btn btn-ghost" href="books.html">مرور کتاب‌ها</a></div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = items.map((i, idx) => {
      const [bg, fg] = coverColors(i.id);
      return `<div class="cart-item" style="--i:${idx}">
        <a href="book.html?id=${encodeURIComponent(i.id)}" class="mini-cover" style="background:${bg};color:${fg}" aria-hidden="true">${esc(i.title.slice(0, 1))}</a>
        <div class="ci-info">
          <a class="ci-title" href="book.html?id=${encodeURIComponent(i.id)}">${esc(i.title)}</a>
          <div class="ci-author">${esc(i.author)}</div>
          <div class="ci-row">
            <div class="stepper">
              <button data-qty="-1" data-id="${esc(i.id)}" aria-label="کم کردن">${i.qty === 1 ? QTY_ICONS.trash : QTY_ICONS.minus}</button>
              <span>${fmt(i.qty)}</span>
              <button data-qty="1" data-id="${esc(i.id)}" aria-label="زیاد کردن" ${i.qty >= MAX_QTY ? 'disabled' : ''}>${QTY_ICONS.plus}</button>
            </div>
            <div class="ci-price">${fmt(i.price * i.qty)} <small>تومان</small></div>
          </div>
        </div>
        <button class="ci-remove" data-remove="${esc(i.id)}" aria-label="حذف"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>`;
    }).join('');
    foot.innerHTML = `
      <div class="sum-row"><span>جمع کل</span><b>${fmt(cart.total())} <small>تومان</small></b></div>`;
  }
  function openCart() { renderDrawer(); drawer.classList.add('opening'); setTimeout(() => drawer.classList.remove('opening'), 900); overlay.classList.add('show'); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll'); }
  function closeCart() { if (!drawer) return; overlay.classList.remove('show'); drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); }

  /* ---------- رویدادها ---------- */
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const b = (window.KB.byId || {})[addBtn.dataset.id];
      if (!b) return;
      cart.add(b);
      const cb = document.getElementById('cartBtn');
      if (cb) { cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
      toast(`«${b.title}» به سبد اضافه شد`);
      return;
    }
    const step = e.target.closest('[data-inc],[data-dec]');
    if (step) {
      const slot = step.closest('.add-slot'); if (!slot) return;
      const it = cart.items().find((i) => i.id === slot.dataset.id); if (!it) return;
      cart.setQty(slot.dataset.id, it.qty + (step.hasAttribute('data-inc') ? 1 : -1));
      return;
    }
    const w = e.target.closest('[data-wish]');
    if (w) {
      e.preventDefault();
      const b = (window.KB.byId || {})[w.dataset.id];
      const on = wish.toggle(w.dataset.id);
      if (on) { w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop'); }
      toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
    }
  });

  window.addEventListener('kb:cart', () => { updateBadges(); renderDrawer(); });
  window.addEventListener('kb:wish', updateBadges);
  window.addEventListener('storage', () => { updateBadges(); renderDrawer(); });

  window.KB = Object.assign(window.KB || {}, { cart, wish, toast, fmt, esc, coverColors, openCart, closeCart, updateBadges, byId: {} });

  document.addEventListener('DOMContentLoaded', () => {
    initHeader(); buildDrawer();
    const cb = document.getElementById('cartBtn');
    if (cb) cb.addEventListener('click', openCart);
    updateBadges(); renderDrawer();
  });
})();
