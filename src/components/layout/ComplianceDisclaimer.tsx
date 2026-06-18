import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LEGAL } from '@/config/legal';

/**
 * Google Ads compliance disclaimer banner.
 * Required for non-government visa service providers (policy 2026).
 * Includes: independent-identity, service-nature, fee-transparency, official-link.
 */
export default function ComplianceDisclaimer({ variant = 'banner' }: { variant?: 'banner' | 'footer' }) {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  if (variant === 'banner') {
    return (
      <div className="w-full bg-muted/60 border-b border-border">
        <div className="container-section py-2.5 flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand" aria-hidden="true" />
          <p className="leading-relaxed">
            {isRTL ? (
              <>
                <strong className="text-foreground">Visafaster</strong> وكالة خاصة مستقلة تقدّم خدمات استشارية وتجهيز ملفات التأشيرات مقابل رسوم. لسنا جهة حكومية ولا تابعين لأي سفارة.{' '}
                <Link to="/official-embassies" className="font-semibold text-brand hover:underline">
                  روابط المواقع الرسمية للسفارات →
                </Link>
              </>
            ) : (
              <>
                <strong className="text-foreground">Visafaster</strong> is a private independent agency providing consultancy and visa file preparation for a fee. We are not a government entity or affiliated with any embassy.{' '}
                <Link to="/official-embassies" className="font-semibold text-brand hover:underline">
                  Official embassy links →
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Footer variant — full 4-element disclaimer
  return (
    <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-brand" aria-hidden="true" />
        <div className="space-y-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
          {isRTL ? (
            <>
              <p>
                <strong className="text-foreground">إخلاء مسؤولية:</strong> موقع <span dir="ltr">{LEGAL.domain}</span> هو منصة تابعة لـ {LEGAL.companyNameAr}، مرخصة من وزارة السياحة السعودية برقم <span dir="ltr" className="tabular-nums">{LEGAL.tourismLicense}</span> وسجل تجاري رقم <span dir="ltr" className="tabular-nums">{LEGAL.commercialRegistration}</span>. نحن وكالة سفر خاصة تقدم خدمات استشارية ومساعدة في تجهيز ملفات التأشيرة مقابل رسوم إضافية، ولسنا جهة حكومية أو تابعة لأي سفارة.
              </p>
              <p>
                <strong className="text-foreground">شفافية الرسوم:</strong> الرسوم المدفوعة لنا هي مقابل خدمة التنسيق والاستشارة وتجهيز الملف، وليست رسوم التأشيرة الحكومية الرسمية. يمكنك الحصول على التأشيرة مباشرة عبر المواقع الحكومية الرسمية بتكلفة أقل أو مجاناً.
              </p>
              <p>
                <strong className="text-foreground">الرقم الضريبي (VAT):</strong>{' '}
                <span dir="ltr" className="tabular-nums">{LEGAL.vatNumber}</span>
              </p>
              <p>
                <Link to="/official-embassies" className="font-semibold text-brand hover:underline">
                  روابط المواقع الرسمية للسفارات
                </Link>
                <span className="mx-2">·</span>
                <a
                  href={LEGAL.mofaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand hover:underline"
                >
                  وزارة الخارجية السعودية ↗
                </a>
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-foreground">Disclaimer:</strong> {LEGAL.domain} is operated by {LEGAL.companyNameEn}, a private agency licensed by the Saudi Ministry of Tourism (License #<span className="tabular-nums">{LEGAL.tourismLicense}</span>) and Commercial Registration #<span className="tabular-nums">{LEGAL.commercialRegistration}</span>. We provide third-party consultancy and visa application assistance for a fee and are not affiliated with any government or embassy.
              </p>
              <p>
                <strong className="text-foreground">Fee transparency:</strong> Fees paid to us are for coordination, consultancy and file preparation — not the official government visa fees. Official services are available directly from government websites, typically at a lower cost or free.
              </p>
              <p>
                <strong className="text-foreground">VAT Registration:</strong>{' '}
                <span className="tabular-nums">{LEGAL.vatNumber}</span>
              </p>
              <p>
                <Link to="/official-embassies" className="font-semibold text-brand hover:underline">
                  Official embassy links
                </Link>
                <span className="mx-2">·</span>
                <a
                  href={LEGAL.mofaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand hover:underline"
                >
                  Saudi MoFA ↗
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}