import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const isCompleted = complaint.status === "refunded" || complaint.status === "rejected";
  const isReturn =
    complaint.status === "return_in_transit" || complaint.status === "return_received";
  const Icon = isCompleted ? CheckCircle2 : isReturn ? PackageCheck : AlertTriangle;

  const evidence = complaint.evidence_urls ?? [];
  const proofs = complaint.return_proof_urls ?? [];

  return (
    <div className={`mt-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex"
        aria-label="View complaint details"
      >
        <Badge className="cursor-pointer gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25">
          <Icon className="h-3 w-3" />
          {STATUS_LABEL[complaint.status] ?? complaint.status}
        </Badge>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <Icon className="h-5 w-5" />
              {STATUS_LABEL[complaint.status] ?? complaint.status}
            </DialogTitle>
            {complaint.created_at && (
              <DialogDescription>
                Raised {format(new Date(complaint.created_at), "PPp")}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {complaint.reason && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {viewerRole === "seller" ? "Buyer's message" : "Your message"}
                </p>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{complaint.reason}</p>
              </div>
            )}

            {evidence.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Evidence photos ({evidence.length})
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {evidence.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreview(url)}
                      className="h-20 w-20 overflow-hidden rounded-md border border-border bg-background"
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {proofs.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreview(url)}
                      className="h-20 w-20 overflow-hidden rounded-md border border-border bg-background"
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
                <p className="mt-1 text-sm text-muted-foreground">{complaint.admin_notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
