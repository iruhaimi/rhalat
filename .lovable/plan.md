## المشكلة
شغّلت الأوامر من مجلد الـ Home (`~`) وليس من داخل مجلد المشروع، لذلك:
- `git pull` فشل → لا يوجد مستودع git هنا
- `npm run build` فشل → لا يوجد `package.json` فيه script باسم build
- `npx cap` فشل → لا يوجد إعداد Capacitor

## الحل
تحتاج أولاً الدخول إلى مجلد المشروع. إذا كنت قد استنسخت المشروع سابقاً من GitHub، ابحث عن مجلده. الأسماء الشائعة:

```bash
ls ~/Documents
ls ~/Desktop
ls ~
```

ابحث عن مجلد باسم مثل `visafaster` أو `rahala` أو اسم مستودعك على GitHub.

### إذا وجدت المجلد
```bash
cd ~/Documents/visafaster    # أو المسار الصحيح
git pull
npm install
npm run build
npx cap sync ios
npx cap open ios
```

### إذا لم يكن المشروع مستنسخاً بعد
اذهب إلى GitHub → مستودع مشروعك → زر **Code** → انسخ رابط HTTPS، ثم:

```bash
cd ~/Documents
git clone <الرابط>
cd <اسم-المجلد>
npm install
npx cap add ios          # فقط أول مرة
npm run build
npx cap sync ios
npx cap open ios
```

## سؤال
هل استنسخت المشروع من GitHub على الماك من قبل، أم هذه أول مرة؟ إذا كانت أول مرة، شارك اسم مستودعك على GitHub (username/repo) وسأعطيك الأوامر جاهزة بالكامل.
