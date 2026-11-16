/* =========================================================
   store.js — کارت‌ها، صفحه اصلی و کاتالوگ
   ========================================================= */

// داده‌ی نمونه — فقط وقتی نشان داده می‌شود که API_URL هنوز تنظیم نشده
// یا اتصال به Apps Script برقرار نشود، تا پیش‌نمایش طراحی خالی نماند.
const SAMPLE_BOOKS = [
  { id: 's1', title: 'ملت عشق', author: 'الیف شافاک', price: 285000, rating: 5, category: 'رمان و داستان', description: 'داستانی موازی میان قرن سیزدهم و امروز.', inStock: true },
  { id: 's2', title: 'صد سال تنهایی', author: 'گابریل گارسیا مارکز', price: 310000, rating: 5, category: 'رمان و داستان', description: 'حماسه‌ی خانواده‌ی بوئندیا در ماکوندو.', inStock: true },
  { id: 's3', title: 'کوری', author: 'ژوزه ساراماگو', price: 240000, rating: 4, category: 'رمان و داستان', description: 'شهری که ناگهان همه در آن کور می‌شوند.', inStock: true },
  { id: 's4', title: 'بادبادک‌باز', author: 'خالد حسینی', price: 260000, rating: 5, category: 'رمان و داستان', description: 'دوستی و کفاره در افغانستان جنگ‌زده.', inStock: true },
  { id: 's5', title: 'شازده کوچولو', author: 'آنتوان دو سنت اگزوپری', price: 145000, rating: 5, category: 'کودک و نوجوان', description: 'قصه‌ای برای همه‌ی سنین.', inStock: true },
  { id: 's6', title: 'اتم‌های عادت', author: 'جیمز کلییر', price: 225000, rating: 5, category: 'روانشناسی', description: 'راهنمای عملی ساختن عادت‌های خوب.', inStock: true },
  { id: 's7', title: 'دیوان حافظ', author: 'خواجه حافظ شیرازی', price: 190000, rating: 5, category: 'شعر و ادبیات کلاسیک', description: 'غزلیات کامل با تصحیح معتبر.', inStock: true },
  { id: 's8', title: 'بوف کور', author: 'صادق هدایت', price: 120000, rating: 5, category: 'رمان و داستان', description: 'شاهکار ادبیات تاریک فارسی.', inStock: false },
];

function formatPrice(value) { return (Number(value) || 0).toLocaleString('fa-IR'); }
function escapeHtml(str) { return KB.esc(str); }

function starString(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

// یکسان‌سازی حروف عربی/فارسی و حذف اعراب برای جستجوی بهتر
function normalizeFa(s) {
  return String(s || '').toLowerCase()
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064B-\u065F\u200c]/g, '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}

function coverHtml(b) {
  const [bg, fg] = KB.coverColors(b.id);
  if (b.image) {
    return `<div class="card-media has-img" style="background:${bg};"><img src="${escapeHtml(b.image)}" alt="${escapeHtml(b.title)}" loading="lazy"></div>`;
  }
  return `<div class="card-media" style="background:${bg}; color:${fg};">
      <span class="cat-tag">${escapeHtml(b.category || '')}</span>
      <div class="cover-title">${escapeHtml(b.title)}</div>
    </div>`;
}

let _booksPromise;
function fetchBooks() {
  if (_booksPromise) return _booksPromise;
  _booksPromise = (async () => {
    let list = SAMPLE_BOOKS;
    if (isApiConfigured()) {
      try {
        const result = await apiGet({ action: 'list' });
        if (result && result.ok) list = result.books || [];
        else throw new Error(result && result.error);
      } catch (e) { list = SAMPLE_BOOKS; }
    }
    KB.byId = {};
    list.forEach((b) => { KB.byId[String(b.id)] = b; });
    return list;
  })();
  return _booksPromise;
}

const HEART = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19.5s-7-4.4-9.3-8.6C1.2 8.1 2.6 4.5 6 4.5c2 0 3.2 1.1 4 2.3h4c.8-1.2 2-2.3 4-2.3 3.4 0 4.8 3.6 3.3 6.4C19 15.1 12 19.5 12 19.5z"/></svg>';

function bookCardHtml(b) {
  const id = escapeHtml(b.id);
  const href = `book.html?id=${encodeURIComponent(b.id)}`;
  const oos = b.inStock === false;
  const addBtn = oos
    ? `<button class="add-btn" disabled aria-label="ناموجود" style="opacity:.4; cursor:not-allowed;">
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
       </button>`
    : `<div class="add-slot" data-id="${id}">
         <button class="add-btn" aria-label="افزودن به سبد" data-add data-id="${id}">
           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
         </button>
       </div>`;

  return `
    <article class="card${oos ? ' is-oos' : ''}">
      <div class="card-visual">
        <a href="${href}" aria-label="${escapeHtml(b.title)}">${coverHtml(b)}</a>
        <button class="wish-btn" data-wish data-id="${id}" aria-label="علاقه‌مندی" aria-pressed="false">${HEART}</button>
      </div>
      <div class="card-body">
        <h3 class="card-title"><a href="${href}">${escapeHtml(b.title)}</a></h3>
        <div class="card-author">${escapeHtml(b.author || '')}</div>
        ${oos ? '<div class="card-oos">ناموجود</div>' : ''}
        <div class="price-row">
          <div class="card-price">${formatPrice(b.price)} <small>تومان</small></div>
          ${addBtn}
        </div>
      </div>
    </article>`;
}

const skeletonGrid = (n = 4) => Array.from({ length: n }, () =>
  '<div class="card skeleton"><div class="card-media"></div><div class="sk-line"></div><div class="sk-line short"></div></div>').join('');

function renderGrid(grid, books, emptyMsg) {
  grid.innerHTML = books.length ? books.map(bookCardHtml).join('') : `<div class="empty-state">${emptyMsg}</div>`;
  KB.updateBadges();
}

/* ---------------- صفحه اصلی ---------------- */
async function initHome() {
  const grid = document.getElementById('home-grid');
  if (!grid) return;
  grid.innerHTML = skeletonGrid(4);
  const books = await fetchBooks();
  renderGrid(grid, books.slice(0, 8), 'فعلاً کتابی برای نمایش ثبت نشده است.');

  const catGrid = document.getElementById('cat-grid');
  if (catGrid) {
    const counts = {};
    books.forEach((b) => { if (b.category) counts[b.category] = (counts[b.category] || 0) + 1; });
    catGrid.innerHTML = Object.entries(counts).map(([c, n]) =>
      `<a class="cat-tile" href="books.html?cat=${encodeURIComponent(c)}"><span>${escapeHtml(c)}</span><small>${n.toLocaleString('fa-IR')} کتاب</small></a>`).join('');
    const sec = document.getElementById('categories');
    if (sec && !catGrid.children.length) sec.style.display = 'none';
  }
}

/* ---------------- کاتالوگ ---------------- */
async function initCatalogPage() {
  const grid = document.getElementById('book-grid');
  if (!grid) return;

  const filterEl = document.getElementById('filters');
  const searchInput = document.getElementById('searchInput');
  const sortDropdown = document.getElementById('sortDropdown');
  const resultCountEl = document.getElementById('resultCount');
  const loadMoreWrap = document.getElementById('loadMoreWrap');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const FAV = '__fav';
  const params = new URLSearchParams(location.search);

  grid.innerHTML = skeletonGrid(8);
  const allBooks = await fetchBooks();
  const categories = ['همه', ...new Set(allBooks.map((b) => b.category).filter(Boolean))];

  let activeCategory = 'همه';
  if (params.get('fav')) activeCategory = FAV;
  else if (categories.includes(params.get('cat'))) activeCategory = params.get('cat');
  let searchTerm = (params.get('q') || '').trim();
  let sortMode = 'default';
  let visibleCount = 8;
  if (searchInput) searchInput.value = searchTerm;

  if (filterEl) {
    const chip = (c, label) => `<button data-cat="${escapeHtml(c)}" class="${c === activeCategory ? 'active' : ''}">${label}</button>`;
    filterEl.innerHTML = categories.map((c) => chip(c, escapeHtml(c))).join('') + chip(FAV, '♡ علاقه‌مندی‌ها');
    filterEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      activeCategory = btn.dataset.cat;
      visibleCount = 8;
      [...filterEl.children].forEach((c) => c.classList.toggle('active', c === btn));
      render();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => { searchTerm = e.target.value.trim(); visibleCount = 8; render(); });
  }

  if (sortDropdown) {
    const btn = sortDropdown.querySelector('.dd-btn');
    const label = document.getElementById('sortLabel');
    const close = () => { sortDropdown.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = sortDropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    sortDropdown.querySelector('.dd-menu').addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      sortMode = li.dataset.value;
      label.textContent = li.textContent;
      sortDropdown.querySelectorAll('li').forEach((x) => x.classList.toggle('selected', x === li));
      visibleCount = 8;
      close();
      render();
    });
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  function getFiltered() {
    const q = normalizeFa(searchTerm);
    let list = allBooks.filter((b) =>
      (activeCategory === 'همه' || (activeCategory === FAV ? KB.wish.has(b.id) : b.category === activeCategory)) &&
      (!q || normalizeFa(b.title).includes(q) || normalizeFa(b.author).includes(q))
    );
    if (sortMode === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortMode === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sortMode === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }

  function render() {
    const filtered = getFiltered();
    if (resultCountEl) resultCountEl.textContent = `${filtered.length.toLocaleString('fa-IR')} کتاب پیدا شد`;
    renderGrid(grid, filtered.slice(0, visibleCount),
      activeCategory === FAV ? 'هنوز کتابی را به علاقه‌مندی‌ها اضافه نکرده‌ای.' : 'کتابی با این مشخصات پیدا نشد. فیلتر یا جستجو رو عوض کن.');
    if (loadMoreWrap) loadMoreWrap.style.display = filtered.length > visibleCount ? 'flex' : 'none';
  }

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => { visibleCount += 8; render(); });
  window.addEventListener('kb:wish', () => { if (activeCategory === FAV) render(); });

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  initHome();
  initCatalogPage();
});
