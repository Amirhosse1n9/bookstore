/* book.js — صفحه‌ی جزئیات کتاب (book.html?id=...) */
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('book-root');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  root.innerHTML = '<div class="book-detail"><div class="skeleton"><div class="card-media"></div></div><div class="skeleton"><div class="sk-line"></div><div class="sk-line short"></div></div></div>';

  const books = await fetchBooks();
  const b = books.find((x) => String(x.id) === String(id));
  if (!b) {
    root.innerHTML = '<div class="empty-state">کتاب مورد نظر پیدا نشد.<br><a class="btn btn-ghost" style="margin-top:16px" href="books.html">بازگشت به کتاب‌ها</a></div>';
    return;
  }

  document.title = `${b.title} | کتاب‌کده`;
  const md = document.querySelector('meta[name="description"]');
  if (md) md.content = `${b.title} اثر ${b.author || ''} — ${b.description || 'خرید آنلاین از کتاب‌کده'}`.slice(0, 160);

  const oos = b.inStock === false;
  const esc = KB.esc;
  root.innerHTML = `
    <nav class="crumbs"><a href="index.html">خانه</a><span>/</span><a href="books.html">کتاب‌ها</a>${b.category ? `<span>/</span><a href="books.html?cat=${encodeURIComponent(b.category)}">${esc(b.category)}</a>` : ''}</nav>
    <div class="book-detail">
      <div class="book-cover">${coverHtml(b)}</div>
      <div class="book-info">
        ${b.category ? `<a class="chip" href="books.html?cat=${encodeURIComponent(b.category)}">${esc(b.category)}</a>` : ''}
        <h1>${esc(b.title)}</h1>
        <div class="book-author">${esc(b.author || '')}</div>
        ${b.rating ? `<div class="stars" title="امتیاز ${b.rating} از ۵">${starString(b.rating)}</div>` : ''}
        <p class="book-desc">${esc(b.description || 'توضیحی برای این کتاب ثبت نشده است.')}</p>
        <div class="book-buy">
          <div class="book-price">${formatPrice(b.price)} <small>تومان</small></div>
          <div class="book-actions">
            ${oos
              ? '<button class="btn btn-primary" disabled style="opacity:.4;cursor:not-allowed">ناموجود</button>'
              : `<div class="add-slot big" data-id="${esc(b.id)}"><button class="btn btn-primary" data-add data-id="${esc(b.id)}">افزودن به سبد خرید</button></div>`}
            <button class="wish-btn static" data-wish data-id="${esc(b.id)}" aria-label="علاقه‌مندی" aria-pressed="false">${HEART}</button>
          </div>
        </div>
      </div>
    </div>
    <section class="related" id="related"></section>`;

  const rel = books.filter((x) => x.id !== b.id && x.category === b.category);
  const more = rel.length ? rel : books.filter((x) => x.id !== b.id);
  if (more.length) {
    const el = document.getElementById('related');
    el.innerHTML = `<div class="section-head"><h2>کتاب‌های مشابه</h2><a class="see-all" href="books.html">مشاهده همه</a></div><div class="grid" id="related-grid"></div>`;
    renderGrid(document.getElementById('related-grid'), more.slice(0, 4), '');
  }
  KB.updateBadges();
});
