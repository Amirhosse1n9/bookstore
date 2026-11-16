# کتاب‌کده — فروشگاه آنلاین کتاب

فرانت‌اند با HTML + CSS + JavaScript خالص (بدون فریم‌ورک)، بک‌اند با Google Apps Script
متصل به یک Google Sheet. ساختار پروژه دقیقاً برای آپلود مستقیم روی GitHub Pages آماده است.

## ساختار پروژه

```
kitabkade/
├── index.html              → صفحه اصلی
├── books.html               → همه‌ی کتاب‌ها (فیلتر، جستجو، مرتب‌سازی)
├── admin.html                → ورود مدیر
├── admin-panel.html          → پنل مدیریت کتاب‌ها
├── css/style.css             → تمام استایل سایت
├── js/api.js                 → ارتباط با Apps Script
├── js/store.js               → نمایش کتاب‌ها در صفحه اصلی و کاتالوگ
├── js/admin.js                → منطق ورود و مدیریت پنل ادمین
├── robots.txt
├── sitemap.xml
└── apps-script-backend-DO-NOT-UPLOAD/Code.gs   → بک‌اند؛ این پوشه هرگز روی گیت‌هاب آپلود نشود
```

## ۱. ساخت Google Sheet

۱. یک Google Sheet جدید بساز.
۲. یک تب (Tab) با نام دقیقاً `Books` بساز.
۳. ردیف اول همین تب را دقیقاً با همین ترتیب پر کن (این‌ها فقط عنوان ستون‌اند؛ سطر دوم به بعد را سرور خودش پر می‌کند):

```
id | title | author | category | price | rating | description | image | inStock | createdAt
```

## ۲. نصب بک‌اند (Apps Script)

۱. توی همون گوگل‌شیت، از منو: **Extensions → Apps Script**
۲. هرچی توی ادیتور هست را پاک کن و کل محتوای فایل `apps-script-backend-DO-NOT-UPLOAD/Code.gs` را پیست کن.
۳. از منوی بالا، تابع `setupAdmin` را از لیست توابع انتخاب کن و دکمه‌ی **Run (▶)** را بزن.
   - اولین بار گوگل ازت اجازه (Authorization) می‌خواد؛ چون خودت صاحب اسکریپتی، روی «Advanced» و بعد «Go to [نام پروژه]» بزن.
   - این تابع یک کاربر مدیر با نام کاربری `admin` و رمز `change-me-now` می‌سازد.
   - **مهم:** داخل کد، مقدار `PASSWORD` را به یک رمز دلخواه و قوی عوض کن، و دوباره `setupAdmin` را اجرا کن تا رمز جدید ثبت شود.
4. دکمه‌ی آبی **Deploy → New deployment** را بزن:
   - روی آیکون چرخ‌دنده‌ی کنار «Select type» بزن → **Web app**
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Deploy را بزن و دوباره اجازه (Authorization) را تأیید کن.
5. آدرسی که می‌گیری شبیه این است:
   `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`
   این همان API سایت توست.

## ۳. وصل کردن فرانت‌اند به بک‌اند

فایل `js/api.js` را باز کن و خط اول را با آدرس واقعی خودت جایگزین کن:

```js
const API_URL = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
```

تا وقتی این مقدار را عوض نکنی، سایت به‌صورت خودکار از چند کتاب نمونه (داده‌ی آزمایشی)
برای پیش‌نمایش طراحی استفاده می‌کند — یعنی همین الان هم می‌تونی ظاهر سایت رو ببینی.

## ۴. آپلود روی گیت‌هاب (GitHub Pages)

```bash
git init
git add .
git commit -m "Initial kitabkade site"
git branch -M main
git remote add origin https://github.com/USERNAME/kitabkade.git
git push -u origin main
```

سپس در تنظیمات ریپازیتوری: **Settings → Pages → Branch: main → Save**

⚠️ **خیلی مهم:** پوشه‌ی `apps-script-backend-DO-NOT-UPLOAD/` را هیچ‌وقت پوش نکن —
کد بک‌اند جایش داخل خودِ ویرایشگر Apps Script گوگل است، نه روی گیت‌هاب. برای اطمینان
می‌تونی این پوشه را توی `.gitignore` هم اضافه کنی.

## ۵. ورود به پنل مدیریت

بعد از دیپلوی، به آدرس `yoursite.com/admin.html` برو و با نام‌کاربری/رمزی که توی
`setupAdmin` تنظیم کردی وارد شو. از اونجا می‌تونی کتاب اضافه/ویرایش/حذف کنی —
تغییرات مستقیم روی گوگل‌شیت اعمال و بلافاصله توی سایت دیده می‌شه.

## نکته‌ی مهم درباره‌ی Google Sheets به‌عنوان دیتابیس

برای شروع و تعداد کم کتاب (چند صد تا) خوب کار می‌کند، اما محدودیت نرخ درخواست
(Rate Limit) و کندی در ترافیک بالا دارد. وقتی سایت بزرگ‌تر شد، می‌شه به یک
دیتابیس واقعی مهاجرت کرد؛ چون منطق API در یک لایه‌ی جدا (`js/api.js` و
`Code.gs`) نگه داشته شده، این مهاجرت بعداً راحت‌تر خواهد بود.
