import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Info, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import SARSymbol from '@/components/ui/SARSymbol';

interface PriceSummaryCardProps {
  className?: string;
  showDetails?: boolean;
  onNext?: () => void;
  canProceed?: boolean;
  nextLabel?: string;
}

export default function PriceSummaryCard({ className, showDetails = true, onNext, canProceed, nextLabel }: PriceSummaryCardProps) {
  const { t, direction } = useLanguage();
  const { applicationData, calculateTotal } = useApplication();
  const { serviceTotal, governmentTotal, grandTotal, breakdown } = calculateTotal();
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  
  const { travelers, visaFeesIncluded, visaTypeName, countryName, priceNotes, priceNotesEn } = applicationData;
  
  // Get the appropriate price note based on language
  const displayPriceNote = direction === 'rtl' 
    ? (priceNotes || (visaFeesIncluded ? 'شامل رسوم التأشيرة' : 'الرسوم الحكومية تُدفع مباشرة للجهة الرسمية ولا تدخل في الإجمالي'))
    : (priceNotesEn || (visaFeesIncluded ? 'Visa fees included' : 'Government fees are paid directly to the official authority and excluded from the total'));
  
  const totalTravelers = travelers.adults + travelers.children + travelers.infants;

  return (
    <div className={cn("bg-card border border-border rounded-3xl p-3 sm:p-4 shadow-lg shadow-navy/5", className)}>
      <h3 className="font-heading-ar font-black text-base sm:text-lg mb-2 text-navy">{t('payment.summary')}</h3>

      {countryName && (
        <div className="mb-2 p-2.5 bg-gradient-to-br from-navy/5 to-brand/5 rounded-2xl border border-navy/10">
          <div className="text-xs sm:text-sm text-muted-foreground">{t('form.country')}</div>
          <div className="font-bold text-navy text-base sm:text-lg">{countryName}</div>
          {visaTypeName && (
            <div className="text-xs sm:text-sm mt-1 text-muted-foreground">{visaTypeName}</div>
          )}
        </div>
      )}
      
      {showDetails && (
        <>
          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
            {travelers.adults > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.adult')} × {travelers.adults}
                </span>
                <span className="font-numeric font-bold tabular-nums flex items-center gap-1">
                  {breakdown.adults.toLocaleString()}
                  <SARSymbol size="xs" />
                </span>
              </div>
            )}
            {travelers.children > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.child')} × {travelers.children}
                </span>
                <span className="font-numeric font-bold tabular-nums flex items-center gap-1">
                  {breakdown.children.toLocaleString()}
                  <SARSymbol size="xs" />
                </span>
              </div>
            )}
            {travelers.infants > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  {t('pricing.infant')} × {travelers.infants}
                </span>
                <span className="font-numeric font-bold tabular-nums flex items-center gap-1">
                  {breakdown.infants.toLocaleString()}
                  <SARSymbol size="xs" />
                </span>
              </div>
            )}
          </div>
          
          <Separator className="my-2 sm:my-3" />
          
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-muted-foreground">
              {direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}
            </span>
            <span className="font-numeric font-bold tabular-nums flex items-center gap-1">
              {serviceTotal.toLocaleString()}
              <SARSymbol size="xs" />
            </span>
          </div>
          
          {!visaFeesIncluded && governmentTotal > 0 && (
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-muted-foreground">
                {direction === 'rtl' ? 'رسوم التأشيرة (تقديرية)' : 'Visa Fees (estimated)'}
              </span>
              <span className="font-numeric font-bold tabular-nums flex items-center gap-1">
                {governmentTotal.toLocaleString()}
                <SARSymbol size="xs" />
              </span>
            </div>
          )}
        </>
      )}
      
      <Separator className="my-2 sm:my-3" />
      
      <div className="flex justify-between items-center bg-navy text-white -mx-1 px-3 py-2 rounded-2xl">
        <span className="font-bold text-base sm:text-lg">{t('pricing.total')}</span>
        <span className="font-numeric font-extrabold text-lg sm:text-xl tabular-nums flex items-center gap-1">
          {grandTotal.toLocaleString()}
          <SARSymbol size="md" className="text-white" />
        </span>
      </div>
      
      <div className="mt-2 sm:mt-3">
        {visaFeesIncluded ? (
          <Badge variant="secondary" className="w-full justify-center py-1.5 sm:py-2 text-xs sm:text-sm bg-accent/20 text-accent-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2" />
            {displayPriceNote}
          </Badge>
        ) : (
          <Badge variant="secondary" className="w-full justify-center py-1.5 sm:py-2 text-xs sm:text-sm bg-warning/20 text-warning-foreground">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2" />
            {displayPriceNote}
          </Badge>
        )}
      </div>
      
      {totalTravelers > 0 && !onNext && (
        <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-muted-foreground">
          {direction === 'rtl' 
            ? `${totalTravelers} مسافر`
            : `${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}`
          }
        </div>
      )}

      {onNext && (
        <Button
          type="button"
          size="lg"
          className="w-full h-10 mt-3 gap-2 text-sm sm:text-base"
          onClick={onNext}
          disabled={!canProceed}
        >
          <span>{nextLabel || (direction === 'rtl' ? 'التالي' : 'Next')}</span>
          <ArrowNextIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
