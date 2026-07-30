import { Link } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import { LEGAL } from '@/config/legal';
import { Button } from '@/components/ui/button';
import {
  UserX,
  ShieldCheck,
  Mail,
  LogIn,
  Settings,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
} from 'lucide-react';

const STEPS = [
  { icon: LogIn, title: 'سجّل الدخول إلى حسابك', desc: 'ادخل إلى حسابك في تطبيق أو موقع عطلات رحلاتكم باستخدام بيانات الدخول الخاصة بك.' },
  { icon: Settings, title: 'انتقل إلى «الملف الشخصي» أو «إعدادات الحساب»', desc: 'افتح القائمة الرئيسية ثم اختر الملف الشخصي أو إعدادات الحساب.' },
  { icon: Trash2, title: 'اختر «حذف الحساب»', desc: 'ستجد الخيار ضمن قسم إدارة الحساب في أسفل الصفحة.' },
  { icon: CheckCircle2, title: 'قم بتأكيد عملية الحذف', desc: 'أكِّد الطلب في نافذة التأكيد. بعد التأكيد سيتم حذف الحساب بشكل نهائي.' },
];

const CONSEQUENCES = [
  { icon: UserX, text: 'يتم حذف الحساب نهائياً.' },
  { icon: Lock, text: 'يتم حذف المعلومات الشخصية من الأنظمة التشغيلية.' },
  { icon: LogIn, text: 'يتم إنهاء جميع جلسات تسجيل الدخول.' },
  { icon: FileText, text: 'قد يتم الاحتفاظ ببعض البيانات لفترة محددة إذا كان الاحتفاظ بها مطلوباً بموجب الأنظمة أو لأغراض محاسبية أو قانونية أو لمنع الاحتيال.' },
  { icon: Clock, text: 'بعد انتهاء مدة الاحتفاظ النظامية يتم حذف تلك البيانات.' },
];

const FAQS = [
  {
    q: 'كم تستغرق عملية حذف الحساب؟',
    a: 'يتم تنفيذ طلب حذف الحساب مباشرة أو خلال مدة معالجة معقولة.',
  },
  {
    q: 'هل يمكن استعادة الحساب بعد حذفه؟',
    a: 'لا، بعد حذف الحساب لا يمكن استعادته.',
  },
  {
    q: 'هل سيتم حذف جميع بياناتي؟',
    a: 'يتم حذف بيانات الحساب من الأنظمة التشغيلية، وقد يتم الاحتفاظ ببعض البيانات فقط إذا كان ذلك مطلوباً بموجب الأنظمة أو اللوائح المعمول بها.',
  },
];

export default function DeleteAccount() {
  const supportEmail = LEGAL.supportEmail;

  return (
    <div dir="rtl" className="bg-background">
      <SEO
        title="حذف الحساب | VisaFaster"
        description="تعرف على كيفية حذف حسابك في VisaFaster وما هي البيانات التي يتم حذفها أو الاحتفاظ بها وفقاً للأنظمة."
        path="/delete-account"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />

      {/* Hero */}
      <header className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container-section py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <UserX className="h-7 w-7 text-primary" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-3xl font-bold text-foreground md:text-4xl">حذف حسابك</h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              يمكنك حذف حسابك نهائياً في أي وقت، مع معرفة ما الذي سيتم حذفه وما الذي قد يتم الاحتفاظ به
              وفقاً للأنظمة المعمول بها.
            </p>
          </div>
        </div>
      </header>

      <div className="container-section py-10 md:py-14">
        <div className="mx-auto max-w-3xl space-y-10">
          {/* Steps */}
          <section aria-labelledby="in-app-steps">
            <h2 id="in-app-steps" className="text-xl font-bold text-foreground md:text-2xl">
              حذف الحساب من داخل التطبيق
            </h2>
            <ol className="mt-6 space-y-4">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      <step.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
              بعد تأكيد الطلب سيتم حذف الحساب بشكل نهائي ولا يمكن التراجع عن هذه العملية.
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link to="/profile">الانتقال إلى الملف الشخصي</Link>
              </Button>
            </div>
          </section>

          {/* What happens */}
          <section aria-labelledby="after-deletion">
            <h2 id="after-deletion" className="text-xl font-bold text-foreground md:text-2xl">
              ماذا يحدث بعد حذف الحساب؟
            </h2>
            <ul className="mt-6 space-y-3">
              {CONSEQUENCES.map((item) => (
                <li
                  key={item.text}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-foreground">{item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Cannot sign in */}
          <section aria-labelledby="no-access">
            <h2 id="no-access" className="text-xl font-bold text-foreground md:text-2xl">
              إذا لم تتمكن من تسجيل الدخول
            </h2>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                إذا لم تتمكن من الوصول إلى حسابك، يمكنك طلب حذف الحساب عن طريق التواصل مع فريق الدعم،
                وسنقوم بالتحقق من هويتك قبل تنفيذ الطلب.
              </p>
              <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent('طلب حذف الحساب')}`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span dir="ltr">{supportEmail}</span>
              </a>
            </div>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq">
            <h2 id="faq" className="text-xl font-bold text-foreground md:text-2xl">
              الأسئلة الشائعة
            </h2>
            <dl className="mt-6 space-y-4">
              {FAQS.map((f) => (
                <div key={f.q} className="rounded-2xl border border-border bg-card p-5">
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Legal links */}
          <nav
            aria-label="روابط قانونية"
            className="flex flex-col items-center gap-3 border-t border-border pt-8 sm:flex-row sm:justify-center sm:gap-6"
          >
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              سياسة الخصوصية
            </Link>
            <Link
              to="/terms"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              الشروط والأحكام
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}