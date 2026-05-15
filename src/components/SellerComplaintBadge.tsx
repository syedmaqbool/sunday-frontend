import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComplaintDetailsView } from "@/components/ComplaintDetailsView";

export function SellerComplaintBadge({
  orderId,
  listingId,
}: {
  orderId: string;
  listingId: string;
}) {
  const { data: complaint } = useQuery({
    queryKey: ["complaint", orderId, listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select(
          "id, status, reason, evidence_urls, return_proof_urls, return_carrier, return_tracking, admin_notes, created_at",
        )
        .eq("order_id", orderId)
        .eq("listing_id", listingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!complaint) return null;

  return <ComplaintDetailsView complaint={complaint as any} viewerRole="seller" />;
}
