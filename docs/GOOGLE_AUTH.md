# ورود با گوگل از طریق Supabase Auth

کد ورود و ثبت‌نام آماده است؛ فعال‌سازی Google Provider و اعتبارنامه‌های آن باید در حساب‌های خودتان انجام شود.
این راهنما برای Supabase میزبانی‌شده و Next.js همین ریپو است. دیتابیس یا migration تازه لازم ندارد.

## ۱. Google Cloud / Google Auth Platform

۱. یک پروژه انتخاب کنید؛ Branding، Audience و اطلاعات تماس را با اطلاعات واقعی وانیکس تنظیم کنید.
۲. در Clients یک OAuth Client از نوع Web application بسازید.
۳. در Authorized JavaScript origins، آدرس‌های مورد استفاده را وارد کنید:
- https://1ix.ir
- http://localhost:3000 برای توسعه

۴. در Authorized redirect URIs، callback پروژهٔ Supabase را دقیقاً از صفحهٔ Google Provider همان پروژه کپی کنید. معمولاً:

```text
https://PROJECT_REF.supabase.co/auth/v1/callback
```

آدرس callback برنامه را جای این آدرس در Google نگذارید. اگر دامنهٔ سفارشی Auth دارید، آدرس نمایش‌داده‌شده در Supabase ملاک است.
۵. Client ID و Client Secret را ذخیره کنید؛ Secret را در چت، گیت یا کد مرورگر قرار ندهید.
۶. فقط openid، ایمیل و پروفایل لازم‌اند؛ Gmail و Calendar یا دسترسی اضافی لازم نیست.
۷. اگر Audience روی Testing است، کاربران تست را اضافه کنید. برای کاربران عمومی وضعیت انتشار و الزامات Google را تکمیل کنید.
۸. نام، لوگو، دامنه و در صورت درخواست Google، سیاست حریم خصوصی باید واقعی و قابل‌دسترسی باشند؛ لینک خالی یا ساختگی نگذارید.

## ۲. Supabase

در Authentication → Sign In / Providers → Google:
- Google را فعال کنید.
- Client ID و Client Secret مرحلهٔ قبل را وارد و ذخیره کنید.
- Skip nonce checks را برای این جریان فعال نکنید.

Client ID/Secret در خود Supabase ذخیره می‌شوند؛ متغیر GOOGLE_CLIENT_SECRET یا NEXT_PUBLIC_GOOGLE_CLIENT_ID در برنامه لازم نیست.
همان SUPABASE_URL و کلید عمومی Auth موجود استفاده می‌شوند؛ Secret مربوط به Storage جای کلید عمومی ورود نیست.

در Authentication → URL Configuration:
- Site URL برای تولید: https://1ix.ir
- Redirect URLs:
  - https://1ix.ir/api/auth/oauth/callback
  - http://localhost:3000/api/auth/oauth/callback

| محل تنظیم | callback |
|---|---|
| Google Cloud → Authorized redirect URIs | آدرس Supabase با پایان /auth/v1/callback |
| Supabase → Redirect URLs | آدرس برنامه با پایان /api/auth/oauth/callback |

آدرس‌های تأیید و بازیابی قبلی /auth/confirm را حذف نکنید.
برای Preview دامنهٔ دقیق تست را مجاز کنید، نه wildcard عمومی؛ دادهٔ تولید را به محیط تست وصل نکنید.

## ۳. env و دیپلوی

در تولید:

```env
SITE_URL=https://1ix.ir
NEXT_PUBLIC_SITE_URL=https://1ix.ir
```

در توسعهٔ محلی، هر دو http://localhost:3000 باشند.
SUPABASE_URL، SUPABASE_PUBLISHABLE_KEY و DATABASE_URL باید متعلق به یک پروژه باشند.
بعد از تغییر env، سرور توسعه را ری‌استارت یا Vercel را Redeploy کنید.
اگر از vercel.app استفاده می‌کنید، SITE_URL و callback مجاز باید با همان آدرس هماهنگ باشند.

## ۴. جریان پیاده‌سازی

- دکمهٔ «ادامه با گوگل» در ورود و ثبت‌نام، بدون پرکردن فرم ایمیل کار می‌کند.
- POST /api/auth/oauth/google، Provider را بررسی و PKCE را آماده می‌کند؛ در این مرحله پروفایل دیتابیس ساخته نمی‌شود.
- verifier فقط در کوکی HttpOnly و SameSite=Lax با عمر ده دقیقه است؛ در تولید Secure است.
- Google و Supabase کاربر را به GET /api/auth/oauth/callback برمی‌گردانند.
- کد یک‌بارمصرف با verifier در سرور مبادله و توکن از endpoint رسمی /user دوباره تأیید می‌شود.
- نشست از همان کوکی‌های HttpOnly فعلی استفاده می‌کند؛ access/refresh/provider token در localStorage یا URL داشبورد قرار نمی‌گیرد.
- PKCE گوگل از جریان ایمیل/بازیابی جداست. چند تلاش گوگل هم‌زمان در یک مرورگر پشتیبانی نمی‌شود؛ تلاش تازه proof قبلی گوگل را جایگزین می‌کند.
- حساب موجود ID، نام ویرایش‌شده، نقش، پلن و مالکیت داده‌ها را حفظ می‌کند. Linking هویت‌ها را Supabase کنترل می‌کند؛ تعارض شناسه بی‌صدا بازنویسی نمی‌شود.
- کاربر جدیدِ تأییدشده با نام Google و همان دورهٔ هفت‌روزهٔ فعلی ایجاد می‌شود. metadata نمی‌تواند نقش مدیر یا پلن پولی بدهد.
- مقصد مجاز فقط مسیر داخلی داشبورد است؛ ورودی خارجی رد می‌شود. ثبت‌نام به صفحه‌ساز، ورود عادی به داشبورد و مدیر بدون مقصد مشخص به مدیریت می‌رود.
- لغو یا کد منقضی پیام فارسی قابل‌تلاش‌مجدد دارد؛ متن خام Provider نمایش داده نمی‌شود.
- این قابلیت صرفاً ورود است؛ دسترسی به داده‌های سرویس‌های Google اضافه نشده است.

## ۵. تست واقعی پس از تنظیم Provider

۱. از /login وارد Google شوید و انتخاب حساب را کامل کنید.
۲. پس از برگشت، حساب درست و رفرش داشبورد را بررسی کنید.
۳. خروج و سپس ثبت‌نام با یک حساب تست تازه: نام، یک‌بارساخته‌شدن پروفایل و دورهٔ آزمایشی را بررسی کنید.
۴. حساب ایمیلی قبلی با همان ایمیل باید نام و پلن خود را نگه دارد؛ linking مطابق تنظیمات Supabase است.
۵. انتخاب حساب را لغو کنید؛ پیام قابل‌فهم ببینید، نه موفقیت ساختگی.
۶. ورود ایمیلی، تأیید و بازیابی قبلی را دوباره تست کنید.

تست‌های محلی جای ورود واقعی Google و تنظیمات داشبورد را نمی‌گیرند. در این مرحله Client Secret ابری تنظیم نشده، حساب Google واقعی انتخاب نشده و ایمیل واقعی ارسال نشده است.
اتصال ابزار مرورگر در محیط این بررسی برقرار نشد؛ تست DOM و نسخهٔ production جایگزین شده‌اند.

مرجع: [Google در Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)، [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)، [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
