import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

const MOCK_LISTINGS = [
  {
    id: 'mock-listing-1',
    brand: 'Zara',
    created_at: '2026-06-10T10:00:00.000Z',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'],
    price: 6500,
    reserved_until: null,
    status: 'approved',
    title: 'Vintage Leather Jacket',
    weight: 'medium',
  },
  {
    id: 'mock-listing-2',
    brand: 'Nike',
    created_at: '2026-06-08T14:30:00.000Z',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600'],
    price: 3500,
    reserved_until: '2026-06-20T18:00:00.000Z',
    status: 'reserved',
    title: 'Classic White Sneakers',
    weight: 'light',
  },
  {
    id: 'mock-listing-3',
    brand: 'Mango',
    created_at: '2026-06-15T09:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
    ],
    price: 2800,
    reserved_until: null,
    status: 'pending',
    title: 'Bohemian Summer Dress',
    weight: 'light',
  },
  {
    id: 'mock-listing-4',
    brand: 'H&M',
    created_at: '2026-06-05T11:15:00.000Z',
    images: ['https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600'],
    price: 2200,
    reserved_until: null,
    status: 'rejected',
    title: 'Kids Denim Dungarees',
    weight: 'light',
  },
  {
    id: 'mock-listing-5',
    brand: 'Uniqlo',
    created_at: '2026-05-28T16:45:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600',
    ],
    price: 8900,
    reserved_until: null,
    status: 'sold',
    title: 'Wool Winter Coat',
    weight: 'heavy',
  },
];

export const myListingsQueryKey = {
  list: (userId?: string) => ['my-listings', userId] as const,
};

export function getMyListingsOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId || isMockDataEnabled,
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_LISTINGS;
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId!)
        .order('created_at', { ascending: false });
      if (error)
        throw error;
      return data ?? [];
    },
    queryKey: myListingsQueryKey.list(userId),
  });
}
