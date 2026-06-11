import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export default function WizardStepper({ currentStep, totalSteps, onStepClick }: WizardStepperProps) {
  const { t, direction } = useLanguage();
  
  const steps = [
    { number: 1, label: t('wizard.step1') },
    { number: 2, label: t('wizard.step2') },
    { number: 3, label: t('wizard.step3') },
    { number: 4, label: t('wizard.step4') },
    { number: 5, label: t('wizard.step5') },
  ];

  return (
    <div className="w-full py-4 sm:py-5">
      {/* Desktop Stepper */}
      <div className="hidden lg:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={() => onStepClick?.(step.number)}
                disabled={step.number > currentStep}
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-display font-black transition-all",
                  step.number < currentStep && "bg-navy text-white cursor-pointer hover:scale-105",
                  step.number === currentStep && "bg-navy text-white ring-4 ring-navy/15 scale-105 shadow-lg shadow-navy/20",
                  step.number > currentStep && "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </button>
              <span className={cn(
                "mt-2 text-xs font-semibold text-center max-w-[90px]",
                step.number === currentStep ? "text-navy" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 rounded-full",
                step.number < currentStep ? "bg-navy" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Stepper - Enhanced */}
      <div className="lg:hidden space-y-4">
        {/* Current Step Info */}
        <div className="flex items-center justify-between bg-gradient-to-br from-navy/5 to-brand/5 p-4 rounded-2xl border border-navy/10">
          <div>
            <span className="text-xs text-muted-foreground block">
              {direction === 'rtl' ? `الخطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
            </span>
            <span className="font-heading-ar font-black text-navy text-lg">
              {steps.find(s => s.number === currentStep)?.label}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-navy text-white flex items-center justify-center text-xl font-display font-black shadow-lg shadow-navy/20">
            {currentStep}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-navy to-brand transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          {/* Step Dots */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => step.number < currentStep && onStepClick?.(step.number)}
                disabled={step.number >= currentStep}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-300",
                  step.number < currentStep && "bg-navy border-navy cursor-pointer hover:scale-125",
                  step.number === currentStep && "bg-navy border-navy scale-125 shadow-lg shadow-navy/30",
                  step.number > currentStep && "bg-muted border-muted-foreground/30 cursor-not-allowed"
                )}
              >
                {step.number < currentStep && (
                  <Check className="w-2.5 h-2.5 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Completed Steps Summary */}
        {currentStep > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {steps.slice(0, currentStep - 1).map((step) => (
              <button
                key={step.number}
                onClick={() => onStepClick?.(step.number)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-navy/5 border border-navy/10 rounded-full text-xs whitespace-nowrap shrink-0 hover:bg-navy/10 transition-colors"
              >
                <Check className="w-3 h-3 text-navy" />
                <span className="text-navy font-semibold">{step.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
