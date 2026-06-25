import { Flag, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type ReportTargetType = 'listing' | 'message' | 'user';

const REASONS: Record<ReportTargetType, { label: string; value: string }[]> = {
  listing: [
    { label: 'Counterfeit / fake item', value: 'counterfeit' },
    { label: 'Prohibited item', value: 'prohibited' },
    { label: 'Misleading description or photos', value: 'misleading' },
    { label: 'Inappropriate content', value: 'inappropriate' },
    { label: 'Spam or duplicate', value: 'spam' },
    { label: 'Other', value: 'other' },
  ],
  message: [
    { label: 'Harassment or abuse', value: 'harassment' },
    { label: 'Scam attempt', value: 'scam' },
    { label: 'Sharing off-platform contact', value: 'off_platform' },
    { label: 'Inappropriate content', value: 'inappropriate' },
    { label: 'Other', value: 'other' },
  ],
  user: [
    { label: 'Fraud or scam', value: 'fraud' },
    { label: 'Harassment or abuse', value: 'harassment' },
    { label: 'Impersonation', value: 'impersonation' },
    { label: 'Trying to take deal off-platform', value: 'off_platform' },
    { label: 'Other', value: 'other' },
  ],
};

const reportSchema = z.object({
  details: z.string().trim().max(1000, 'Details must be under 1000 characters'),
  reason: z.string().trim().min(1, 'Please choose a reason'),
});

interface ReportDialogProps {
  targetId: string;
  label?: string;
  targetType: ReportTargetType;
  trigger?: React.ReactNode;
}

export function ReportDialog({
  targetId,
  label = 'Report',
  targetType,
  trigger,
}: ReportDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to report');
      navigate('/auth');
      return;
    }
    const parsed = reportSchema.safeParse({ details, reason });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      details: parsed.data.details,
      reason: parsed.data.reason,
      reporter_id: user.id,
      target_id: targetId,
      target_type: targetType,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not submit report');
      return;
    }
    toast.success('Report submitted. Our team will review it shortly.');
    setReason('');
    setDetails('');
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            variant="ghost"
            className="
              gap-1.5 text-muted-foreground
              hover:text-destructive
            "
          >
            <Flag className="h-4 w-4" />
            {' '}
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Report
            {targetType}
          </DialogTitle>
          <DialogDescription>
            Help us keep the marketplace safe. Reports are reviewed by our
            moderation team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS[targetType].map(r => (
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
              onChange={event => setDetails(event.target.value)}
              value={details}
              maxLength={1000}
              placeholder="Anything else our team should know..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {details.length}
              /1000
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => setOpen(false)}
            disabled={submitting}
            variant="outline"
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
}
