import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageCheck, CheckCircle2 } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  raised: "Complaint Raised",
  under_review: "Under Review",
  return_in_transit: "Return In Transit",
  return_received: "Return Received",
  refunded: "Completed · Refunded",
  rejected: "Completed · Rejected",
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
        .select("id, status, return_carrier, return_tracking, admin_notes")
        .eq("order_id", orderId)
        .eq("listing_id", listingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!complaint) return null;

  const isCompleted = complaint.status === "refunded" || complaint.status === "rejected";
  const isReturn = complaint.status === "return_in_transit" || complaint.status === "return_received";
  const Icon = isCompleted ? CheckCircle2 : isReturn ? PackageCheck : AlertTriangle;

  return (
    <div className="space-y-1">
      <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
        <Icon className="h-3 w-3" />
        {STATUS_LABEL[complaint.status] ?? complaint.status}
        {complaint.return_tracking ? ` · ${complaint.return_tracking}` : ""}
      </Badge>
      {isCompleted && complaint.admin_notes && (
        <p className="max-w-xs text-xs text-muted-foreground">
          <span className="font-semibold">Admin note:</span> {complaint.admin_notes}
        </p>
      )}
    </div>
  );
}
