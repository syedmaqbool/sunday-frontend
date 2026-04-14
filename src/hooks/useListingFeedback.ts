import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeedbackEntry {
  id: string;
  listing_id: string;
  admin_id: string;
  feedback: string;
  created_at: string;
}

export const useListingFeedback = (listingId: string | undefined) => {
  return useQuery({
    queryKey: ["listing-feedback", listingId],
    queryFn: async () => {
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
