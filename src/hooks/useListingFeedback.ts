import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

export interface FeedbackEntry {
  id: string;
  admin_id: string;
  created_at: string;
  feedback: string;
  listing_id: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FEEDBACK: Record<string, FeedbackEntry[]> = {
  'mock-listing-4': [
    {
      id: 'fb-1',
      admin_id: 'admin-mock-id',
      created_at: '2026-06-06T10:00:00.000Z',
      feedback:
        'Photos are blurry and don\'t clearly show any wear or tear. Please re-upload clearer images before resubmitting.',
      listing_id: 'mock-listing-4',
    },
  ],
};

export function useListingFeedback(listingId: string | undefined) {
  return useQuery({
    enabled: !!listingId,
    queryFn: async () => {
      if (isMockDataEnabled) {
        return MOCK_FEEDBACK[listingId!] ?? [];
      }
      const { data, error } = await supabase
        .from('listing_feedback')
        .select('*')
        .eq('listing_id', listingId!)
        .order('created_at', { ascending: false });
      if (error)
        throw error;
      return (data ?? []) as FeedbackEntry[];
    },
    queryKey: ['listing-feedback', listingId],
  });
}
