import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Clock3, BadgeCheck, ArrowLeft, MessageCircle, FileCheck2, Plane, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SEO from "@/components/seo/SEO";
import { trackConversion } from "@/lib/gtagEvents";

import heroImg from "@/assets/ads/ad-landscape-schengen.jpg";
import passportImg from "@/assets/ads/ad-square-passport.jpg";
import ukImg from "@/assets/ads/ad-square-uk.jpg";
import teamImg from "@/assets/ads/ad-square-team.jpg";

const WHATSAPP_PHONE = "966562525665";
const WHATSAPP_MESSAGE = "مرحباً، أرغب في الاستفسار عن خدمات التأشيرات";
const WHATSAPP = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const destinations = [
  { name: "تأشيرة شنغن", img: heroImg, to: "/destinations" },
  { name: "تأشيرة بريطانيا", img: ukImg, to: "/destinations" },
  { name: "تأشيرة أمريكا", img: passportImg, to: "/destinations" },
];

const steps = [
  { icon: FileCheck2, title: "ارفع مستنداتك", desc: "خطوات بسيطة عبر الموقع — أقل من 5 دقائق." },
  { icon: UserCheck, title: "يراجعها فريقنا", desc: "خبراء معتمدون يتأكدون من اكتمال طلبك قبل التقديم." },
  { icon: Plane, title: "استلم تأشيرتك", desc: "متابعة مباشرة حتى وصول التأشيرة إلى بريدك." },
];

const faqs = [
  { q: "كم تستغرق معالجة طلب التأشيرة؟", a: "يختلف حسب الدولة، لكن نبدأ المراجعة خلال 24 ساعة من استلام المستندات." },
  { q: "هل يوجد ضمان استرداد؟", a: "نعم — في حال عدم تقديم طلبك للسفارة لأي سبب يخصنا، نسترد الرسوم الخدمية كاملة." },
  { q: "هل تتعاملون مع جميع الجنسيات في السعودية؟", a: "نعم، نخدم المقيمين والمواطنين على حد سواء بشرط استيفاء متطلبات السفارة." },
  { q: "كيف أتابع طلبي؟", a: "عبر صفحة (متابعة الطلب) باستخدام رقم الطلب الذي يصلك على الواتساب والبريد." },
  { q: "هل بياناتي آمنة؟", a: "نلتزم بنظام حماية البيانات الشخصية (PDPL) السعودي، والمستندات الحساسة تُخزن داخل المملكة." },
];

export default function LandingVisa() {
  useEffect(() => {
    // Page view as a soft lead signal for the ad audience
    trackConversion("generate_lead", { value: 0, lp_source: "google_ads_visa" } as any);
  }, []);

  const handleCtaClick = (label: string) => {
    trackConversion("generate_lead", { value: 0, cta: label } as any);
  };

  const handleWhatsApp = () => {
    trackConversion("generate_lead", { value: 0, channel: "whatsapp" } as any);
    // Escape iframe (preview / Despia wrapper) so the WhatsApp deep-link actually opens
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = WHATSAPP;
        return;
      }
    } catch {
      // cross-origin top — fall through to window.open
    }
    window.open(WHATSAPP, "_blank", "noopener,noreferrer");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SEO
        title="تأشيرات أوروبا وبريطانيا وأمريكا | معالجة سريعة وموثوقة"
        description="خدمة تقديم طلبات التأشيرات للسعوديين والمقيمين — مراجعة احترافية، متابعة مباشرة، وضمان استرداد. ابدأ طلبك خلال 5 دقائق."
        path="/lp/visa"
      />

      {/* Minimal Top Bar */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-primary text-lg">عطلات رحلاتكم</Link>
          <a
            href="tel:+966500000000"
            className="text-sm text-muted-foreground hover:text-primary transition"
          >
            اتصل بنا
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="وجهات أوروبا"
            className="w-full h-full object-cover opacity-30"
            width={1200}
            height={628}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/85 to-background/60" />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span>معتمدون</span>
              <span className="text-muted-foreground" aria-hidden="true">|</span>
              <span>أكثر من 10,000 طلب ناجح</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              تأشيرتك القادمة <span className="text-primary">بأيدٍ أمينة</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              نتولى عنك تجهيز ومراجعة طلب التأشيرة بالكامل — شنغن، بريطانيا، أمريكا، وأكثر.
              متابعة مباشرة حتى وصول التأشيرة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="text-base"
                onClick={() => handleCtaClick("hero_start")}
              >
                <Link to="/apply">
                  ابدأ طلبك الآن
                  <ArrowLeft className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={handleWhatsApp} className="text-base">
                <MessageCircle className="ms-2 h-4 w-4" />
                تحدث معنا واتساب
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Clock3, t: "معالجة سريعة", d: "مراجعة طلبك خلال 24 ساعة" },
            { icon: ShieldCheck, t: "خصوصية كاملة", d: "بياناتك محمية وفق نظام PDPL السعودي" },
            { icon: BadgeCheck, t: "ضمان استرداد", d: "نسترد رسوم الخدمة إن لم نقدّم لك" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{t}</div>
                <div className="text-sm text-muted-foreground">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">الوجهات الأكثر طلباً</h2>
          <p className="text-muted-foreground">نُقدّم طلبك بدقة وفق متطلبات كل سفارة</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destinations.map((d) => (
            <Card key={d.name} className="overflow-hidden group">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={d.img}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={1200}
                  height={900}
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-3">{d.name}</h3>
                <Button
                  asChild
                  className="w-full"
                  variant="outline"
                  onClick={() => handleCtaClick(`destination_${d.name}`)}
                >
                  <Link to={d.to}>ابدأ الطلب</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">كيف نعمل؟</h2>
            <p className="text-muted-foreground">3 خطوات بسيطة وتأشيرتك في الطريق</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <Card key={s.title} className="p-6 text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                  {i + 1}
                </div>
                <s.icon className="mx-auto h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Trust */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden">
            <img
              src={teamImg}
              alt="فريق الدعم"
              className="w-full h-full object-cover"
              loading="lazy"
              width={1200}
              height={1200}
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">فريق متخصص يرافقك خطوة بخطوة</h2>
            <p className="text-muted-foreground mb-6">
              مستشارو تأشيرات معتمدون يراجعون كل مستند، يجاوبون أسئلتك خلال دقائق،
              ويتابعون طلبك من أول خطوة إلى استلام التأشيرة.
            </p>
            <Button size="lg" onClick={handleWhatsApp}>
              <MessageCircle className="ms-2 h-4 w-4" />
              ابدأ محادثة مع مختص
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">أسئلة شائعة</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="bg-background rounded-lg border p-4 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز تبدأ طلبك؟</h2>
          <p className="text-lg mb-8 opacity-90">انضم لآلاف العملاء الذين ضمنوا تأشيراتهم معنا</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="secondary" onClick={() => handleCtaClick("final_start")}>
              <Link to="/apply">
                ابدأ طلبك الآن
                <ArrowLeft className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={handleWhatsApp}>
              <MessageCircle className="ms-2 h-4 w-4" />
              واتساب
            </Button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          © {new Date().getFullYear()} عطلات رحلاتكم ·{" "}
          <Link to="/privacy" className="hover:text-primary">سياسة الخصوصية</Link> ·{" "}
          <Link to="/terms" className="hover:text-primary">الشروط</Link>
        </div>
      </footer>
    </div>
  );
}