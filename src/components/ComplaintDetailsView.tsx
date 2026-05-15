import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, PackageCheck, CheckCircle2, ImageIcon } from "lucide-react";
import { format } from "date-fns";

const STATUS_LABEL: Record<string, string> = {
  raised: "Complaint Raised",
  under_review: "Under Review",
  return_in_transit: "Return In Transit",
  return_received: "Return Received",
  refunded: "Completed · Refunded",
  rejected: "Completed · Rejected",
};

export interface ComplaintDetailsData {
  id: string;
  status: string;
  reason: string;
  evidence_urls: string[];
  return_proof_urls?: string[] | null;
  return_carrier?: string | null;
  return_tracking?: string | null;
  admin_notes?: string | null;
  created_at?: string;
}

export function ComplaintDetailsView({
  complaint,
  viewerRole,
  className,
}: {
  complaint: ComplaintDetailsData;
  viewerRole: "buyer" | "seller";
  className?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const isCompleted = complaint.status === "refunded" || complaint.status === "rejected";
  const isReturn =
    complaint.status === "return_in_transit" || complaint.status === "return_received";
  const Icon = isCompleted ? CheckCircle2 : isReturn ? PackageCheck : AlertTriangle;

  const evidence = complaint.evidence_urls ?? [];
  const proofs = complaint.return_proof_urls ?? [];

  return (
    <div className={`mt-2 space-y-2 rounded-md border border-border bg-muted/30 p-3 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
          <Icon className="h-3 w-3" />
          {STATUS_LABEL[complaint.status] ?? complaint.status}
        </Badge>
        {complaint.created_at && (
          <span className="text-[11px] text-muted-foreground">
            Raised {format(new Date(complaint.created_at), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {complaint.reason && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {viewerRole === "seller" ? "Buyer's message" : "Your message"}
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{complaint.reason}</p>
        </div>
      )}

      {evidence.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Evidence photos ({evidence.length})
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {evidence.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPreview(url)}
                className="h-16 w-16 overflow-hidden rounded-md border border-border bg-background"
              >
                <img src={url} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {proofs.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <PackageCheck className="h-3 w-3" /> Return proof ({proofs.length})
          </p>
          {(complaint.return_carrier || complaint.return_tracking) && (
            <p className="text-xs text-muted-foreground">
              {complaint.return_carrier ?? ""}
              {complaint.return_tracking ? ` · ${complaint.return_tracking}` : ""}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-2">
            {proofs.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPreview(url)}
                className="h-16 w-16 overflow-hidden rounded-md border border-border bg-background"
              >
                <img src={url} alt={`Return proof ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {isCompleted && complaint.admin_notes && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Admin note
          </p>
          <p className="text-xs text-muted-foreground">{complaint.admin_notes}</p>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Photo</DialogTitle>
          </DialogHeader>
          {preview && (
            <img src={preview} alt="Complaint attachment" className="max-h-[75vh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
