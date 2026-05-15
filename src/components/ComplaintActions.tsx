import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Truck, Loader2, Upload, X, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { ComplaintDetailsView } from "@/components/ComplaintDetailsView";


interface ComplaintActionsProps {
  orderId: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
}

type Complaint = {
  id: string;
  status: string;
  reason: string;
  evidence_urls: string[];
  return_proof_urls: string[];
  return_carrier: string | null;
  return_tracking: string | null;
  admin_notes: string;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  raised: "Complaint Raised",
  under_review: "Under Review",
  return_in_transit: "Return In Transit",
  return_received: "Return Received",
  refunded: "Completed · Refunded",
  rejected: "Completed · Rejected",
};

const uploadFiles = async (files: File[], folder: string) => {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("return-proofs")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("return-proofs").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
};

export function ComplaintActions({ orderId, listingId, sellerId, buyerId }: ComplaintActionsProps) {
  const queryClient = useQueryClient();
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [reason, setReason] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  const { data: complaint, refetch } = useQuery({
    queryKey: ["complaint", orderId, listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, status, reason, evidence_urls, return_proof_urls, return_carrier, return_tracking, admin_notes, created_at, updated_at")
        .eq("order_id", orderId)
        .eq("listing_id", listingId)
        .maybeSingle();
      if (error) throw error;
      return (data as Complaint | null) ?? null;
    },
  });

  useEffect(() => {
    if (!raiseOpen) {
      setReason("");
      setEvidenceFiles([]);
    }
  }, [raiseOpen]);

  useEffect(() => {
    if (!returnOpen) {
      setProofFiles([]);
      setCarrier("");
      setTracking("");
    }
  }, [returnOpen]);

  const handleRaise = async () => {
    if (!reason.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    if (evidenceFiles.length === 0) {
      toast.error("Please attach at least one photo");
      return;
    }
    setBusy(true);
    try {
      const urls = await uploadFiles(evidenceFiles, `${buyerId}/complaints/${orderId}-${listingId}/evidence`);
      const { error } = await supabase.from("complaints").insert({
        order_id: orderId,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        reason: reason.trim(),
        evidence_urls: urls,
        status: "raised",
      });
      if (error) throw error;
      toast.success("Complaint raised. Admin has been alerted.");
      setRaiseOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to raise complaint");
    } finally {
      setBusy(false);
    }
  };

  const handleReturnProof = async () => {
    if (!complaint) return;
    if (proofFiles.length === 0) {
      toast.error("Please upload return proof photo(s)");
      return;
    }
    setBusy(true);
    try {
      const urls = await uploadFiles(proofFiles, `${buyerId}/complaints/${orderId}-${listingId}/return`);
      const { error } = await supabase
        .from("complaints")
        .update({
          return_proof_urls: [...(complaint.return_proof_urls ?? []), ...urls],
          return_carrier: carrier.trim() || null,
          return_tracking: tracking.trim() || null,
          status: "return_in_transit",
        })
        .eq("id", complaint.id);
      if (error) throw error;
      toast.success("Return proof uploaded. Seller has been notified.");
      setReturnOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to upload return proof");
    } finally {
      setBusy(false);
    }
  };

  // Already-resolved states
  if (complaint && (complaint.status === "refunded" || complaint.status === "rejected" || complaint.status === "return_received")) {
    return (
      <div className="mt-2 space-y-1">
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {STATUS_LABEL[complaint.status] ?? complaint.status}
        </Badge>
        {(complaint.status === "refunded" || complaint.status === "rejected") && complaint.admin_notes && (
          <p className="max-w-md text-xs text-muted-foreground">
            <span className="font-semibold">Admin note:</span> {complaint.admin_notes}
          </p>
        )}
      </div>
    );
  }

  // Active complaint
  if (complaint) {
    const isRaised = complaint.status === "raised";
    return (
      <>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            {STATUS_LABEL[complaint.status] ?? complaint.status}
          </Badge>
          {isRaised && (
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setReturnOpen(true)}>
              <Truck className="h-3 w-3" />
              Upload return proof
            </Button>
          )}
          {complaint.status === "return_in_transit" && (
            <span className="text-xs text-muted-foreground">
              Awaiting seller / admin confirmation
              {complaint.return_tracking ? ` · Tracking ${complaint.return_tracking}` : ""}
            </span>
          )}
        </div>

        <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-heading">
                <PackageCheck className="h-5 w-5" /> Upload return proof
              </DialogTitle>
              <DialogDescription>
                Attach a photo of the return shipment receipt or parcel. Once submitted, the order moves to “Return In
                Transit” and the seller is notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="return-carrier">Carrier (optional)</Label>
                  <Input
                    id="return-carrier"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g. PostNet"
                  />
                </div>
                <div>
                  <Label htmlFor="return-tracking">Tracking # (optional)</Label>
                  <Input
                    id="return-tracking"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Tracking number"
                  />
                </div>
              </div>
              <FilePicker
                id="return-proof"
                label="Return shipment photo(s)"
                files={proofFiles}
                onChange={setProofFiles}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setReturnOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleReturnProof} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                Mark as Return In Transit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // No complaint yet — show entry button
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="mt-2 h-7 gap-1 text-xs text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
        onClick={() => setRaiseOpen(true)}
      >
        <AlertTriangle className="h-3 w-3" />
        Inadequate Quality
      </Button>

      <Dialog open={raiseOpen} onOpenChange={setRaiseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Raise a quality complaint
            </DialogTitle>
            <DialogDescription>
              Tell us what's wrong with the item and attach clear photos. Our admin team will be alerted and review your
              report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="complaint-reason">What's wrong?</Label>
              <Textarea
                id="complaint-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the quality issue (damage, fake, not as described, etc.)"
              />
            </div>
            <FilePicker
              id="complaint-evidence"
              label="Evidence photos"
              files={evidenceFiles}
              onChange={setEvidenceFiles}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRaiseOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleRaise} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Raise complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilePicker({
  id,
  label,
  files,
  onChange,
}: {
  id: string;
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {files.map((f, i) => (
          <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-border bg-muted">
            <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              className="absolute right-0 top-0 rounded-bl-md bg-background/80 p-0.5 text-foreground"
              onClick={() => onChange(files.filter((_, idx) => idx !== i))}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label
          htmlFor={id}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:bg-muted"
        >
          <Upload className="h-4 w-4" />
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            onChange([...files, ...list]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
