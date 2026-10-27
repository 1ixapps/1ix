# وانیکس — Next.js و Supabase

رابط و API در یک برنامهٔ Next.js اجرا می‌شوند. دیتابیس PostgreSQL، Auth و Storage روی Supabase هستند.

راهنماهای جدا:
- [دیپلوی روی Vercel](DEPLOYMENT.md)
- [راه‌اندازی و تغییر دیتابیس / انتقال داده](docs/DATABASE_MIGRATION.md)
- [کوئری آمادهٔ نصب در SQL Editor](supabase/SETUP.sql)
- [کوئری‌های بررسی دیتابیس](supabase/VERIFY.sql)
- [تنظیم ورود و تأیید ایمیل](SUPABASE_AUTH.md)
- [ورود با گوگل](docs/GOOGLE_AUTH.md)
- [سئو و Search Console](docs/SEO.md)
- [نتیجهٔ بررسی و محدودیت‌های انتشار](docs/RELEASE_AUDIT.md)

## اجرا

Node.js نسخهٔ ۲۲ یا ۲۴. دستورها از همین پوشه:

```powershell
npm ci
npm run dev
```

برای توسعه از npm run dev استفاده کنید، نه npm start. آدرس سایت و API روی http://localhost:3000 است.
env موجود را بازنویسی نکنید. اگر تنظیمات ندارید، .env.example را به .env.local کپی و مقادیر واقعی را فقط محلی وارد کنید.
Next.js هر دو .env و .env.local را می‌خواند؛ .env.local اولویت دارد. برای localhost، SITE_URL و NEXT_PUBLIC_SITE_URL را http://localhost:3000 قرار دهید.

## ساخت و تست

```powershell
npm test -- --watchAll=false --runInBand
npm run test:server
npm run build
npm run test:smoke
npm start
```

خروجی ساخت .next است، نه build. npm start نسخهٔ ساخته‌شده را اجرا می‌کند.
دستور بک‌اند جداگانه، eject یا سرور CRA برای اجرای این نسخه وجود ندارد؛ CRACO فقط برای تست‌های قدیمی React باقی مانده است.
پروژه مستقیماً در ریشهٔ ریپو است؛ پوشهٔ frontend دیگری وجود ندارد. Root Directory در Vercel را روی نقطه (.) بگذارید.
فایل .env محلی حفظ شده، از index گیت خارج شده و ignore می‌شود. secretهای احتمالی در تاریخچهٔ قبلی گیت پاک نشده‌اند؛ اگر قبلاً push شده‌اند تعویضشان کنید.
قبل از انتشار، موارد تجاری و امنیتی باقی‌مانده در گزارش ممیزی را بخوانید.
