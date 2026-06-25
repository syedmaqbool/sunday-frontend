import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

export type BoostPlacement = 'for_you' | 'search' | 'trending';

export interface BoostPackage {
  id: string;
  active: boolean;
  description: string;
  duration_days: number;
  name: string;
  placement: BoostPlacement;
  price: number;
}

export interface ListingBoost {
  id: string;
  ends_at: string;
  listing_id: string;
  payment_status: string;
  placement: BoostPlacement;
  price_paid: number;
  seller_id: string;
  starts_at: string;
}

const MOCK_BOOST_PACKAGES: BoostPackage[] = [
  {
    id: 'pkg-1',
    active: true,
    description: 'Show up in Trending Now for 3 days.',
    duration_days: 3,
    name: 'Trending Boost · 3 Days',
    placement: 'trending',
    price: 500,
  },
  {
    id: 'pkg-2',
    active: true,
    description: 'Show up in Trending Now for a week.',
    duration_days: 7,
    name: 'Trending Boost · 7 Days',
    placement: 'trending',
    price: 1000,
  },
  {
    id: 'pkg-3',
    active: true,
    description: 'Get featured in personalized feeds.',
    duration_days: 3,
    name: 'For You Boost · 3 Days',
    placement: 'for_you',
    price: 450,
  },
  {
    id: 'pkg-4',
    active: true,
    description: 'Rank higher in search & browse results.',
    duration_days: 3,
    name: 'Search Boost · 3 Days',
    placement: 'search',
    price: 400,
  },
  {
    id: 'pkg-5',
    active: true,
    description: 'Rank higher in search for a full week.',
    duration_days: 7,
    name: 'Search Boost · 7 Days',
    placement: 'search',
    price: 850,
  },
];

const now = Date.now();
const MOCK_MY_BOOSTS: ListingBoost[] = [
  {
    id: 'boost-1',
    ends_at: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(),
    listing_id: 'mock-listing-1',
    payment_status: 'mock',
    placement: 'trending',
    price_paid: 500,
    seller_id: 'mock-user-id',
    starts_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'boost-2',
    ends_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    listing_id: 'mock-listing-5',
    payment_status: 'mock',
    placement: 'search',
    price_paid: 400,
    seller_id: 'mock-user-id',
    starts_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const boostsQueryKey = {
  active: (placement?: BoostPlacement) => ['active-boosts', placement ?? 'all'] as const,
  my: (userId?: string) => ['my-boosts', userId] as const,
  packages: () => ['boost-packages'] as const,
};

export function getActiveBoostsOptions(placement?: BoostPlacement) {
  return queryOptions({
    queryFn: async (): Promise<ListingBoost[]> => {
      if (isMockDataEnabled) {
        const activeOnly = MOCK_MY_BOOSTS.filter(
          boost => new Date(boost.ends_at).getTime() > Date.now(),
        );
        return placement
          ? activeOnly.filter(boost => boost.placement === placement)
          : activeOnly;
      }
      let query = supabase
        .from('listing_boosts' as any)
        .select('*')
        .gt('ends_at', new Date().toISOString())
        .in('payment_status', ['paid', 'mock']);
      if (placement)
        query = query.eq('placement', placement);
      const { data, error } = await query;
      if (error)
        throw error;
      return (data as any[]) ?? [];
    },
    queryKey: boostsQueryKey.active(placement),
    staleTime: 60_000,
  });
}

export function getBoostPackagesOptions() {
  return queryOptions({
    queryFn: async (): Promise<BoostPackage[]> => {
      if (isMockDataEnabled)
        return MOCK_BOOST_PACKAGES;
      const { data, error } = await supabase
        .from('boost_packages' as any)
        .select('*')
        .eq('active', true)
        .order('placement')
        .order('duration_days');
      if (error)
        throw error;
      return (data as any[]) ?? [];
    },
    queryKey: boostsQueryKey.packages(),
  });
}

export function getMyBoostsOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId || isMockDataEnabled,
    queryFn: async (): Promise<ListingBoost[]> => {
      if (isMockDataEnabled)
        return MOCK_MY_BOOSTS;
      const { data, error } = await supabase
        .from('listing_boosts' as any)
        .select('*')
        .eq('seller_id', userId!)
        .order('created_at', { ascending: false });
      if (error)
        throw error;
      return (data as any[]) ?? [];
    },
    queryKey: boostsQueryKey.my(userId),
  });
}
