import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import SARSymbol from '@/components/ui/SARSymbol';
import type { Country, VisaType } from '@/types/database';

interface VisaCardProps {
  visa: VisaType;
  country: Country;
}

export function VisaCard({ visa, country }: VisaCardProps) {
  const { direction } = useLanguage();
  const [showAllRequirements, setShowAllRequirements] = useState(false);
  
  const requirements = Array.isArray(visa.requirements) ? visa.requirements as string[] : [];
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  
  const visibleRequirements = showAllRequirements 
    ? requirements 
    : requirements.slice(0, 3);
  
  const hasMoreRequirements = requirements.length > 3;

  return (
    <Card className="flex flex-col rounded-3xl border-border bg-card hover:shadow-2xl hover:shadow-navy/5 hover:border-brand/30 hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-heading-ar text-xl font-extrabold text-navy">{visa.name}</CardTitle>
            <CardDescription className="mt-1 font-body-ar">
              {visa.description || (direction === 'rtl' 
                ? `تأشيرة ${visa.name} إلى ${country.name}`
                : `${visa.name} to ${country.name}`
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize rounded-xl border-border font-jakarta text-[10px] font-bold">
            {visa.entry_type === 'single' 
              ? (direction === 'rtl' ? 'دخول واحد' : 'Single Entry')
              : (direction === 'rtl' ? 'دخول متعدد' : 'Multiple Entry')
            }
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-cream/60 p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-brand mb-1" />
            <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {direction === 'rtl' ? 'المعالجة' : 'Processing'}
            </p>
            <p className="font-display font-bold text-navy text-lg mt-1">
              {visa.processing_days} {direction === 'rtl' ? 'يوم' : 'days'}
            </p>
          </div>
          <div className="rounded-2xl bg-cream/60 p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-brand mb-1" />
            <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {direction === 'rtl' ? 'الصلاحية' : 'Validity'}
            </p>
            <p className="font-display font-bold text-navy text-lg mt-1">
              {visa.validity_days || '-'} {direction === 'rtl' ? 'يوم' : 'days'}
            </p>
          </div>
        </div>

        {/* Requirements */}
        {requirements.length > 0 && (
          <div>
            <p className="font-heading-ar text-sm font-bold mb-2 text-navy">
              {direction === 'rtl' ? 'المتطلبات الأساسية:' : 'Key Requirements:'}
            </p>
            <ul className="space-y-1">
              {visibleRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-body-ar">
                  <CheckCircle2 className="h-4 w-4 text-brand mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            {hasMoreRequirements && (
              <button
                onClick={() => setShowAllRequirements(!showAllRequirements)}
                className="flex items-center gap-1 text-sm text-brand hover:text-brand/80 mt-2 transition-colors cursor-pointer font-jakarta font-bold"
              >
                {showAllRequirements ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    {direction === 'rtl' ? 'إخفاء المتطلبات' : 'Hide requirements'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {direction === 'rtl' 
                      ? `+${requirements.length - 3} متطلبات أخرى`
                      : `+${requirements.length - 3} more requirements`
                    }
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Price */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {direction === 'rtl' ? 'السعر يبدأ من' : 'Starting from'}
              </p>
              <p className="font-display text-3xl font-bold text-brand flex items-center gap-1">
                {visa.price}
                <SARSymbol size="md" className="text-brand" />
              </p>
              {/* Price Notes from Database */}
              <p className="text-xs text-muted-foreground mt-1 font-body-ar">
                {direction === 'rtl' 
                  ? (visa.price_notes || 'شامل رسوم التأشيرة')
                  : (visa.price_notes_en || 'Visa fees included')
                }
              </p>
            </div>
            <Button asChild className="rounded-2xl h-11 px-5 bg-navy hover:bg-navy/90 text-navy-foreground font-bold">
              <Link to={`/apply?country=${country.code}&visa=${visa.id}`}>
                {direction === 'rtl' ? 'قدّم الآن' : 'Apply Now'}
                <ArrowIcon className="h-4 w-4 ms-1 rtl-flip" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
