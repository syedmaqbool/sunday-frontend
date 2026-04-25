import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageCheck } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  raised: "Complaint Raised",
  return_in_transit: "Return In Transit",
  return_received: "Return Received",
  refunded: "Refunded",
  rejected: "Complaint Rejected",
};

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
        .select("id, status, return_carrier, return_tracking")
        .eq("order_id", orderId)
        .eq("listing_id", listingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!complaint) return null;

  const isReturn = complaint.status === "return_in_transit" || complaint.status === "return_received";
  const Icon = isReturn ? PackageCheck : AlertTriangle;

  return (
    <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
      <Icon className="h-3 w-3" />
      {STATUS_LABEL[complaint.status] ?? complaint.status}
      {complaint.return_tracking ? ` · ${complaint.return_tracking}` : ""}
    </Badge>
  );
}
