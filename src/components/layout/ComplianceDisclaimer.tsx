import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
                <strong className="text-foreground">إخلاء مسؤولية:</strong> Visafaster (عطلات رحلاتكم) موقع خاص يقدم خدمات استشارية ومساعدة في تجهيز ملفات التأشيرات مقابل رسوم إضافية. نحن لسنا جهة حكومية ولا نتبع لأي سفارة أو وزارة.
              </p>
              <p>
                <strong className="text-foreground">شفافية الرسوم:</strong> الرسوم المدفوعة لنا هي مقابل خدمة التنسيق والاستشارة وتجهيز الملف، وليست رسوم التأشيرة الحكومية الرسمية. يمكن للعميل الحصول على التأشيرة مباشرة من خلال الموقع الحكومي الرسمي بتكلفة أقل أو مجاناً.
              </p>
              <p>
                <Link to="/official-embassies" className="font-semibold text-brand hover:underline">
                  اطّلع على روابط المواقع الرسمية للسفارات والوزارات →
                </Link>
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-foreground">Disclaimer:</strong> Visafaster is a private agency providing consultancy and visa file preparation services for a fee. We are not a government entity or affiliated with any embassy or ministry.
              </p>
              <p>
                <strong className="text-foreground">Fee transparency:</strong> Fees paid to us are for coordination, consultancy and file preparation services — not the official government visa fees. Visas can be obtained directly through the official government website at a lower cost or for free.
              </p>
              <p>
                <Link to="/official-embassies" className="font-semibold text-brand hover:underline">
                  View official embassy and ministry links →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}