import React, { createContext, useContext, useState, useCallback } from 'react';

export interface TravelerCounts {
  adults: number;
  children: number;
  infants: number;
}

export interface ApplicationData {
  // Step 1: Basic Info
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  
  // Step 2: Visa Details
  countryId: string;
  countryName: string;
  visaTypeId: string;
  visaTypeName: string;
  travelDate: Date | null;
  travelers: TravelerCounts;
  
  // Pricing
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  visaFeesIncluded: boolean;
  governmentFees: number;
  priceNotes: string;
  priceNotesEn: string;
  
  // Step 3: Requirements checked
  checkedRequirements: string[];
  
  // Step 4: Documents
  uploadedDocuments: {
    type: string;
    fileName: string;
    fileSize: number;
    uploaded: boolean;
  }[];
  
  // Step 5: Terms
  termsAccepted: boolean;
  
  // Step 6: Payment
  paymentMethod: string;

  // Submission method (online payment vs WhatsApp)
  submissionMethod: 'online' | 'whatsapp' | null;
}

interface ApplicationContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  applicationData: ApplicationData;
  updateApplicationData: (data: Partial<ApplicationData>) => void;
  resetApplication: () => void;
  calculateTotal: () => {
    serviceTotal: number;
    governmentTotal: number;
    grandTotal: number;
    breakdown: {
      adults: number;
      children: number;
      infants: number;
    };
  };
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isStepValid: (step: number) => boolean;
  // Draft functionality
  draftId: string | null;
  setDraftId: (id: string | null) => void;
  isDraftLoading: boolean;
  setIsDraftLoading: (loading: boolean) => void;
}

const initialApplicationData: ApplicationData = {
  fullName: '',
  email: '',
  phone: '',
  countryCode: '+966',
  countryId: '',
  countryName: '',
  visaTypeId: '',
  visaTypeName: '',
  travelDate: null,
  travelers: {
    adults: 1,
    children: 0,
    infants: 0,
  },
  adultPrice: 0,
  childPrice: 0,
  infantPrice: 0,
  visaFeesIncluded: true,
  governmentFees: 0,
  priceNotes: '',
  priceNotesEn: '',
  checkedRequirements: [],
  uploadedDocuments: [],
  termsAccepted: false,
  paymentMethod: '',
  submissionMethod: null,
};

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>(initialApplicationData);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  const updateApplicationData = useCallback((data: Partial<ApplicationData>) => {
    setApplicationData(prev => ({ ...prev, ...data }));
  }, []);

  const resetApplication = useCallback(() => {
    setApplicationData(initialApplicationData);
    setCurrentStep(1);
    setDraftId(null);
  }, []);

  const calculateTotal = useCallback(() => {
    const { travelers, adultPrice, childPrice, infantPrice, governmentFees, visaFeesIncluded } = applicationData;
    
    const adultsTotal = travelers.adults * adultPrice;
    const childrenTotal = travelers.children * childPrice;
    const infantsTotal = travelers.infants * infantPrice;
    const serviceTotal = adultsTotal + childrenTotal + infantsTotal;
    
    const totalTravelers = travelers.adults + travelers.children + travelers.infants;
    const governmentTotal = visaFeesIncluded ? 0 : (governmentFees * totalTravelers);
    
    return {
      serviceTotal,
      governmentTotal,
      grandTotal: serviceTotal + governmentTotal,
      breakdown: {
        adults: adultsTotal,
        children: childrenTotal,
        infants: infantsTotal,
      },
    };
  }, [applicationData]);

  const goToNextStep = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          applicationData.fullName.trim() &&
          applicationData.email.includes('@') &&
          applicationData.phone.length >= 9
        );
      case 2:
        return !!(
          applicationData.visaTypeId &&
          applicationData.travelDate &&
          (applicationData.travelers.adults + applicationData.travelers.children + applicationData.travelers.infants) > 0
        );
      case 3:
        return applicationData.checkedRequirements.length > 0;
      case 4:
        return applicationData.uploadedDocuments.some(doc => doc.uploaded);
      case 5:
        return applicationData.termsAccepted;
      case 6:
        return !!applicationData.paymentMethod;
      default:
        return false;
    }
  }, [applicationData]);

  return (
    <ApplicationContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        applicationData,
        updateApplicationData,
        resetApplication,
        calculateTotal,
        goToNextStep,
        goToPreviousStep,
        isStepValid,
        draftId,
        setDraftId,
        isDraftLoading,
        setIsDraftLoading,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplication must be used within ApplicationProvider');
  }
  return context;
}
