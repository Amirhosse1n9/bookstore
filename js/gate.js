/* gate.js — دسترسی پنهان به ورود مدیر
   لینک ورود مدیر در HTML نیست؛ فقط وقتی عبارت مخفی در یکی از کادرهای جستجو
   تایپ شود، در فوتر ظاهر می‌شود. از خودِ عبارت فقط یک هش اینجا نگه‌داری می‌شود. */
(function () {
  const h=(s,seed=0)=>{let a=0xdeadbeef^seed,b=0x41c6ce57^seed;for(let i=0,c;i<s.length;i++){c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677);}a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return 4294967296*(2097151&b)+(a>>>0);};
  const GATE = 959874528307495;
  const PATH = atob('YWRtaW4uaHRtbA=='); // آدرس صفحه‌ی ورود (به‌صورت کدگذاری‌شده)
  const FLAG = 'kb_g';

  function reveal() {
    const a = document.getElementById('adminSlot');
    if (!a || !a.hidden) return;
    a.href = PATH; a.textContent = 'ورود مدیر';
    a.hidden = false; a.classList.add('reveal');
    try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    try { if (sessionStorage.getItem(FLAG) === '1') reveal(); } catch (e) {}
    document.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || t.tagName !== 'INPUT' || !t.closest('.search-box')) return;
      if (h(String(t.value).trim().toLowerCase()) !== GATE) return;
      reveal();
      t.value = '';
      t.dispatchEvent(new Event('input', { bubbles: true })); // فهرست کتاب‌ها به حالت عادی برگردد
    });
  });
})();
