import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveTax {
  id: string;
  name: string;
  rate: number;
}

export const activeTaxQueryKey = {
  current: () => ['active-tax'] as const,
};

export function getActiveTaxOptions() {
  return queryOptions({
    queryFn: async (): Promise<ActiveTax | null> => {
      const { data, error } = await supabase
        .from('tax_settings')
        .select('id, name, rate')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error)
        throw error;
      return data ? { ...data, rate: Number(data.rate) } : null;
    },
    queryKey: activeTaxQueryKey.current(),
  });
}
