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

  const fullAr = 'هذا تطبيق تابع لوكالة سفر خاصة وليس تطبيقًا حكوميًا، ولا يمثل أو يتبع أو يحظى بتأييد أي سفارة أو قنصلية أو جهة حكومية. نقدم خدمات اختيارية مدفوعة لتجهيز ومراجعة ملفات الطلبات. لا نصدر التأشيرات ولا نضمن قبولها أو إصدارها، والقرار النهائي حصريًا للجهة الرسمية المختصة.';
  const fullEn = 'This app belongs to a private travel agency. It is not a government app and is not affiliated with, endorsed by, or representing any embassy, consulate or government entity. We provide optional paid services to prepare and review application files. We do not issue visas and do not guarantee their approval or issuance; the final decision rests solely with the competent official authority.';

  if (variant === 'banner') {
    return (
      <div className="w-full bg-muted/60 border-b border-border">
        <div className="container-section py-2.5 flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="text-foreground">{isRTL ? 'تنبيه:' : 'Notice:'}</strong>{' '}
            {isRTL ? fullAr : fullEn}{' '}
            <Link to="/official-embassies" className="font-semibold text-brand hover:underline">
              {isRTL ? 'روابط المواقع الحكومية الرسمية →' : 'Official government links →'}
            </Link>
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
                <strong className="text-foreground">إخلاء مسؤولية:</strong> {fullAr} تُشغَّل المنصة <span dir="ltr">{LEGAL.domain}</span> بواسطة {LEGAL.companyNameAr}.
              </p>
              <p>
                <strong className="text-foreground">شفافية الرسوم:</strong> رسوم خدمتنا منفصلة عن رسوم الجهات الحكومية، وأي رسوم حكومية تخضع لشروط وآلية الدفع التي تحددها الجهة الرسمية المختصة. يمكنك التقديم مباشرة عبر المواقع الحكومية الرسمية دون الاستعانة بنا.
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
                <strong className="text-foreground">Disclaimer:</strong> {fullEn} {LEGAL.domain} is operated by {LEGAL.companyNameEn}.
              </p>
              <p>
                <strong className="text-foreground">Fee transparency:</strong> Fees paid to us are for coordination, consultancy and file preparation — not the official government visa fees. Official services are available directly from government websites, typically at a lower cost or free.
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