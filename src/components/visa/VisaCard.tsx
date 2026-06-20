import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Calendar, Repeat, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import SARSymbol from '@/components/ui/SARSymbol';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Country, VisaType } from '@/types/database';

interface VisaCardProps {
  visa: VisaType;
  country: Country;
  variant?: 'primary' | 'alternative';
}

export function VisaCard({ visa, country, variant = 'alternative' }: VisaCardProps) {
  const { direction } = useLanguage();
  const [open, setOpen] = useState(false);

  const requirements = Array.isArray(visa.requirements) ? (visa.requirements as string[]) : [];
  const topRequirements = requirements.slice(0, 4);
  const isRTL = direction === 'rtl';
  const isPrimary = variant === 'primary';

  const entryLabel =
    visa.entry_type === 'single'
      ? isRTL ? 'دخول واحد' : 'Single Entry'
      : isRTL ? 'دخول متعدد' : 'Multiple Entry';

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col lg:flex-row hover:shadow-xl hover:shadow-navy/5 transition-all duration-300">
      {/* Right (RTL) side: identity + price + CTA */}
      <div
        className={cn(
          'lg:w-1/3 p-8 lg:p-10 flex flex-col justify-between',
          isPrimary
            ? 'bg-navy text-navy-foreground'
            : 'bg-cream/60 border-b lg:border-b-0 lg:border-s border-border'
        )}
      >
        <div>
          <h3
            className={cn(
              'font-heading-ar text-2xl font-extrabold mb-2',
              isPrimary ? 'text-white' : 'text-navy'
            )}
          >
            {visa.name}
          </h3>
          <p
            className={cn(
              'font-body-ar text-sm leading-relaxed mb-6',
              isPrimary ? 'text-white/70' : 'text-muted-foreground'
            )}
          >
            {visa.description ||
              (isRTL ? `تأشيرة ${visa.name} إلى ${country.name}` : `${visa.name} to ${country.name}`)}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span
              className={cn(
                'font-jakarta text-[10px] font-bold uppercase tracking-wider',
                isPrimary ? 'text-white/60' : 'text-muted-foreground'
              )}
            >
              {isRTL ? 'رسوم الخدمة' : 'Service fee'}
            </span>
            <span
              className={cn(
                'font-display text-3xl font-extrabold flex items-center gap-1',
                isPrimary ? 'text-white' : 'text-navy'
              )}
            >
              {visa.price}
              <SARSymbol size="sm" className={isPrimary ? 'text-white' : 'text-navy'} />
            </span>
          </div>
          <p
            className={cn(
              'text-xs font-body-ar',
              isPrimary ? 'text-white/50' : 'text-muted-foreground'
            )}
          >
            {isRTL ? visa.price_notes || 'شامل رسوم التأشيرة' : visa.price_notes_en || 'Visa fees included'}
          </p>

          <Button
            asChild
            className={cn(
              'w-full rounded-2xl h-12 font-bold text-base',
              isPrimary
                ? 'bg-brand hover:bg-brand/90 text-white'
                : 'bg-navy hover:bg-navy/90 text-navy-foreground'
            )}
          >
            <Link to={`/apply?country=${country.code}&visa=${visa.id}`}>
              {isRTL ? 'تقديم الطلب الآن' : 'Apply Now'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Left (RTL) side: details + requirements */}
      <div className="flex-1 p-8 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Visa details */}
          <div>
            <h4 className="font-jakarta text-[11px] font-bold uppercase tracking-[0.2em] text-brand mb-5">
              {isRTL ? 'تفاصيل التأشيرة' : 'Visa Details'}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 font-body-ar">
                <Clock className="h-4 w-4 text-brand flex-shrink-0" />
                <span className="text-sm text-foreground">
                  <strong className="font-bold text-navy">{isRTL ? 'المعالجة:' : 'Processing:'}</strong>{' '}
                  {visa.processing_days} {isRTL ? 'أيام عمل' : 'business days'}
                </span>
              </li>
              {visa.validity_days && (
                <li className="flex items-center gap-3 font-body-ar">
                  <Calendar className="h-4 w-4 text-brand flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    <strong className="font-bold text-navy">{isRTL ? 'الصلاحية:' : 'Validity:'}</strong>{' '}
                    {visa.validity_days} {isRTL ? 'يوم' : 'days'}
                  </span>
                </li>
              )}
              <li className="flex items-center gap-3 font-body-ar">
                <Repeat className="h-4 w-4 text-brand flex-shrink-0" />
                <span className="text-sm text-foreground">
                  <strong className="font-bold text-navy">{isRTL ? 'الدخول:' : 'Entry:'}</strong>{' '}
                  {entryLabel}
                </span>
              </li>
              {visa.max_stay_days && (
                <li className="flex items-center gap-3 font-body-ar">
                  <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    <strong className="font-bold text-navy">{isRTL ? 'مدة الإقامة:' : 'Max stay:'}</strong>{' '}
                    {visa.max_stay_days} {isRTL ? 'يوم' : 'days'}
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="font-jakarta text-[11px] font-bold uppercase tracking-[0.2em] text-brand mb-5">
              {isRTL ? 'المتطلبات الأساسية' : 'Key Requirements'}
            </h4>
            {topRequirements.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topRequirements.map((req, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs font-body-ar font-medium bg-cream/40 p-2.5 rounded-xl border border-border"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand flex-shrink-0" />
                      <span className="text-foreground truncate" title={req}>
                        {req}
                      </span>
                    </div>
                  ))}
                </div>
                {requirements.length > 4 && (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <button className="mt-5 text-sm font-jakarta font-bold text-brand hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {isRTL
                          ? `عرض كل المستندات (${requirements.length})`
                          : `View all documents (${requirements.length})`}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg" dir={direction}>
                      <DialogHeader>
                        <DialogTitle className="font-heading-ar text-navy">
                          {isRTL ? `المستندات المطلوبة — ${visa.name}` : `Required Documents — ${visa.name}`}
                        </DialogTitle>
                      </DialogHeader>
                      <ul className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                        {requirements.map((req, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 font-body-ar text-sm text-foreground"
                          >
                            <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : (
              <p className="font-body-ar text-sm text-muted-foreground">
                {isRTL
                  ? 'سيتم عرض المتطلبات الكاملة أثناء عملية التقديم.'
                  : 'Full requirements shown during application.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
