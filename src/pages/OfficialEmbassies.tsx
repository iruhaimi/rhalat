import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Info } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { LEGAL } from '@/config/legal';

interface CountryRow {
  id: string;
  code: string;
  name: string;
}

// Curated mapping of country code → official visa/embassy portal.
// Editable here; not stored in DB to keep this list under code review.
const OFFICIAL_PORTALS: Record<string, string> = {
  FR: 'https://france-visas.gouv.fr/',
  DE: 'https://videx.diplo.de/',
  IT: 'https://vistoperitalia.esteri.it/',
  ES: 'https://www.exteriores.gob.es/',
  NL: 'https://www.netherlandsworldwide.nl/visa',
  GB: 'https://www.gov.uk/apply-uk-visa',
  US: 'https://travel.state.gov/content/travel/en/us-visas.html',
  CA: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
  JP: 'https://www.mofa.go.jp/j_info/visit/visa/',
  CN: 'https://bio.visaforchina.cn/',
  TR: 'https://www.evisa.gov.tr/',
  AE: 'https://smartservices.icp.gov.ae/',
  SA: 'https://visa.mofa.gov.sa/',
  CH: 'https://www.sem.admin.ch/sem/en/home/themen/einreise.html',
  AT: 'https://www.bmeia.gv.at/en/travel-stay/visa-information/',
  BE: 'https://dofi.ibz.be/en/themes/visa',
  GR: 'https://www.mfa.gr/en/visas/',
  PT: 'https://www.vfsglobal.com/Portugal/',
  IE: 'https://www.irishimmigration.ie/',
  AU: 'https://immi.homeaffairs.gov.au/',
  KR: 'https://www.visa.go.kr/',
  IN: 'https://indianvisaonline.gov.in/',
  TH: 'https://www.thaievisa.go.th/',
  EG: 'https://www.visa2egypt.gov.eg/',
  MA: 'https://www.consulat.ma/',
  RU: 'https://visa.kdmid.ru/',
};

export default function OfficialEmbassies() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ['countries-official-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as CountryRow[];
    },
  });

  return (
    <div className="container-section py-10 md:py-16">
      <SEO
        title={isRTL ? 'روابط المواقع الرسمية للسفارات' : 'Official Embassy Links'}
        description={isRTL
          ? 'قائمة بروابط المواقع الحكومية الرسمية للتقديم المباشر على التأشيرات.'
          : 'Official government visa portals for direct application.'}
        path="/official-embassies"
      />

      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
          {isRTL ? 'روابط المواقع الرسمية للسفارات والوزارات' : 'Official Embassy & Ministry Links'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {isRTL
            ? 'Visafaster وكالة خاصة مستقلة. يمكنك التقديم على التأشيرة مباشرة من خلال الموقع الحكومي الرسمي للدولة المعنية بتكلفة أقل أو مجاناً. نقدّم خدمات استشارية وتجهيز الملف اختيارياً مقابل رسوم.'
            : 'Visafaster is a private independent agency. You may apply for a visa directly through the official government portal of the relevant country, typically at a lower cost or free. Our consultancy and file-preparation services are optional and charged separately.'}
        </p>
      </header>

      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-8 flex items-start gap-3">
        <Info className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          {isRTL
            ? 'هذه الروابط للمواقع الرسمية للسفارات والوزارات. لا تتحمل Visafaster مسؤولية محتوى هذه المواقع الخارجية.'
            : 'These are external official embassy and ministry websites. Visafaster is not responsible for their content.'}
        </p>
      </div>

      {/* Saudi MoFA highlight — required reference link for KSA users */}
      <a
        href={LEGAL.mofaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-8 flex items-center justify-between gap-3 rounded-xl border-2 border-primary/40 bg-primary/5 p-5 hover:bg-primary/10 transition-colors"
      >
        <div>
          <div className="font-bold text-foreground text-base mb-1">
            {isRTL ? 'وزارة الخارجية السعودية — الخدمات القنصلية' : 'Saudi Ministry of Foreign Affairs — Consular Services'}
          </div>
          <div className="text-xs text-muted-foreground">
            {isRTL
              ? 'البوابة الرسمية للمواطنين والمقيمين السعوديين'
              : 'Official portal for Saudi citizens and residents'}
          </div>
        </div>
        <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" />
      </a>

      {isLoading ? (
        <div className="text-muted-foreground">{isRTL ? 'جارٍ التحميل...' : 'Loading...'}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {countries.map((c) => {
            const url = OFFICIAL_PORTALS[c.code?.toUpperCase()];
            const displayName = c.name;
            return (
              <a
                key={c.id}
                href={url || `https://www.google.com/search?q=${encodeURIComponent(c.name + ' official visa government website')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 hover:border-brand hover:shadow-sm transition-all min-h-[60px]"
              >
                <span className="font-semibold text-foreground">{displayName}</span>
                <span className="flex items-center gap-1.5 text-xs text-brand font-medium">
                  {url ? (isRTL ? 'الموقع الرسمي' : 'Official site') : (isRTL ? 'ابحث' : 'Search')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}