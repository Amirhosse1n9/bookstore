/* =========================================================
   admin.js
   ورود مدیر و مدیریت کتاب‌ها از طریق Google Apps Script.
   توکن ورود در sessionStorage نگه‌داری می‌شود (فقط تا وقتی
   تب مرورگر باز است و بعد از ۲ ساعت توسط سرور منقضی می‌شود).
   ========================================================= */

const TOKEN_KEY = 'kitabkade_admin_token';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

function formatPrice(value) {
  return (Number(value) || 0).toLocaleString('fa-IR') + ' تومان';
}

/* ---------------- ورود ---------------- */
function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  if (sessionStorage.getItem(TOKEN_KEY)) {
    window.location.href = 'admin-panel.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-name').value.trim();
    const password = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = form.querySelector('button[type=submit]');

    errorEl.textContent = '';

    if (!isApiConfigured()) {
      errorEl.textContent = 'آدرس Apps Script هنوز در js/api.js تنظیم نشده است.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'در حال ورود...';

    try {
      const result = await apiPost({ action: 'login', username, password });
      if (result.ok) {
        sessionStorage.setItem(TOKEN_KEY, result.token);
        window.location.href = 'admin-panel.html';
      } else {
        errorEl.textContent = result.error || 'نام کاربری یا رمز عبور اشتباه است.';
      }
    } catch (err) {
      errorEl.textContent = 'خطا در ارتباط با سرور. اتصال اینترنت یا آدرس API را بررسی کن.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ورود';
    }
  });
}

/* ---------------- پنل مدیریت ---------------- */
async function initPanel() {
  const tableBody = document.getElementById('book-table-body');
  if (!tableBody) return;

  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = 'admin.html';
    return;
  }

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await apiPost({ action: 'logout', token }); } catch (e) { /* ignore */ }
    sessionStorage.removeItem(TOKEN_KEY);
    window.location.href = 'admin.html';
  });

  let books = [];
  let editingId = null;

  const form = document.getElementById('book-form');
  const formTitle = document.getElementById('form-title');
  const titleEl = document.getElementById('f-title');
  const authorEl = document.getElementById('f-author');
  const catEl = document.getElementById('f-category');
  const priceEl = document.getElementById('f-price');
  const ratingEl = document.getElementById('f-rating');
  const descEl = document.getElementById('f-description');
  const imageEl = document.getElementById('f-image');
  const stockEl = document.getElementById('f-instock');
  const cancelBtn = document.getElementById('cancel-edit');
  const statusEl = document.getElementById('panel-status');

  async function loadBooks() {
    statusEl.textContent = 'در حال بارگذاری...';
    try {
      const result = await apiGet({ action: 'list' });
      books = result && result.ok ? result.books : [];
      statusEl.textContent = '';
      renderTable();
    } catch (e) {
      statusEl.textContent = 'خطا در دریافت کتاب‌ها از گوگل‌شیت.';
    }
  }

  function handleUnauthorized(result) {
    if (result && result.ok === false && /دسترسی غیرمجاز/.test(result.error || '')) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.location.href = 'admin.html';
      return true;
    }
    return false;
  }

  function renderTable() {
    if (!books.length) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--sub);padding:24px 0;">هنوز کتابی اضافه نشده است.</td></tr>`;
      return;
    }
    tableBody.innerHTML = books.map((b) => `
      <tr>
        <td>${escapeHtml(b.title)}<br><span style="color:var(--sub);font-size:.78rem">${escapeHtml(b.author || '')} · ${escapeHtml(b.category || '')}</span></td>
        <td>${formatPrice(b.price)}</td>
        <td>${b.inStock === false ? '<span class="stock-badge out">ناموجود</span>' : '<span class="stock-badge">موجود</span>'}</td>
        <td style="max-width:220px">${escapeHtml((b.description || '').slice(0, 60))}${(b.description || '').length > 60 ? '…' : ''}</td>
        <td>
          <div class="row-actions">
            <button class="edit" data-id="${b.id}">ویرایش</button>
            <button class="del" data-id="${b.id}">حذف</button>
          </div>
        </td>
      </tr>
    `).join('');

    tableBody.querySelectorAll('.edit').forEach((btn) => btn.addEventListener('click', () => startEdit(btn.dataset.id)));
    tableBody.querySelectorAll('.del').forEach((btn) => btn.addEventListener('click', () => deleteBook(btn.dataset.id)));
  }

  function startEdit(id) {
    const b = books.find((x) => x.id === id);
    if (!b) return;
    editingId = id;
    formTitle.textContent = 'ویرایش کتاب';
    titleEl.value = b.title || '';
    authorEl.value = b.author || '';
    catEl.value = b.category || '';
    priceEl.value = b.price || 0;
    ratingEl.value = b.rating || 5;
    descEl.value = b.description || '';
    imageEl.value = b.image || '';
    stockEl.checked = b.inStock !== false;
    cancelBtn.style.display = 'inline-flex';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm() {
    editingId = null;
    formTitle.textContent = 'افزودن کتاب جدید';
    form.reset();
    ratingEl.value = 5;
    stockEl.checked = true;
    cancelBtn.style.display = 'none';
  }

  async function deleteBook(id) {
    if (!confirm('این کتاب حذف شود؟')) return;
    statusEl.textContent = 'در حال حذف...';
    const result = await apiPost({ action: 'delete', token, id });
    if (handleUnauthorized(result)) return;
    if (result.ok) {
      await loadBooks();
    } else {
      statusEl.textContent = result.error || 'خطا در حذف کتاب.';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      token,
      title: titleEl.value.trim(),
      author: authorEl.value.trim(),
      category: catEl.value.trim(),
      price: Number(priceEl.value) || 0,
      rating: Number(ratingEl.value) || 0,
      description: descEl.value.trim(),
      image: imageEl.value.trim(),
      inStock: stockEl.checked,
    };
    if (!payload.title) return;

    statusEl.textContent = 'در حال ذخیره...';
    const result = editingId
      ? await apiPost({ action: 'edit', id: editingId, ...payload })
      : await apiPost({ action: 'add', ...payload });

    if (handleUnauthorized(result)) return;
    if (result.ok) {
      await loadBooks();
      resetForm();
      statusEl.textContent = '';
    } else {
      statusEl.textContent = result.error || 'خطا در ذخیره کتاب.';
    }
  });

  cancelBtn.addEventListener('click', resetForm);

  await loadBooks();
}

initLogin();
initPanel();
