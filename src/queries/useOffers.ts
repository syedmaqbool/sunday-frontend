import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

export interface OfferListItem {
  id: string;
  amount: number;
  buyer_id: string;
  counter_amount: number | null;
  created_at: string;
  listing_id: string;
  listings: {
    brand: string;
    images: string[];
    price: number;
    title: string;
  } | null;
  message: string;
  seller_id: string;
  seller_message: string;
  status: string;
  updated_at: string;
}

export interface ReceivedOfferListItem extends OfferListItem {
  buyer_profile?: { full_name: string | null } | null;
}

export interface BuyerListingOffer {
  id: string;
  amount: number;
  counter_amount: number | null;
  created_at: string;
  message: string;
  seller_message: string;
  status: string;
  updated_at: string;
}

export const offersQueryKey = {
  buyerListing: (listingId: string, userId?: string) => ['my-offers', listingId, userId] as const,
  mine: (userId?: string) => ['offers-sent', userId] as const,
  received: (userId?: string, listingId?: string) =>
    ['offers-received', userId, listingId ?? 'all'] as const,
  reviewedIds: (userId?: string) => ['reviews', 'mine', userId] as const,
};

export function getBuyerListingOffersOptions(
  listingId: string,
  userId?: string,
  mockOffers: BuyerListingOffer[] = [],
) {
  return queryOptions({
    enabled: !!userId || isMockDataEnabled,
    queryFn: async () => {
      if (isMockDataEnabled)
        return mockOffers;

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('listing_id', listingId)
        .eq('buyer_id', userId!)
        .order('created_at', { ascending: false });
      if (error)
        throw error;
      return (data ?? []) as BuyerListingOffer[];
    },
    queryKey: offersQueryKey.buyerListing(listingId, userId),
  });
}

export function getSentOffersOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => {
      if (isMockDataEnabled) {
        return [
          {
            id: 'mock-of-1',
            amount: 25_000,
            buyer_id: userId || 'mock-buyer',
            counter_amount: 27_000,
            created_at: new Date(Date.now() - 3_600_000 * 5).toISOString(),
            listing_id: 'mock-1',
            listings: {
              brand: 'Chanel',
              images: [
                'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600',
              ],
              price: 28_500,
              title: 'Bleu de Chanel Eau de Parfum',
            },
            message: 'I can do 25k right now if you ship today.',
            seller_id: 'mock-seller-id',
            seller_message: 'Meet me at 27k and it\'s yours.',
            status: 'countered',
            updated_at: new Date(Date.now() - 3_600_000 * 2).toISOString(),
          },
          {
            id: 'mock-of-2',
            amount: 31_000,
            buyer_id: userId || 'mock-buyer',
            counter_amount: null,
            created_at: new Date(Date.now() - 86_400_000 * 2).toISOString(),
            listing_id: 'mock-2',
            listings: {
              brand: 'Nike',
              images: [
                'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
              ],
              price: 35_000,
              title: 'Classic White Sneakers',
            },
            message: 'Immediate pickup from Karachi.',
            seller_id: 'mock-seller-id',
            seller_message: '',
            status: 'accepted',
            updated_at: new Date(Date.now() - 86_400_000).toISOString(),
          },
        ] as OfferListItem[];
      }

      const { data, error } = await supabase
        .from('offers')
        .select('*, listings(title, price, images, brand)')
        .eq('buyer_id', userId!)
        .order('created_at', { ascending: false });
      if (error)
        throw error;
      return (data ?? []) as OfferListItem[];
    },
    queryKey: offersQueryKey.mine(userId),
  });
}

export function getMyReviewedOfferIdsOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => {
      if (isMockDataEnabled)
        return ['mock-reviewed-id-completed'];

      const { data, error } = await supabase
        .from('reviews')
        .select('offer_id')
        .eq('reviewer_id', userId!);
      if (error)
        throw error;
      return (data ?? []).map((row: any) => row.offer_id as string);
    },
    queryKey: offersQueryKey.reviewedIds(userId),
  });
}

export function getReceivedOffersOptions(userId?: string, listingId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => {
      let query = supabase
        .from('offers')
        .select('*, listings(title, price, images, brand)')
        .eq('seller_id', userId!)
        .order('created_at', { ascending: false });
      if (listingId)
        query = query.eq('listing_id', listingId);
      const { data, error } = await query;
      if (error)
        throw error;

      const buyerIds = [...new Set((data ?? []).map((offer: any) => offer.buyer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', buyerIds);
      const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));
      return (data ?? []).map((offer: any) => ({
        ...offer,
        buyer_profile: profileMap.get(offer.buyer_id) ?? null,
      })) as ReceivedOfferListItem[];
    },
    queryKey: offersQueryKey.received(userId, listingId),
  });
}
