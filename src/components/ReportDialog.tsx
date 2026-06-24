import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type ReportTargetType = "user" | "listing" | "message";

const REASONS: Record<ReportTargetType, { value: string; label: string }[]> = {
  listing: [
    { value: "counterfeit", label: "Counterfeit / fake item" },
    { value: "prohibited", label: "Prohibited item" },
    { value: "misleading", label: "Misleading description or photos" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "spam", label: "Spam or duplicate" },
    { value: "other", label: "Other" },
  ],
  user: [
    { value: "fraud", label: "Fraud or scam" },
    { value: "harassment", label: "Harassment or abuse" },
    { value: "impersonation", label: "Impersonation" },
    { value: "off_platform", label: "Trying to take deal off-platform" },
    { value: "other", label: "Other" },
  ],
  message: [
    { value: "harassment", label: "Harassment or abuse" },
    { value: "scam", label: "Scam attempt" },
    { value: "off_platform", label: "Sharing off-platform contact" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "other", label: "Other" },
  ],
};

const reportSchema = z.object({
  reason: z.string().trim().min(1, "Please choose a reason"),
  details: z.string().trim().max(1000, "Details must be under 1000 characters"),
});

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  trigger?: React.ReactNode;
  label?: string;
}

export const ReportDialog = ({
  targetType,
  targetId,
  trigger,
  label = "Report",
}: ReportDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to report");
      navigate("/auth");
      return;
    }
    const parsed = reportSchema.safeParse({ reason, details });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit report");
      return;
    }
    toast.success("Report submitted. Our team will review it shortly.");
    setReason("");
    setDetails("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Flag className="h-4 w-4" /> {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>
            Help us keep the marketplace safe. Reports are reviewed by our
            moderation team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS[targetType].map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Additional details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything else our team should know..."
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {details.length}/1000
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
