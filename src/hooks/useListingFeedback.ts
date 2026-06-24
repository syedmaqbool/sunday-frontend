import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

export interface FeedbackEntry {
  id: string;
  listing_id: string;
  admin_id: string;
  feedback: string;
  created_at: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FEEDBACK: Record<string, FeedbackEntry[]> = {
  "mock-listing-4": [
    {
      id: "fb-1",
      listing_id: "mock-listing-4",
      admin_id: "admin-mock-id",
      feedback:
        "Photos are blurry and don't clearly show any wear or tear. Please re-upload clearer images before resubmitting.",
      created_at: "2026-06-06T10:00:00.000Z",
    },
  ],
};

export const useListingFeedback = (listingId: string | undefined) => {
  return useQuery({
    queryKey: ["listing-feedback", listingId],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return MOCK_FEEDBACK[listingId!] ?? [];
      }
      const { data, error } = await supabase
        .from("listing_feedback")
        .select("*")
        .eq("listing_id", listingId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FeedbackEntry[];
    },
    enabled: !!listingId,
  });
};
