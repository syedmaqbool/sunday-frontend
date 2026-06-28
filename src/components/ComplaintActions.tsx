import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  Loader2,
  PackageCheck,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ComplaintDetailsView } from '@/components/ComplaintDetailsView';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getComplaintDetailsOptions,
  getOrderShipmentOptions,
} from '@/queries/useComplaint';
import {
  createComplaint,
  submitReturnProof,
  uploadComplaintMedia,
} from '@/services/complaints.service';

interface ComplaintActionsProps {
  orderId: string;
  orderItemId: string;
}

async function uploadMediaFiles(files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    const { data } = await uploadComplaintMedia(file);
    urls.push(data.url);
  }
  return urls;
}

export function ComplaintActions({
  orderId,
  orderItemId,
}: ComplaintActionsProps) {
  const queryClient = useQueryClient();
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [reason, setReason] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  const { data: complaint, refetch } = useQuery(
    getComplaintDetailsOptions(orderId, orderItemId),
  );

  const { data: originalShipment } = useQuery(
    getOrderShipmentOptions(orderId, orderItemId),
  );

  useEffect(() => {
    if (raiseOpen) {
      return;
    }

    setReason('');
    setEvidenceFiles([]);
  }, [raiseOpen]);

  useEffect(() => {
    if (returnOpen) {
      return;
    }

    setProofFiles([]);
    setCarrier('');
    setTracking('');
    setExpectedDate('');
  }, [returnOpen]);

  const handleRaise = async () => {
    if (!reason.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    if (evidenceFiles.length === 0) {
      toast.error('Please attach at least one photo');
      return;
    }
    setBusy(true);
    try {
      const urls = await uploadMediaFiles(evidenceFiles);
      await createComplaint({
        orderId,
        orderItemId,
        evidenceUrls: urls,
        reason: reason.trim(),
      });
      toast.success('Return request submitted for admin review.');
      setRaiseOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    }
    catch (error: any) {
      toast.error(error.message ?? 'Failed to raise complaint');
    }
    finally {
      setBusy(false);
    }
  };

  const handleReturnProof = async () => {
    if (!complaint)
      return;
    if (!carrier.trim()) {
      toast.error('Please enter the carrier');
      return;
    }
    if (!tracking.trim()) {
      toast.error('Please enter the tracking number');
      return;
    }
    if (!expectedDate) {
      toast.error('Please select the expected delivery date');
      return;
    }
    if (proofFiles.length === 0) {
      toast.error('Please upload return proof photo(s)');
      return;
    }
    setBusy(true);
    try {
      const urls = await uploadMediaFiles(proofFiles);
      await submitReturnProof(complaint.id, {
        expectedReturnDate: new Date(expectedDate).toISOString(),
        returnCarrier: carrier.trim(),
        returnProofUrls: urls,
        returnTracking: tracking.trim(),
      });
      toast.success('Return proof uploaded. Seller has been notified.');
      setReturnOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    }
    catch (error: any) {
      toast.error(error.message ?? 'Failed to upload return proof');
    }
    finally {
      setBusy(false);
    }
  };

  if (
    complaint
    && ['REFUNDED', 'REJECTED', 'RETURN_RECEIVED'].includes(complaint.status)
  ) {
    return <ComplaintDetailsView complaint={complaint} viewerRole="buyer" />;
  }

  if (complaint) {
    return (
      <>
        <ComplaintDetailsView complaint={complaint} viewerRole="buyer" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {['RAISED', 'UNDER_REVIEW'].includes(complaint.status) && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Awaiting admin review
            </span>
          )}
          {complaint.status === 'RETURN_APPROVED' && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Approved — waiting for seller's return address
            </span>
          )}
          {complaint.status === 'RETURN_ADDRESS_PROVIDED' && (
            <Button
              onClick={() => setReturnOpen(true)}
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
            >
              <Truck className="h-3 w-3" />
              Mark return as shipped
            </Button>
          )}
          {complaint.status === 'RETURN_IN_TRANSIT' && (
            <span className="text-xs text-muted-foreground">
              Awaiting seller / admin confirmation
              {complaint.returnTracking
                ? ` · Tracking ${complaint.returnTracking}`
                : ''}
            </span>
          )}
        </div>

        <Dialog onOpenChange={setReturnOpen} open={returnOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-heading">
                <PackageCheck className="h-5 w-5" />
                {' '}
                Mark return as shipped
              </DialogTitle>
              <DialogDescription>
                Provide the carrier, tracking number, expected delivery date and
                at least one shipment photo. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {originalShipment?.expectedDelivery && (
                <div className="rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
                  Original shipment ETA was
                  {' '}
                  <span className="font-medium text-foreground">
                    {new Date(
                      originalShipment.expectedDelivery,
                    ).toLocaleDateString()}
                  </span>
                  . Please pick a realistic return delivery date.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="return-carrier">
                    Carrier
                    {' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="return-carrier"
                    onChange={event => setCarrier(event.target.value)}
                    value={carrier}
                    placeholder="e.g. PostNet"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="return-tracking">
                    Tracking #
                    {' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="return-tracking"
                    onChange={event => setTracking(event.target.value)}
                    value={tracking}
                    placeholder="Tracking number"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="return-expected-date">
                  Expected delivery date
                  {' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="return-expected-date"
                  onChange={event => setExpectedDate(event.target.value)}
                  value={expectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  required
                  type="date"
                />
              </div>
              <div>
                <Label>
                  Return shipment photo(s)
                  {' '}
                  <span className="text-destructive">*</span>
                </Label>
                <FilePicker
                  id="return-proof"
                  onChange={setProofFiles}
                  files={proofFiles}
                  label=""
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setReturnOpen(false)}
                disabled={busy}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button onClick={handleReturnProof} disabled={busy}>
                {busy
                  ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )
                  : (
                      <Truck className="mr-2 h-4 w-4" />
                    )}
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
        onClick={() => setRaiseOpen(true)}
        size="sm"
        variant="ghost"
        className="
          mt-2 h-7 gap-1 text-xs text-amber-700
          hover:bg-amber-500/10 hover:text-amber-800
        "
      >
        <AlertTriangle className="h-3 w-3" />
        Inadequate Quality
      </Button>

      <Dialog onOpenChange={setRaiseOpen} open={raiseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {' '}
              Raise a
              quality complaint
            </DialogTitle>
            <DialogDescription>
              Tell us what's wrong with the item and attach clear photos. Our
              admin team will review your return request before the seller is
              involved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="complaint-reason">What's wrong?</Label>
              <Textarea
                id="complaint-reason"
                onChange={event => setReason(event.target.value)}
                value={reason}
                placeholder="Describe the quality issue (damage, fake, not as described, etc.)"
                rows={4}
              />
            </div>
            <FilePicker
              id="complaint-evidence"
              onChange={setEvidenceFiles}
              files={evidenceFiles}
              label="Evidence photos"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setRaiseOpen(false)}
              disabled={busy}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button onClick={handleRaise} disabled={busy}>
              {busy
                ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )
                : (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  )}
              Submit for review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilePicker({
  id,
  files,
  label,
  onChange,
}: {
  id: string;
  files: File[];
  label: string;
  onChange: (files: File[]) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {files.map((f, index) => (
          <div
            key={index}
            className="relative h-16 w-16 overflow-hidden rounded-md border border-border bg-muted"
          >
            <img
              src={URL.createObjectURL(f)}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => onChange(files.filter((_, index_) => index_ !== index))}
              type="button"
              className="absolute right-0 top-0 rounded-bl-md bg-background/80 p-0.5 text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label
          htmlFor={id}
          className="
            flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-muted-foreground
            hover:bg-muted
          "
        >
          <Upload className="h-4 w-4" />
        </label>
        <input
          id={id}
          onChange={(event) => {
            const list = [...event.target.files ?? []];
            onChange([...files, ...list]);
            event.target.value = '';
          }}
          accept="image/*"
          multiple
          type="file"
          className="hidden"
        />
      </div>
    </div>
  );
}
