import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Partner {
  id: string;
  name: string;
  name_en: string | null;
  icon_name: string | null;
  logo_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface PartnersSectionSettings {
  enabled: boolean;
  eyebrow_ar: string;
  eyebrow_en: string;
  title_ar: string;
  title_en: string;
}

const DEFAULT_SETTINGS: PartnersSectionSettings = {
  enabled: true,
  eyebrow_ar: 'شركاؤنا في النجاح',
  eyebrow_en: 'Our partners',
  title_ar: 'موثوق من قبل أفضل الشركات',
  title_en: 'Trusted by leading companies',
};

export function usePartners(includeInactive = false) {
  return useQuery({
    queryKey: ['partners', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('partners' as any)
        .select('*')
        .order('display_order', { ascending: true });
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Partner[]) || [];
    },
  });
}

export function usePartnersSectionSettings() {
  return useQuery({
    queryKey: ['partners-section-settings'],
    queryFn: async (): Promise<PartnersSectionSettings> => {
      const { data } = await supabase
        .from('site_content')
        .select('content')
        .eq('page', 'home')
        .eq('section', 'partners_section')
        .maybeSingle();
      const c = (data?.content as any) || {};
      return { ...DEFAULT_SETTINGS, ...c };
    },
  });
}