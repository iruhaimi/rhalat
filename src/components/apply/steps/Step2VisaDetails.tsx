import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TravelerCounter from '../TravelerCounter';
import PriceSummaryCard from '../PriceSummaryCard';
import SARSymbol from '@/components/ui/SARSymbol';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { 
  SCHENGEN_INFO, 
  filterOutSchengenCountries, 
  getSchengenCountries,
  isSchengenCountry 
} from '@/lib/schengenCountries';

export default function Step2VisaDetails() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep, calculateTotal } = useApplication();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [initialized, setInitialized] = useState(false);
  const [isSchengenFromUrl, setIsSchengenFromUrl] = useState(false);
  
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ['countries-apply'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Separate Schengen and non-Schengen countries
  const schengenCountries = useMemo(() => 
    countries ? getSchengenCountries(countries) : [], 
    [countries]
  );
  
  const nonSchengenCountries = useMemo(() => 
    countries ? filterOutSchengenCountries(countries) : [], 
    [countries]
  );

  // Check URL params for initial selection (e.g., /apply?country=SCHENGEN)
  useEffect(() => {
    if (!initialized && countries && countries.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const countryCode = urlParams.get('country');
      
      if (countryCode === 'SCHENGEN') {
        setSelectedRegion('schengen');
        setIsSchengenFromUrl(true); // Mark that user came from Schengen selection
      } else if (countryCode && !isSchengenCountry(countryCode)) {
        // Find the country by code and set it
        const country = countries.find(c => c.code === countryCode);
        if (country) {
          setSelectedRegion('');
          updateApplicationData({
            countryId: country.id,
            countryName: country.name,
          });
        }
      }
      setInitialized(true);
    }
  }, [countries, initialized, updateApplicationData]);

  // Fetch visa types for selected country
  const { data: visaTypes, isLoading: visaTypesLoading } = useQuery({
    queryKey: ['visa-types-apply', applicationData.countryId],
    queryFn: async () => {
      if (!applicationData.countryId) return [];
      const { data, error } = await supabase
        .from('visa_types')
        .select('*')
        .eq('country_id', applicationData.countryId)
        .eq('is_active', true)
        .order('price');
      if (error) throw error;
      return data;
    },
    enabled: !!applicationData.countryId,
  });

  // Update prices when visa type changes
  useEffect(() => {
    if (applicationData.visaTypeId && visaTypes) {
      const selectedVisa = visaTypes.find(v => v.id === applicationData.visaTypeId);
      if (selectedVisa) {
        const basePrice = Number(selectedVisa.price);
        const isFeesIncluded = selectedVisa.fee_type === 'included';
        
        // Use custom prices from database, or fallback to percentage-based calculation
        const childPrice = selectedVisa.child_price != null 
          ? Number(selectedVisa.child_price) 
          : Math.round(basePrice * 0.75);
        const infantPrice = selectedVisa.infant_price != null 
          ? Number(selectedVisa.infant_price) 
          : Math.round(basePrice * 0.5);
        
        updateApplicationData({
          visaTypeName: selectedVisa.name,
          adultPrice: basePrice,
          childPrice: childPrice,
          infantPrice: infantPrice,
          visaFeesIncluded: isFeesIncluded,
          governmentFees: isFeesIncluded ? 0 : Math.round(basePrice * 0.3),
          priceNotes: selectedVisa.price_notes || '',
          priceNotesEn: selectedVisa.price_notes_en || '',
        });
      }
    }
  }, [applicationData.visaTypeId, visaTypes, updateApplicationData]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    // Reset country selection when region changes
    updateApplicationData({
      countryId: '',
      countryName: '',
      visaTypeId: '',
      visaTypeName: '',
    });
  };

  const handleCountryChange = (countryId: string) => {
    const country = countries?.find(c => c.id === countryId);
    updateApplicationData({
      countryId,
      countryName: country?.name || '',
      visaTypeId: '',
      visaTypeName: '',
    });
  };

  const handleVisaTypeChange = (visaTypeId: string) => {
    updateApplicationData({ visaTypeId });
  };

  const handleDateChange = (dateString: string) => {
    updateApplicationData({ travelDate: dateString ? new Date(dateString) : null });
  };

  const updateTravelers = (type: 'adults' | 'children' | 'infants', value: number) => {
    updateApplicationData({
      travelers: {
        ...applicationData.travelers,
        [type]: value,
      },
    });
  };

  const canProceed = applicationData.visaTypeId && applicationData.travelDate && 
    (applicationData.travelers.adults + applicationData.travelers.children + applicationData.travelers.infants) > 0;

  // Get countries to show based on selected region
  const countriesToShow = useMemo(() => {
    if (selectedRegion === 'schengen') {
      return schengenCountries;
    }
    return [];
  }, [selectedRegion, schengenCountries]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">{t('wizard.step2')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'حدد نوع التأشيرة وتاريخ السفر وعدد المسافرين' 
            : 'Select visa type, travel date and number of travelers'}
        </p>
      </div>

      {/* Mobile: Show Price Summary at top as collapsible */}
      <div className="lg:hidden">
        <details className="group">
          <summary className="flex items-center justify-between p-4 bg-primary/5 rounded-xl cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <SARSymbol size="sm" className="text-primary" />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('pricing.total')}</span>
                <div className="font-bold text-lg text-primary flex items-center gap-1">
                  {calculateTotal().grandTotal.toLocaleString()}
                  <SARSymbol size="sm" className="text-primary" />
                </div>
              </div>
            </div>
            <ArrowNextIcon className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-3">
            <PriceSummaryCard />
          </div>
        </details>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Region/Country Selection - Hidden when user came from Schengen URL */}
          {!isSchengenFromUrl && (
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">{t('form.country')}</Label>
              <Select
                value={selectedRegion || (applicationData.countryId && !isSchengenCountry(countries?.find(c => c.id === applicationData.countryId)?.code || '') ? applicationData.countryId : '')}
                onValueChange={(value) => {
                  if (value === 'schengen') {
                    handleRegionChange('schengen');
                  } else {
                    // Direct country selection
                    setSelectedRegion('');
                    handleCountryChange(value);
                  }
                }}
              >
                <SelectTrigger className="h-12 sm:h-12 text-sm sm:text-base">
                  <SelectValue placeholder={direction === 'rtl' ? 'اختر الوجهة' : 'Select destination'} />
                </SelectTrigger>
                <SelectContent>
                  {/* Schengen Option */}
                  {schengenCountries.length > 0 && (
                    <SelectItem value="schengen">
                      <div className="flex items-center gap-2">
                        <img 
                          src={SCHENGEN_INFO.flag_url} 
                          alt="EU" 
                          className="w-5 h-4 object-cover rounded"
                        />
                        <span>{SCHENGEN_INFO.name}</span>
                      </div>
                    </SelectItem>
                  )}
                  
                  {/* Non-Schengen Countries */}
                  {nonSchengenCountries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="w-5 h-4 object-cover rounded"
                        />
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Schengen Country Selection - Shows when Schengen is selected or user came from Schengen URL */}
          {selectedRegion === 'schengen' && (
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">{direction === 'rtl' ? 'اختر الدولة من شنغن' : 'Select Schengen country'}</Label>
              <Select
                value={applicationData.countryId}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger className="h-12 text-sm sm:text-base">
                  <SelectValue placeholder={direction === 'rtl' ? 'اختر الدولة' : 'Select country'} />
                </SelectTrigger>
                <SelectContent>
                  {schengenCountries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="w-5 h-4 object-cover rounded"
                        />
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Visa Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">{t('form.visaType')}</Label>
            <Select
              value={applicationData.visaTypeId}
              onValueChange={handleVisaTypeChange}
              disabled={!applicationData.countryId || visaTypesLoading}
            >
              <SelectTrigger className="h-12 text-sm sm:text-base">
                <SelectValue placeholder={
                  visaTypesLoading 
                    ? (direction === 'rtl' ? 'جاري التحميل...' : 'Loading...') 
                    : (direction === 'rtl' ? 'اختر نوع التأشيرة' : 'Select visa type')
                } />
              </SelectTrigger>
              <SelectContent>
                {visaTypes?.map((visa) => (
                  <SelectItem key={visa.id} value={visa.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{visa.name}</span>
                      <span className="text-primary font-medium ms-4 flex items-center gap-1">
                        {Number(visa.price).toLocaleString()}
                        <SARSymbol size="xs" className="text-primary" />
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Travel Date */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">{t('form.travelDate')}</Label>
            <DatePicker
              value={applicationData.travelDate}
              onChange={handleDateChange}
              placeholder={direction === 'rtl' ? 'اختر تاريخ السفر' : 'Pick a travel date'}
              isRTL={direction === 'rtl'}
              minDate={new Date()}
            />
          </div>

          {/* Traveler Counters */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm sm:text-base font-semibold">{t('form.travelers')}</Label>
            
            <TravelerCounter
              label={t('form.adults')}
              description={t('pricing.adult')}
              value={applicationData.travelers.adults}
              price={applicationData.adultPrice}
              min={1}
              onChange={(val) => updateTravelers('adults', val)}
            />
            
            <TravelerCounter
              label={t('form.children')}
              description={t('pricing.child')}
              value={applicationData.travelers.children}
              price={applicationData.childPrice}
              onChange={(val) => updateTravelers('children', val)}
            />
            
            <TravelerCounter
              label={t('form.infants')}
              description={t('pricing.infant')}
              value={applicationData.travelers.infants}
              price={applicationData.infantPrice}
              onChange={(val) => updateTravelers('infants', val)}
            />
          </div>
        </div>

        {/* Price Summary Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <PriceSummaryCard />
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Sticky on mobile */}
      <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0 mt-4 sm:mt-0">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-12 sm:h-12 gap-2 text-sm sm:text-base"
          onClick={goToPreviousStep}
        >
          <ArrowPrevIcon className="w-4 h-4" />
          <span className="hidden xs:inline">{t('wizard.previous')}</span>
          <span className="xs:hidden">{direction === 'rtl' ? 'السابق' : 'Back'}</span>
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 h-12 sm:h-12 gap-2 text-sm sm:text-base"
          onClick={goToNextStep}
          disabled={!canProceed}
        >
          <span className="hidden xs:inline">{t('wizard.next')}</span>
          <span className="xs:hidden">{direction === 'rtl' ? 'التالي' : 'Next'}</span>
          <ArrowNextIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
