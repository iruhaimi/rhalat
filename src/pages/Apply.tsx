import { useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApplicationProvider, useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import WizardStepper from '@/components/apply/WizardStepper';
import Step2VisaDetails from '@/components/apply/steps/Step2VisaDetails';
import Step3Requirements from '@/components/apply/steps/Step3Requirements';
import Step4Documents from '@/components/apply/steps/Step4Documents';
import Step6Payment from '@/components/apply/steps/Step6Payment';
import PathChoiceCard from '@/components/apply/PathChoiceCard';
import AuthGateModal from '@/components/apply/AuthGateModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2 } from 'lucide-react';

function ApplyContent() {
  const { countryCode } = useParams();
  const [searchParams] = useSearchParams();
  const visaTypeId = searchParams.get('visa');
  const draftIdParam = searchParams.get('draft');
  const { direction, language } = useLanguage();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { 
    currentStep, 
    setCurrentStep, 
    updateApplicationData, 
    applicationData,
    draftId,
    setDraftId,
    isDraftLoading,
    setIsDraftLoading,
    showAuthGate,
    setShowAuthGate,
    clearGuestDraft,
  } = useApplication();
  const { user } = useAuth();
  
  const lastSavedStep = useRef(0);
  const isSaving = useRef(false);

  // Hydrate applicant info from the authenticated user / profile.
  // After removing the basic-info step, these fields are populated from auth instead of a form.
  useEffect(() => {
    if (!user) return;
    const fullNameFromAuth =
      profile?.full_name ||
      (user.user_metadata as any)?.full_name ||
      (user.user_metadata as any)?.name ||
      '';
    updateApplicationData({
      fullName: applicationData.fullName || fullNameFromAuth,
      email: applicationData.email || user.email || '',
      phone: applicationData.phone || profile?.phone || '',
      countryCode: applicationData.countryCode || '+966',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.full_name, profile?.phone]);

  // Pre-fill country if coming from country page
  const { data: country, isLoading: countryLoading } = useQuery({
    queryKey: ['country-prefill', countryCode],
    queryFn: async () => {
      if (!countryCode) return null;
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('code', countryCode.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!countryCode,
  });

  // Pre-fill visa type if provided
  const { data: visaType, isLoading: visaLoading } = useQuery({
    queryKey: ['visa-prefill', visaTypeId],
    queryFn: async () => {
      if (!visaTypeId) return null;
      const { data, error } = await supabase
        .from('visa_types')
        .select('*, countries(*)')
        .eq('id', visaTypeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!visaTypeId,
  });

  // Load draft if draftId is provided in URL
  const { isLoading: draftLoading } = useQuery({
    queryKey: ['load-draft', draftIdParam],
    queryFn: async () => {
      if (!draftIdParam) return null;
      setIsDraftLoading(true);
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          visa_type_id,
          travel_date,
          purpose_of_travel,
          visa_type:visa_types(
            id,
            name,
            price,
            child_price,
            infant_price,
            fee_type,
            government_fees,
            price_notes,
            price_notes_en,
            country:countries(id, name)
          )
        `)
        .eq('id', draftIdParam)
        .single();

      if (error) {
        setIsDraftLoading(false);
        throw error;
      }
      
      setDraftId(draftIdParam);
      
      // Parse stored draft data
      let storedData: any = {};
      if (data.purpose_of_travel) {
        try {
          storedData = JSON.parse(data.purpose_of_travel);
        } catch {
          storedData = {};
        }
      }
      
      const visa = data.visa_type as any;
      const countryData = visa?.country;
      
      // Update application data
      updateApplicationData({
        visaTypeId: data.visa_type_id,
        visaTypeName: visa?.name || '',
        countryId: countryData?.id || '',
        countryName: countryData?.name || '',
        travelDate: data.travel_date ? new Date(data.travel_date) : null,
        adultPrice: visa?.price || 0,
        childPrice: visa?.child_price || Math.round((visa?.price || 0) * 0.75),
        infantPrice: visa?.infant_price || Math.round((visa?.price || 0) * 0.5),
        visaFeesIncluded: visa?.fee_type === 'included',
        governmentFees: visa?.government_fees || 0,
        priceNotes: visa?.price_notes || '',
        priceNotesEn: visa?.price_notes_en || '',
        fullName: storedData.fullName || '',
        email: storedData.email || '',
        phone: storedData.phone || '',
        countryCode: storedData.countryCode || '+966',
        travelers: storedData.travelers || { adults: 1, children: 0, infants: 0 },
        checkedRequirements: storedData.checkedRequirements || [],
      });
      
      // Set step to where user left off
      if (storedData.currentStep && storedData.currentStep > 1) {
        setCurrentStep(storedData.currentStep);
        lastSavedStep.current = storedData.currentStep;
      }
      
      setIsDraftLoading(false);
      
      toast({
        title: language === 'ar' ? 'تم تحميل المسودة' : 'Draft Loaded',
        description: language === 'ar' ? 'تم استعادة بيانات طلبك السابق' : 'Your previous application data has been restored',
      });
      
      return data;
    },
    enabled: !!draftIdParam && !!profile,
  });

  // Auto-save draft when step changes
  const saveDraft = useCallback(async () => {
    if (!profile || !applicationData.visaTypeId || isSaving.current) return;
    if (currentStep === lastSavedStep.current) return;
    
    isSaving.current = true;
    
    try {
      const draftPayload = {
        user_id: profile.id,
        visa_type_id: applicationData.visaTypeId,
        travel_date: applicationData.travelDate ? applicationData.travelDate.toISOString().split('T')[0] : null,
        status: 'draft' as const,
        purpose_of_travel: JSON.stringify({
          travelers: applicationData.travelers,
          checkedRequirements: applicationData.checkedRequirements,
          currentStep,
        }),
      };

      let result;
      
      if (draftId) {
        result = await supabase
          .from('applications')
          .update({
            ...draftPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draftId)
          .select('id')
          .single();
      } else {
        result = await supabase
          .from('applications')
          .insert(draftPayload)
          .select('id')
          .single();
      }

      if (result.error) throw result.error;
      
      if (!draftId) {
        setDraftId(result.data.id);
      }
      
      lastSavedStep.current = currentStep;
      
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      isSaving.current = false;
    }
  }, [profile, applicationData, currentStep, draftId, setDraftId]);

  // Trigger DB save on step change (requires auth — gate enforces it before step 3)
  useEffect(() => {
    if (currentStep >= 2 && profile && applicationData.visaTypeId) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, saveDraft, profile, applicationData.visaTypeId]);

  // Auth gate: block transition to step 3 (path choice) and beyond for guests.
  // When the user authenticates inside the gate modal, advance to step 3.
  useEffect(() => {
    if (currentStep >= 3 && !user) {
      // Force user back to step 2 (requirements) and open the gate
      setCurrentStep(2);
      setShowAuthGate(true);
    }
  }, [currentStep, user, setCurrentStep, setShowAuthGate]);

  // When a previously-guest user signs in/up while the gate is open, migrate draft and advance.
  useEffect(() => {
    if (user && showAuthGate) {
      setShowAuthGate(false);
      // Allow profile to load + save effect to fire, then advance to path choice
      const timer = setTimeout(() => {
        setCurrentStep(3);
        // Clear local guest copy now that DB will own the draft
        clearGuestDraft();
        toast({
          title: language === 'ar' ? 'مرحباً بك!' : 'Welcome!',
          description: language === 'ar' ? 'تم حفظ تقدمك. اختر طريقة الإكمال.' : 'Your progress is saved. Choose how to continue.',
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [user, showAuthGate, setShowAuthGate, setCurrentStep, clearGuestDraft, toast, language]);

  // Update application data when country/visa is loaded
  useEffect(() => {
    if (country && !draftIdParam) {
      updateApplicationData({
        countryId: country.id,
        countryName: country.name,
      });
    }
  }, [country, updateApplicationData, draftIdParam]);

  useEffect(() => {
    if (visaType && !draftIdParam) {
      const basePrice = Number(visaType.price);
      updateApplicationData({
        countryId: visaType.country_id,
        countryName: visaType.countries?.name || '',
        visaTypeId: visaType.id,
        visaTypeName: visaType.name,
        adultPrice: basePrice,
        childPrice: Math.round(basePrice * 0.75),
        infantPrice: Math.round(basePrice * 0.25),
      });
    }
  }, [visaType, updateApplicationData, draftIdParam]);

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step2VisaDetails />;
      case 2:
        return <Step3Requirements />;
      case 3:
        return <PathChoiceCard onBack={() => setCurrentStep(2)} />;
      case 4:
        return <Step4Documents />;
      case 5:
        return <Step6Payment />;
      default:
        return <Step2VisaDetails />;
    }
  };

  if (countryLoading || visaLoading || draftLoading || isDraftLoading) {
    return (
      <div className="container-section py-8">
        <Skeleton className="h-20 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AuthGateModal />
      {/* Hero — Navy/Cream wizard header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-brand text-white">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="container-section px-4 sm:px-6 py-2 sm:py-3 relative">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <h1 className="font-heading-ar text-lg sm:text-2xl font-black text-center">
              {direction === 'rtl' ? 'تقديم طلب التأشيرة' : 'Visa Application'}
            </h1>
            {draftId && profile && (
              <Badge variant="secondary" className="gap-1 text-xs bg-white/15 text-white border-white/20 hover:bg-white/20">
                {isSaving.current ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {direction === 'rtl' ? 'محفوظ تلقائياً' : 'Auto-saved'}
              </Badge>
            )}
          </div>
          {(country || applicationData.countryName) && (
            <p className="text-center text-xs sm:text-sm text-white/75 mt-1">
              {direction === 'rtl'
                ? `التأشيرة إلى ${country?.name || applicationData.countryName}`
                : `Visa to ${country?.name || applicationData.countryName}`}
            </p>
          )}
        </div>
      </div>

      {/* Wizard Stepper card — lifted over hero */}
      <div className="container-section px-4 sm:px-6 -mt-2 sm:-mt-3 relative z-10">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl shadow-xl shadow-navy/5 px-4 sm:px-6 py-1">
          <WizardStepper
            currentStep={currentStep}
            totalSteps={5}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="container-section px-4 sm:px-6 py-2 sm:py-3 pb-16 sm:pb-4">
        <div className="max-w-4xl mx-auto bg-card rounded-3xl shadow-lg shadow-navy/5 border border-border p-3 sm:p-4 md:p-5">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

export default function Apply() {
  return (
    <ApplicationProvider>
      <ApplyContent />
    </ApplicationProvider>
  );
}
