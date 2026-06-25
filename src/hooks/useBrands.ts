import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

export interface Brand {
  id: string;
  active: boolean;
  name: string;
  sort_order: number;
}

// mock data
const MOCK_BRANDS: Brand[] = [
  { id: 'brand-1', active: true, name: 'Zara', sort_order: 1 },
  { id: 'brand-2', active: true, name: 'Nike', sort_order: 2 },
  { id: 'brand-3', active: true, name: 'H&M', sort_order: 3 },
  { id: 'brand-4', active: true, name: 'Mango', sort_order: 4 },
  { id: 'brand-5', active: true, name: 'Uniqlo', sort_order: 5 },
  { id: 'brand-6', active: true, name: 'Coach', sort_order: 6 },
  { id: 'brand-7', active: false, name: 'Levi\'s', sort_order: 7 },
];

export function useBrands(isIncludingInactive = false) {
  return useQuery({
    queryFn: async (): Promise<Brand[]> => {
      if (isMockDataEnabled) {
        return isIncludingInactive
          ? MOCK_BRANDS
          : MOCK_BRANDS.filter(b => b.active);
      }
      let query = supabase
        .from('brands')
        .select('id, name, active, sort_order');
      if (!isIncludingInactive)
        query = query.eq('active', true);
      const { data, error } = await query.order('sort_order').order('name');
      if (error)
        throw error;
      return (data ?? []) as Brand[];
    },
    queryKey: ['brands', isIncludingInactive],
  });
}
