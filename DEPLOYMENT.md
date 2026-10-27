# انتشار وانیکس روی Vercel + Supabase

این راهنما برای نسخهٔ Next.js در ریشهٔ ریپو است. API و رابط یک دیپلوی دارند؛ Python، MongoDB و Render برای اجرای نسخهٔ جدید لازم نیستند.

راهنماهای جدا:
- [دیتابیس تازه، انتقال داده و تعویض پروژه](docs/DATABASE_MIGRATION.md)
- [SQL یک‌جای نصب](supabase/SETUP.sql)
- [کوئری‌های بررسی فقط‌خواندنی](supabase/VERIFY.sql)
- [Auth و ایمیل](SUPABASE_AUTH.md)
- [فعال‌سازی ورود گوگل](docs/GOOGLE_AUTH.md)
- [سئو و چک‌لیست انتشار](docs/SEO.md)
- [نتیجهٔ ممیزی و محدودیت‌های باقی‌مانده](docs/RELEASE_AUDIT.md)

## ۱. پیش از push

فایل واقعی .env نباید در گیت باشد. هنگام انتقال پروژه به روت، .env از index خارج و فایل محلی حفظ شد. از ریشهٔ ریپو بررسی کنید:

```powershell
git ls-files -- .env .env.local
git check-ignore -- .env
git diff --cached --name-only
```

دستور اول نباید مسیر env واقعی را برگرداند؛ دستور دوم باید .env را نشان دهد. حذفِ ثبت فایل در گیت را همراه تغییرات خودتان commit کنید.
اگر secret یا رمز دیتابیس قبلاً push شده، پیش از انتشار در سرویس مربوطه تعویضش کنید. حذف فایل از commit جدید، تاریخچه را پاک نمی‌کند.
هیچ مقدار env واقعی را در README، چت یا اسکرین‌شات عمومی قرار ندهید.

## ۲. آماده‌سازی Supabase

در پروژهٔ مقصد، محتوای [SETUP.sql](supabase/SETUP.sql) را در SQL Editor با نقش postgres اجرا کنید.
برای دیتابیس موجود ابتدا بک‌آپ بگیرید. این SQL schema برنامه، indexها و bucket تصاویر را می‌سازد؛ انتقال داده انجام نمی‌دهد.
پس از آن [VERIFY.sql](supabase/VERIFY.sql) را اجرا کنید.

روش جایگزین محلی، از ریشهٔ پروژه و با env مقصد تنظیم‌شده:

```powershell
npm install
npm run db:migrate
```

فقط یکی از دو روش برای نصب کافی است. migration را در Build Command ورسل قرار ندهید.
برای migration/backup، SQL Editor یا اتصال Direct/Session مناسب است؛ برای runtime سرورلس از Transaction pooler استفاده کنید. رشتهٔ اتصال را از Connect همان پروژه بگیرید و نام میزبان را حدس نزنید. [راهنمای اتصال Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)

bucket پیش‌فرض business-media عمومی است و فقط برای تصاویر عمومی کسب‌وکار ساخته می‌شود؛ اطلاعات خصوصی مشتری/بیمار را در آن نگذارید. اگر bucket هم‌نامِ خصوصی از قبل دارید، آن را عمومی نکنید؛ مقصد جداگانه انتخاب و تنظیمات Storage را بررسی کنید.
schema app_private را به Exposed Schemas اضافه نکنید.

## ۳. تنظیم Auth

در Authentication:
- Email provider و Confirm email روشن باشد.
- Custom SMTP برای ارسال ایمیل به کاربران واقعی تنظیم شود.
- Site URL برابر https://1ix.ir باشد.
- Redirect URLs: آدرس https://1ix.ir/auth/confirm و https://1ix.ir/auth/confirm?flow=recovery مجاز باشند.
- برای Google، Provider را با Client ID/Secret در Supabase فعال و https://1ix.ir/api/auth/oauth/callback را نیز مجاز کنید؛ جزئیات در راهنمای Google Auth.
- قالب‌های تأیید و بازیابی از {{ .ConfirmationURL }} استفاده کنند.
- برای تست محلی، نسخهٔ localhost همین callbackها را اضافه کنید.
- CAPTCHA را بدون پیاده‌سازی فرم آن اجباری نکنید.

تأیید و بازیابی را در همان مرورگری انجام دهید که درخواست اولیه را فرستاده است. جزئیات در [SUPABASE_AUTH.md](SUPABASE_AUTH.md).

## ۴. تنظیمات Vercel

| گزینه | مقدار |
|---|---|
| Root Directory | نقطه (.)؛ package.json و next.config.mjs در ریشه‌اند |
| Framework | Next.js |
| Node.js | 22.x یا 24.x |
| Install | npm install --registry=https://registry.npmjs.org --no-audit --no-fund |
| Build | npm run build |
| Output Directory | پیش‌فرض؛ دستی تغییر ندهید |

محتوای برنامه و .git مستقیماً به ریشه منتقل شده‌اند؛ پوشهٔ frontend دیگری وجود ندارد. Root Directory ورسل را روی نقطه بگذارید.

متغیرهای Production را در Settings → Environment Variables تعریف کنید:

| متغیر | مقدار موردنیاز |
|---|---|
| DATABASE_URL | URI از Transaction pooler همان پروژهٔ Supabase؛ معمولاً پورت 6543 |
| DATABASE_SSLMODE | require |
| SUPABASE_URL | آدرس https پروژهٔ مقصد |
| SUPABASE_PUBLISHABLE_KEY | Publishable key همان پروژه؛ برای Auth |
| SUPABASE_SECRET_KEY | کلید Secret سمت سرور همان پروژه؛ برای Storage؛ یا SUPABASE_SERVICE_ROLE_KEY قدیمی |
| SUPABASE_STORAGE_BUCKET | business-media |
| SITE_URL | https://1ix.ir |
| NEXT_PUBLIC_SITE_URL | https://1ix.ir |

NEXT_PUBLIC_API_ORIGIN را تعریف نکنید یا خالی بگذارید؛ رابط از /api همان دامنه استفاده می‌کند.
رمز URI باید URL-encode شده باشد؛ secretها نباید NEXT_PUBLIC_ باشند.
DATABASE_URL، آدرس و دو کلید Supabase باید همگی متعلق به یک مقصد باشند.
برای Preview از Supabase تست جداگانه و callback دقیق همان دامنهٔ تست استفاده کنید؛ دادهٔ تولید را به Preview وصل نکنید.
تغییر env فقط روی دیپلوی تازه اعمال می‌شود؛ پس از تغییر، Redeploy کنید. [مستندات Vercel](https://vercel.com/docs/environment-variables)

MONGO_URL، DB_NAME و ADMIN_EMAIL روی Vercel لازم نیستند. SMS نیز برای ذخیرهٔ شماره تماس حساب لازم نیست.
.env محلی به‌صورت خودکار جایگزین Environment Variables ورسل نمی‌شود.

## ۵. دامنه و تست انتشار

دامنهٔ 1ix.ir را در Settings → Domains اضافه کنید و DNS را دقیقاً طبق مقادیر نمایش‌داده‌شدهٔ Vercel تنظیم کنید؛ IP یا CNAME را حدس نزنید.
www را در صورت استفاده به دامنهٔ اصلی redirect کنید. SITE_URL و NEXT_PUBLIC_SITE_URL باید با دامنهٔ نهایی یکسان باشند.

پس از دیپلوی:
- /api/health: پاسخ ۲۰۰ برای اجرای API.
- /api/health/ready: پاسخ ۲۰۰ برای اتصال و schema دیتابیس.
- /robots.txt و /sitemap.xml: پاسخ ۲۰۰؛ canonicalها دامنهٔ اصلی باشند.
- /share-image: تصویر PNG، نه HTML خطا.
- یک آدرس نامعتبر: پاسخ HTTP ۴۰۴ واقعی.
- ثبت‌نام با ایمیل واقعی، تأیید، ورود، رفرش مستقیم داشبورد، خروج و بازیابی رمز.
- ساخت و ذخیرهٔ صفحه، انتشار و مشاهدهٔ مستقیم /u/username.
- آپلود تصویر، ساخت/ویرایش لینک، QR و بازکردن لینک کوتاه.
- رزرو واقعی بر اساس ساعت کاری و بررسی ردِ زمان متداخل.
- در Google Search Console دامنه را با DNS تأیید و sitemap.xml را ثبت کنید.

این تست‌ها باید با حساب و دادهٔ تست خودتان انجام شوند؛ دادهٔ مشتری واقعی را تغییر ندهید.
green build به‌تنهایی صحت کلیدها، SMTP، DNS یا عملکرد واقعی پروژهٔ ابری را تضمین نمی‌کند.

## ۶. ساخت مدیر

با حساب خودتان ثبت‌نام کنید، ایمیل را تأیید و یک بار وارد شوید. سپس فقط در env محلی ADMIN_EMAIL را تنظیم و از ریشهٔ پروژه اجرا کنید:

```powershell
npm run db:admin
```

این دستور حساب موجود را مدیر می‌کند؛ رمز یا داده‌های کسب‌وکار را بازنویسی نمی‌کند.

## اجرای محلی و تست

env موجود را با Copy-Item بازنویسی نکنید. اگر هنوز env ندارید، .env.example را به .env.local کپی و مقادیر خودتان را وارد کنید.
برای localhost، SITE_URL و NEXT_PUBLIC_SITE_URL برابر http://localhost:3000 باشند. اگر .env.local دارید، نسبت به .env اولویت دارد؛ مقادیر قدیمی را در آن بررسی کنید.
بعد از تغییر env، سرور توسعه را دوباره راه‌اندازی کنید.

```powershell
npm install
npm run dev
```

دستورها را در پوشهٔ nobatdehi، کنار package.json اجرا کنید. سایت و API هر دو روی پورت ۳۰۰۰ هستند.

```powershell
npm test -- --watchAll=false --runInBand
npm run test:server
npm run build
npm run test:smoke
```

تست‌ها از دیتابیس تعبیه‌شده و آداپتورهای کنترل‌شده استفاده می‌کنند؛ smoke به دیتابیس ابری متصل نمی‌شود. برای اجرای نسخهٔ ساخته‌شده: npm start.
