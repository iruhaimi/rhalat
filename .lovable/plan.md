
# تغيير شعار الموقع

استبدال الشعار الحالي (`src/assets/logo.jpeg`) بالشعار الجديد المرفوع.

## الخطوات
1. نسخ الصورة المرفوعة إلى `src/assets/logo.png`.
2. تحديث الاستيراد في:
   - `src/components/layout/HeaderArabic.tsx`
   - `src/components/layout/FooterArabic.tsx`
   ليشير إلى `@/assets/logo.png` بدلاً من `logo.jpeg`.
3. حذف الملف القديم `src/assets/logo.jpeg`.

## ما لن يتغير
- شكل الـ Header/Footer أو الأحجام.
- الـ favicon (لم يُطلب تغييره).
