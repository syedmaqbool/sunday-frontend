import type { Listing } from '@/lib/constants';
import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DUMMY_LISTINGS, isMockDataEnabled } from '@/lib/mockConfig';

export interface SellerProfileRecord {
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  full_name?: string | null;
  id: string;
  location?: string | null;
  phone?: string | null;
}

const LISTING_FALLBACK_IMAGE
  = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600';

function mapPublicListing(row: any): Listing {
  return {
    id: row.id,
    admin_feedback: row.admin_feedback,
    brand: row.brand,
    category: row.category,
    condition: row.condition,
    created_at: row.created_at,
    description: row.description,
    images: row.images?.length ? row.images : [LISTING_FALLBACK_IMAGE],
    price: row.price,
    reserved_for: row.reserved_for,
    reserved_offer_id: row.reserved_offer_id,
    reserved_until: row.reserved_until,
    seller_id: row.seller_id,
    seller_name: row.seller_name ?? 'Seller',
    size: row.size,
    status: row.status,
    title: row.title,
    weight: row.weight,
  };
}

function mapMockListing(row: any, sellerName = 'Mock Seller'): Listing {
  return {
    ...row,
    created_at: new Date().toISOString(),
    images: [row.image_url],
    seller_name: sellerName,
    status: row.status || 'approved',
  } as unknown as Listing;
}

export const marketplaceQueryKey = {
  editListing: (listingId?: string) => ['edit-listing', listingId] as const,
  featuredListings: () => ['featured-listings'] as const,
  listing: (listingId?: string) => ['listing', listingId] as const,
  listings: () => ['listings'] as const,
  reservedOfferAmount: (offerId?: string | null) =>
    ['reserved-offer-amount', offerId] as const,
  sellerListings: (sellerId?: string) => ['seller-listings', sellerId] as const,
  sellerProfile: (sellerId?: string) => ['seller-profile', sellerId] as const,
  trendingListings: () => ['trending-listings'] as const,
};

export async function fetchMarketplaceListings(): Promise<Listing[]> {
  if (isMockDataEnabled) {
    return DUMMY_LISTINGS.map(row => mapMockListing(row));
  }

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .in('status', ['approved', 'reserved'])
    .order('created_at', { ascending: false });
  if (error)
    throw error;

  return (data ?? []).map((row: any) => mapPublicListing(row));
}

export async function fetchMarketplaceListing(listingId: string): Promise<Listing | null> {
  if (isMockDataEnabled) {
    const match = DUMMY_LISTINGS.find(item => String(item.id) === listingId);
    return match ? mapMockListing(match) : null;
  }

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .maybeSingle();

  if (error || !data)
    return null;

  return mapPublicListing(data);
}

export function getMarketplaceListingsOptions() {
  return queryOptions({
    queryFn: fetchMarketplaceListings,
    queryKey: marketplaceQueryKey.listings(),
  });
}

export function getMarketplaceListingOptions(listingId?: string) {
  return queryOptions({
    enabled: !!listingId,
    queryFn: () => fetchMarketplaceListing(listingId!),
    queryKey: marketplaceQueryKey.listing(listingId),
  });
}

export function getReservedOfferAmountOptions(
  offerId?: string | null,
  enabled = false,
) {
  return queryOptions({
    enabled,
    queryFn: async () => {
      if (isMockDataEnabled)
        return null;

      const { data, error } = await supabase
        .from('offers')
        .select('amount')
        .eq('id', offerId!)
        .maybeSingle();
      if (error || !data)
        return null;
      return Number(data.amount);
    },
    queryKey: marketplaceQueryKey.reservedOfferAmount(offerId),
  });
}

export function getFeaturedListingsOptions() {
  return queryOptions({
    queryFn: async (): Promise<Listing[]> => {
      if (isMockDataEnabled) {
        return DUMMY_LISTINGS.map(item => mapMockListing(item));
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12);
      if (error)
        throw error;
      return (data ?? []).map((row: any) =>
        mapPublicListing({ ...row, seller_name: 'Seller' }));
    },
    queryKey: marketplaceQueryKey.featuredListings(),
  });
}

export function getTrendingListingsOptions() {
  return queryOptions({
    queryFn: async (): Promise<Listing[]> => {
      if (isMockDataEnabled) {
        return DUMMY_LISTINGS.map(item => mapMockListing(item, 'Trending Mock Seller'));
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .order('price', { ascending: false })
        .limit(6);
      if (error)
        throw error;
      return (data ?? []).map((row: any) =>
        mapPublicListing({ ...row, seller_name: 'Seller' }));
    },
    queryKey: marketplaceQueryKey.trendingListings(),
  });
}

export function getEditListingOptions(listingId?: string, userId?: string) {
  return queryOptions({
    enabled: !!listingId,
    queryFn: async () => {
      if (isMockDataEnabled) {
        return {
          id: listingId,
          brand: 'Zara',
          category: 'women-clothing',
          condition: 'like_new',
          description: 'Stunning limited variant tailored jacket.',
          images: [
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
          ],
          price: 18_500,
          seller_id: userId || 'mock-seller',
          size: 'M',
          title: 'Premium Designer Jacket',
          weight: 0.5,
        };
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId!)
        .single();
      if (error)
        throw error;
      return data;
    },
    queryKey: marketplaceQueryKey.editListing(listingId),
  });
}

export function getSellerProfileOptions(sellerId?: string) {
  return queryOptions({
    enabled: !!sellerId,
    queryFn: async (): Promise<SellerProfileRecord | null> => {
      if (isMockDataEnabled) {
        return {
          id: sellerId || 'mock-seller-id',
          avatar_url:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          bio: 'Specializing in premium perfumes, authentic streetwear, and high-end tech accessories. Fast shipping across Pakistan!',
          created_at: '2024-01-15T00:00:00.000Z',
          full_name: 'Premium Seller Pro',
          location: 'Karachi, Pakistan',
          phone: '+92 300 1234567',
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId!)
        .maybeSingle();
      if (error)
        throw error;
      return data;
    },
    queryKey: marketplaceQueryKey.sellerProfile(sellerId),
  });
}

export function getSellerListingsOptions(
  sellerId?: string,
  sellerName?: string | null,
  enabled = false,
) {
  return queryOptions({
    enabled,
    queryFn: async (): Promise<Listing[]> => {
      if (isMockDataEnabled) {
        const resolvedSellerId = sellerId || 'mock-seller-id';
        return [
          {
            id: 'mock-list-1',
            brand: 'Chanel',
            category: 'perfumes',
            condition: 'Like New',
            created_at: new Date().toISOString(),
            description:
              'Partially used premium scent. 90ml remaining out of 100ml. Authentic box included.',
            images: [
              'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600',
            ],
            price: 28_500,
            seller_id: resolvedSellerId,
            seller_name: 'Premium Seller Pro',
            size: '90ml',
            status: 'approved',
            title: 'Bleu de Chanel Eau de Parfum',
            weight: 0.3,
          },
          {
            id: 'mock-list-2',
            brand: 'Redragon',
            category: 'electronics',
            condition: 'Good',
            created_at: new Date().toISOString(),
            description:
              'RGB backlit mechanical keyboard with red switches. Perfect condition.',
            images: [
              'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
            ],
            price: 8500,
            seller_id: resolvedSellerId,
            seller_name: 'Premium Seller Pro',
            size: 'Standard',
            status: 'approved',
            title: 'Mechanical Gaming Keyboard',
            weight: 0.9,
          },
          {
            id: 'mock-list-3',
            brand: 'Outfitters',
            category: 'clothing',
            condition: 'Good',
            created_at: new Date().toISOString(),
            description:
              'Comfortable drop-shoulder cotton t-shirt. Worn only twice.',
            images: [
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600',
            ],
            price: 2400,
            seller_id: resolvedSellerId,
            seller_name: 'Premium Seller Pro',
            size: 'XL',
            status: 'sold',
            title: 'Oversized Vintage Graphic Tee',
            weight: 0.25,
          },
        ];
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sellerId!)
        .in('status', ['approved', 'sold'])
        .order('created_at', { ascending: false });
      if (error)
        throw error;
      return (data ?? []).map((row: any) => ({
        ...mapPublicListing(row),
        seller_name: sellerName || 'Seller',
      }));
    },
    queryKey: marketplaceQueryKey.sellerListings(sellerId),
  });
}
