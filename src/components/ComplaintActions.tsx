import { zodResolver } from '@hookform/resolvers/zod';
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
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { showErrorToast } from '@/lib/errorToast';
import { getUploadedFileUrl, uploadFile } from '@/lib/uploadFile';
import {
  getComplaintDetailsOptions,
  getOrderShipmentOptions,
} from '@/queries/complaint.query';
import { myOrdersQueryKey } from '@/queries/myOrders.query';
import {
  createComplaint,
  submitReturnProof,
} from '@/services/complaints.service';

interface ComplaintActionsProps {
  orderId: string;
  orderItemId: string;
}

const complaintFileSchema = z.custom<File>(value => typeof File !== 'undefined' && value instanceof File);
const raiseComplaintSchema = z.object({
  evidenceFiles: z.array(complaintFileSchema).min(1, 'Please attach at least one photo.'),
  reason: z.string().trim().min(1, 'Please describe the issue.'),
});
const returnProofSchema = z.object({
  carrier: z.string().trim().min(1, 'Please enter the carrier.'),
  expectedDate: z.string().min(1, 'Please select the expected delivery date.').refine(value => value >= new Date().toISOString().slice(0, 10), 'Expected delivery date cannot be in the past.'),
  proofFiles: z.array(complaintFileSchema).min(1, 'Please upload return proof photo(s).'),
  tracking: z.string().trim().min(1, 'Please enter the tracking number.'),
});

type RaiseComplaintFormValues = z.infer<typeof raiseComplaintSchema>;
type ReturnProofFormValues = z.infer<typeof returnProofSchema>;

const emptyRaiseComplaintForm: RaiseComplaintFormValues = { evidenceFiles: [], reason: '' };
const emptyReturnProofForm: ReturnProofFormValues = { carrier: '', expectedDate: '', proofFiles: [], tracking: '' };

async function uploadMediaFiles(files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    const { data } = await uploadFile(file);
    urls.push(getUploadedFileUrl(data));
  }
  return urls;
}

export function ComplaintActions({
  orderId,
  orderItemId,
}: ComplaintActionsProps) {
  const queryClient = useQueryClient();
  const [minimumExpectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const raiseForm = useForm<RaiseComplaintFormValues>({ defaultValues: emptyRaiseComplaintForm, resolver: zodResolver(raiseComplaintSchema) });
  const returnForm = useForm<ReturnProofFormValues>({ defaultValues: emptyReturnProofForm, resolver: zodResolver(returnProofSchema) });

  const { data: complaint, refetch } = useQuery(getComplaintDetailsOptions(orderId, orderItemId));

  const { data: originalShipment } = useQuery(getOrderShipmentOptions(orderId, orderItemId));

  const handleRaise = async (values: RaiseComplaintFormValues) => {
    setBusy(true);
    try {
      const urls = await uploadMediaFiles(values.evidenceFiles);
      await createComplaint({
        orderId,
        orderItemId,
        evidenceUrls: urls,
        reason: values.reason,
      });
      toast.success('Return request submitted for admin review.');
      setRaiseOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to raise complaint');
    }
    finally {
      setBusy(false);
    }
  };

  const handleReturnProof = async (values: ReturnProofFormValues) => {
    if (!complaint)
      return;
    setBusy(true);
    try {
      const urls = await uploadMediaFiles(values.proofFiles);
      await submitReturnProof(complaint.id, {
        expectedReturnDate: new Date(values.expectedDate).toISOString(),
        returnCarrier: values.carrier,
        returnProofUrls: urls,
        returnTracking: values.tracking,
      });
      toast.success('Return proof uploaded. Seller has been notified.');
      setReturnOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to upload return proof');
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

        <Dialog
          onOpenChange={(open) => {
            setReturnOpen(open);
            if (!open)
              returnForm.reset(emptyReturnProofForm);
          }}
          open={returnOpen}
        >
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
            <form onSubmit={returnForm.handleSubmit(handleReturnProof, errors => toast.error(Object.values(errors)[0]?.message ?? 'Check the return shipment fields.'))} className="space-y-3">
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
                  <Controller
                    name="carrier"
                    control={returnForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="return-carrier"
                        placeholder="e.g. PostNet"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="return-tracking">
                    Tracking #
                    {' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="tracking"
                    control={returnForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="return-tracking"
                        placeholder="Tracking number"
                      />
                    )}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="return-expected-date">
                  Expected delivery date
                  {' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="expectedDate"
                  control={returnForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="return-expected-date"
                      min={minimumExpectedDate}
                      type="date"
                    />
                  )}
                />
              </div>
              <div>
                <Label>
                  Return shipment photo(s)
                  {' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Controller name="proofFiles" control={returnForm.control} render={({ field }) => <FilePicker id="return-proof" onChange={field.onChange} files={field.value} label="" />} />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setReturnOpen(false)}
                  disabled={busy}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button disabled={busy} type="submit">
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
            </form>
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

      <Dialog
        onOpenChange={(open) => {
          setRaiseOpen(open);
          if (!open)
            raiseForm.reset(emptyRaiseComplaintForm);
        }}
        open={raiseOpen}
      >
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
          <form onSubmit={raiseForm.handleSubmit(handleRaise, errors => toast.error(Object.values(errors)[0]?.message ?? 'Check the complaint fields.'))} className="space-y-3">
            <div>
              <Label htmlFor="complaint-reason">What's wrong?</Label>
              <Controller
                name="reason"
                control={raiseForm.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="complaint-reason"
                    placeholder="Describe the quality issue (damage, fake, not as described, etc.)"
                    rows={4}
                  />
                )}
              />
            </div>
            <Controller name="evidenceFiles" control={raiseForm.control} render={({ field }) => <FilePicker id="complaint-evidence" onChange={field.onChange} files={field.value} label="Evidence photos" />} />
            <DialogFooter>
              <Button
                onClick={() => setRaiseOpen(false)}
                disabled={busy}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={busy} type="submit">
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
          </form>
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
            key={`${f.name}-${f.size}-${f.lastModified}`}
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
