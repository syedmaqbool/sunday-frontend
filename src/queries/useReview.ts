import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewListItem {
  id: string;
  comment: string;
  created_at: string;
  image_urls: string[] | null;
  listing: { title: string } | null;
  rating: number;
  reviewer_profile: { full_name: string | null } | null;
  role: string;
  video_url: string | null;
}

export const reviewQueryKey = {
  orderItem: (orderId: string, listingId: string, userId?: string) =>
    ['order-review', orderId, listingId, userId] as const,
  userReviews: (userId: string) => ['reviews', userId] as const,
};

export function getOrderItemReviewOptions(
  orderId: string,
  listingId: string,
  userId?: string,
  sellerId?: string,
) {
  return queryOptions({
    enabled: !!userId && !!sellerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating')
        .eq('reviewer_id', userId!)
        .eq('order_id', orderId)
        .eq('listing_id', listingId)
        .maybeSingle();
      if (error)
        throw error;
      return data;
    },
    queryKey: reviewQueryKey.orderItem(orderId, listingId, userId),
  });
}

export function getUserReviewsOptions(userId: string, limit = 10) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error)
        throw error;

      const reviewerIds = [...new Set((data ?? []).map((review: any) => review.reviewer_id))];
      const listingIds = [...new Set((data ?? []).map((review: any) => review.listing_id))];

      const [profilesResponse, listingsResponse] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', reviewerIds),
        supabase.from('listings').select('id, title').in('id', listingIds),
      ]);

      const profileMap = new Map((profilesResponse.data ?? []).map(profile => [profile.id, profile]));
      const listingMap = new Map((listingsResponse.data ?? []).map(listing => [listing.id, listing]));

      return (data ?? []).map((review: any) => ({
        ...review,
        listing: listingMap.get(review.listing_id) ?? null,
        reviewer_profile: profileMap.get(review.reviewer_id) ?? null,
      })) as ReviewListItem[];
    },
    queryKey: reviewQueryKey.userReviews(userId),
  });
}
