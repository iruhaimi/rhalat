import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import PathChoiceCard from '@/components/apply/PathChoiceCard';
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Image, 
  CreditCard, 
  Building, 
  Plane, 
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const requirementIcons: Record<string, any> = {
  passport: FileText,
  photo: Image,
  bank_statement: CreditCard,
  hotel_booking: Building,
  flight_booking: Plane,
  travel_insurance: Shield,
  default: FileText,
};

const defaultRequirements = [
  { id: 'passport', key: 'requirements.passport', icon: 'passport', forAll: true },
  { id: 'photo', key: 'requirements.photo', icon: 'photo', forAll: true },
  { id: 'bank_statement', key: 'requirements.bankStatement', icon: 'bank_statement', forAdult: true },
  { id: 'hotel_booking', key: 'requirements.hotelBooking', icon: 'hotel_booking', forAll: true },
  { id: 'flight_booking', key: 'requirements.flightBooking', icon: 'flight_booking', forAll: true },
  { id: 'travel_insurance', key: 'requirements.travelInsurance', icon: 'travel_insurance', forAll: true },
];

export default function Step3Requirements() {
  const { t, direction } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep, setShowAuthGate } = useApplication();
  const { user } = useAuth();
  const [showPathChoice, setShowPathChoice] = useState(false);
  
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Fetch visa type requirements
  const { data: visaType } = useQuery({
    queryKey: ['visa-type-requirements', applicationData.visaTypeId],
    queryFn: async () => {
      if (!applicationData.visaTypeId) return null;
      const { data, error } = await supabase
        .from('visa_types')
        .select('requirements')
        .eq('id', applicationData.visaTypeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!applicationData.visaTypeId,
  });

  // Get requirements based on travelers and visa type
  const getRequirements = () => {
    const { travelers } = applicationData;
    const reqs: { id: string; label: string; forCategory?: string }[] = [];
    
    // Base requirements from visa type or defaults
    const baseReqs = visaType?.requirements as string[] || defaultRequirements.map(r => r.id);
    
    defaultRequirements.forEach(req => {
      if (baseReqs.includes(req.id) || req.forAll) {
        // For adults
        if (travelers.adults > 0 && (req.forAll || req.forAdult)) {
          for (let i = 1; i <= travelers.adults; i++) {
            reqs.push({
              id: `${req.id}_adult_${i}`,
              label: `${t(req.key)} - ${direction === 'rtl' ? `بالغ ${i}` : `Adult ${i}`}`,
              forCategory: 'adult',
            });
          }
        }
        
        // For children
        if (travelers.children > 0 && req.forAll) {
          for (let i = 1; i <= travelers.children; i++) {
            reqs.push({
              id: `${req.id}_child_${i}`,
              label: `${t(req.key)} - ${direction === 'rtl' ? `طفل ${i}` : `Child ${i}`}`,
              forCategory: 'child',
            });
          }
        }
        
        // For infants
        if (travelers.infants > 0 && (req.id === 'passport' || req.id === 'photo')) {
          for (let i = 1; i <= travelers.infants; i++) {
            reqs.push({
              id: `${req.id}_infant_${i}`,
              label: `${t(req.key)} - ${direction === 'rtl' ? `رضيع ${i}` : `Infant ${i}`}`,
              forCategory: 'infant',
            });
          }
        }
      }
    });
    
    return reqs;
  };

  const requirements = getRequirements();
  const checkedCount = applicationData.checkedRequirements.length;
  const totalCount = requirements.length;
  const allChecked = checkedCount === totalCount;

  const toggleRequirement = (reqId: string) => {
    const current = applicationData.checkedRequirements;
    const updated = current.includes(reqId)
      ? current.filter(id => id !== reqId)
      : [...current, reqId];
    updateApplicationData({ checkedRequirements: updated });
  };

  const toggleAll = () => {
    if (allChecked) {
      updateApplicationData({ checkedRequirements: [] });
    } else {
      updateApplicationData({ checkedRequirements: requirements.map(r => r.id) });
    }
  };

  const canProceed = true;

  if (showPathChoice) {
    return <PathChoiceCard onBack={() => setShowPathChoice(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{t('wizard.step3')}</h2>
        <p className="text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'تأكد من توفر المتطلبات التالية قبل المتابعة' 
            : 'Make sure you have the following requirements before proceeding'}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          {allChecked ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
          <span className="font-medium">
            {direction === 'rtl' 
              ? `${checkedCount} من ${totalCount} متطلب`
              : `${checkedCount} of ${totalCount} requirements`
            }
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {allChecked 
            ? (direction === 'rtl' ? 'إلغاء تحديد الكل' : 'Uncheck All')
            : (direction === 'rtl' ? 'تحديد الكل' : 'Check All')
          }
        </Button>
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {requirements.map((req) => {
          const isChecked = applicationData.checkedRequirements.includes(req.id);
          const iconKey = req.id.split('_')[0];
          const IconComponent = requirementIcons[iconKey] || requirementIcons.default;
          
          return (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                isChecked 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-card hover:bg-muted/50"
              )}
              onClick={() => toggleRequirement(req.id)}
            >
              <Checkbox
                id={req.id}
                checked={isChecked}
                onCheckedChange={() => toggleRequirement(req.id)}
              />
              <IconComponent className={cn(
                "w-5 h-5",
                isChecked ? "text-primary" : "text-muted-foreground"
              )} />
              <Label htmlFor={req.id} className="flex-1 cursor-pointer">
                {req.label}
              </Label>
              {req.forCategory && (
                <Badge variant="secondary" className="text-xs">
                  {req.forCategory === 'adult' && (direction === 'rtl' ? 'بالغ' : 'Adult')}
                  {req.forCategory === 'child' && (direction === 'rtl' ? 'طفل' : 'Child')}
                  {req.forCategory === 'infant' && (direction === 'rtl' ? 'رضيع' : 'Infant')}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div 
        className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
        dir={direction === 'rtl' ? 'rtl' : 'ltr'}
      >
        <h4 className={`font-semibold text-blue-900 dark:text-blue-100 mb-2 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
          {direction === 'rtl' ? 'نصائح مهمة' : 'Important Tips'}
        </h4>
        <ul className={`text-sm text-blue-800 dark:text-blue-200 space-y-1 ${direction === 'rtl' ? 'list-disc list-inside text-right' : 'list-disc list-inside text-left'}`}>
          <li>
            {direction === 'rtl' 
              ? 'تأكد من صلاحية جواز السفر لمدة 6 أشهر على الأقل'
              : 'Make sure your passport is valid for at least 6 months'}
          </li>
          <li>
            {direction === 'rtl' 
              ? 'الصور يجب أن تكون بخلفية بيضاء وحديثة'
              : 'Photos must have a white background and be recent'}
          </li>
          <li>
            {direction === 'rtl' 
              ? 'كشف الحساب آخر 3 شهور بالإنجليزية ويجب أن يكون حديثاً ومختوماً من البنك'
              : 'Bank statement for the last 3 months in English, must be recent and stamped by the bank'}
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-12 gap-2"
          onClick={goToPreviousStep}
        >
          <ArrowPrevIcon className="w-4 h-4" />
          {t('wizard.previous')}
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 h-12 gap-2"
          onClick={() => setShowPathChoice(true)}
          disabled={!canProceed}
        >
          {t('wizard.next')}
          <ArrowNextIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
