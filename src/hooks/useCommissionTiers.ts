import type { CommissionTier } from '@/lib/commission';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

const MOCK_COMMISSION_TIERS: CommissionTier[] = [
  {
    id: 'tier-1',
    active: true,
    categories: [],
    max_price: 5000,
    min_price: 0,
    name: 'Standard',
    rate: 5,
    sort_order: 1,
  },
  {
    id: 'tier-2',
    active: true,
    categories: [],
    max_price: 15_000,
    min_price: 5001,
    name: 'Mid-range',
    rate: 7,
    sort_order: 2,
  },
  {
    id: 'tier-3',
    active: true,
    categories: [],
    max_price: null,
    min_price: 15_001,
    name: 'Premium',
    rate: 10,
    sort_order: 3,
  },
  {
    id: 'tier-4',
    active: true,
    categories: ['children', 'kids'],
    max_price: null,
    min_price: 0,
    name: 'Kids Wear',
    rate: 3,
    sort_order: 4,
  },
  {
    id: 'tier-5',
    active: false,
    categories: ['luxury', 'designer'],
    max_price: null,
    min_price: 0,
    name: 'Luxury Brands',
    rate: 12,
    sort_order: 5,
  },
];

const mockCommissionStore = {
  current: [...MOCK_COMMISSION_TIERS],
};

export function useCommissionTiers(options?: { onlyActive?: boolean }) {
  return useQuery<CommissionTier[]>({
    queryFn: async () => {
      if (isMockDataEnabled) {
        return options?.onlyActive
          ? mockCommissionStore.current.filter(t => t.active)
          : mockCommissionStore.current;
      }
      let q = supabase
        .from('commission_tiers' as any)
        .select('*')
        .order('sort_order');
      if (options?.onlyActive)
        q = q.eq('active', true);
      const { data, error } = await q;
      if (error)
        throw error;
      return (data ?? []) as unknown as CommissionTier[];
    },
    queryKey: ['commission-tiers', options?.onlyActive ?? false],
    staleTime: 60_000,
  });
}

export const __mockCommissionStore = {
  get: () => mockCommissionStore.current,
  set: (next: CommissionTier[]) => {
    mockCommissionStore.current = next;
  },
};
