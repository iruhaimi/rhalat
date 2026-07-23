import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ApplicationData } from '@/contexts/ApplicationContext';

interface DraftData {
  id: string;
  visa_type_id: string;
  travel_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  draft_data?: {
    fullName?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    travelers?: {
      adults: number;
      children: number;
      infants: number;
    };
    checkedRequirements?: string[];
    uploadedDocuments?: any[];
    currentStep?: number;
  };
}

export function useDraftApplication() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Fetch user's draft applications
  const fetchDrafts = useCallback(async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          visa_type_id,
          travel_date,
          status,
          created_at,
          updated_at
        `)
        .eq('user_id', profile.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Save application as draft
  const saveDraft = useCallback(async (
    applicationData: Partial<ApplicationData>,
    currentStep: number,
    language: 'ar' | 'en'
  ): Promise<string | null> => {
    if (!profile || !applicationData.visaTypeId) return null;
    
    setIsSaving(true);
    try {
      // Prepare draft data to store
      const draftPayload = {
        user_id: profile.id,
        visa_type_id: applicationData.visaTypeId,
        travel_date: applicationData.travelDate ? applicationData.travelDate.toISOString().split('T')[0] : null,
        status: 'draft' as const,
        purpose_of_travel: JSON.stringify({
          fullName: applicationData.fullName,
          email: applicationData.email,
          phone: applicationData.phone,
          countryCode: applicationData.countryCode,
          travelers: applicationData.travelers,
          checkedRequirements: applicationData.checkedRequirements,
          currentStep,
        }),
      };

      let result;
      
      if (currentDraftId) {
        // Update existing draft
        result = await supabase
          .from('applications')
          .update({
            ...draftPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDraftId)
          .select('id')
          .single();
      } else {
        // Create new draft via SECURITY DEFINER RPC — avoids RLS mismatch when
        // client-side profile.id is stale or the session's auth.uid() doesn't
        // resolve to the same profile that get_profile_id() returns.
        const { data: newId, error: rpcError } = await supabase.rpc('create_application_draft', {
          p_visa_type_id: applicationData.visaTypeId,
          p_travel_date: draftPayload.travel_date,
          p_draft_data: {} as any,
        });
        if (rpcError) throw rpcError;
        // Persist the payload fields the RPC doesn't set (purpose_of_travel).
        result = await supabase
          .from('applications')
          .update({
            purpose_of_travel: draftPayload.purpose_of_travel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', newId as string)
          .select('id')
          .single();
      }

      if (result.error) throw result.error;
      
      const draftId = result.data.id;
      setCurrentDraftId(draftId);
      
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' 
          ? 'تم حفظ طلبك كمسودة' 
          : 'Your application has been saved as draft',
      });
      
      return draftId;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'فشل حفظ المسودة' 
          : 'Failed to save draft',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [profile, currentDraftId, toast]);

  // Load a draft into application context
  const loadDraft = useCallback(async (draftId: string): Promise<Partial<ApplicationData> | null> => {
    try {
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
        .eq('id', draftId)
        .single();

      if (error) throw error;
      
      setCurrentDraftId(draftId);
      
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
      const country = visa?.country;
      
      return {
        visaTypeId: data.visa_type_id,
        visaTypeName: visa?.name || '',
        countryId: country?.id || '',
        countryName: country?.name || '',
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
      };
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, []);

  // Delete a draft
  const deleteDraft = useCallback(async (draftId: string, language: 'ar' | 'en'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
      }
      
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' 
          ? 'تم حذف المسودة بنجاح' 
          : 'Draft deleted successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  }, [currentDraftId, toast]);

  // Fetch drafts on mount
  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  return {
    drafts,
    isLoading,
    isSaving,
    currentDraftId,
    setCurrentDraftId,
    saveDraft,
    loadDraft,
    deleteDraft,
    fetchDrafts,
  };
}
