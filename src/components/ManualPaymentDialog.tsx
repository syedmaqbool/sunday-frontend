import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ImageUp, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Progress } from '@/components/ui/progress';
import {
  getPaymentInstructionsOptions,
  useUploadPaymentProofMutation,
} from '@/queries/checkout.query';

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

export const manualPaymentSchema = z.object({
  screenshot: z
    .custom<File>(value => typeof File !== 'undefined' && value instanceof File, 'Transaction screenshot is required.')
    .refine(file => SUPPORTED_IMAGE_TYPES.has(file.type), 'Use a JPEG, PNG, or WebP image.')
    .refine(file => file.size <= MAX_PROOF_SIZE, 'Screenshot must be 5 MB or smaller.'),
  senderAccountNumber: z
    .string()
    .trim()
    .min(1, 'Sender account number is required.')
    .max(100, 'Sender account number is too long.'),
  senderAccountTitle: z
    .string()
    .trim()
    .min(1, 'Sender account title/name is required.')
    .max(255, 'Sender account title/name is too long.'),
});

export type ManualPaymentFormValues = z.infer<typeof manualPaymentSchema>;

export interface ManualPaymentSubmissionValues {
  proofFileId: string;
  senderAccountNumber: string;
  senderAccountTitle: string;
}

interface ManualPaymentDialogProps {
  error?: string | null;
  mode?: 'create' | 'resubmit';
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ManualPaymentSubmissionValues) => Promise<void>;
  open: boolean;
  submitting?: boolean;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message)
    return error.message;

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string' && message)
      return message;
  }

  return fallback;
}

export function ManualPaymentDialog({
  error,
  mode = 'create',
  onOpenChange,
  onSubmit,
  open,
  submitting = false,
}: ManualPaymentDialogProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploaded' | 'uploading'>('idle');
  const uploadInFlight = useRef(false);
  const uploadPaymentProof = useUploadPaymentProofMutation();
  const { data: instructionsResponse, error: instructionsError, isLoading: loadingInstructions } = useQuery({
    ...getPaymentInstructionsOptions(),
    enabled: open,
  });
  const instructions = instructionsResponse?.data;
  const form = useForm<ManualPaymentFormValues>({
    defaultValues: {
      screenshot: undefined,
      senderAccountNumber: '',
      senderAccountTitle: '',
    },
    mode: 'all',
    resolver: zodResolver(manualPaymentSchema),
  });
  const { control, formState: { errors }, handleSubmit } = form;
  const busy = submitting || uploadInFlight.current || uploadPaymentProof.isPending;

  const handlePaymentSubmit: SubmitHandler<ManualPaymentFormValues> = async (values) => {
    if (uploadInFlight.current || submitting)
      return;

    uploadInFlight.current = true;
    setUploadError(null);
    setUploadProgress(15);
    setUploadStatus('uploading');
    let proofUploaded = false;

    try {
      const response = await uploadPaymentProof.mutateAsync(values.screenshot);
      const proofFileId = response.data?.id;
      if (!proofFileId)
        throw new Error('The screenshot upload did not return a file ID.');

      setUploadProgress(100);
      setUploadStatus('uploaded');
      proofUploaded = true;
      await onSubmit({
        proofFileId,
        senderAccountNumber: values.senderAccountNumber.trim(),
        senderAccountTitle: values.senderAccountTitle.trim(),
      });
    }
    catch (submissionError) {
      if (!proofUploaded)
        setUploadStatus('idle');
      setUploadError(errorMessage(submissionError, 'Payment could not be submitted.'));
    }
    finally {
      uploadInFlight.current = false;
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && busy)
      return;
    onOpenChange(nextOpen);
  };

  const displayedError = uploadError ?? error;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="
        max-h-[90vh] overflow-y-auto
        sm:max-w-lg
      "
      >
        <DialogHeader>
          <DialogTitle>{mode === 'resubmit' ? 'Resubmit payment proof' : 'Complete manual payment'}</DialogTitle>
          <DialogDescription>
            {mode === 'resubmit'
              ? 'Send updated sender details and a new transaction screenshot for the store to review.'
              : 'Transfer the order total to the account below, then send the account details and transaction screenshot.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
          <h3 className="font-medium text-foreground">Payment instructions</h3>
          {loadingInstructions
            ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading payment instructions...
                </div>
              )
            : instructionsError
              ? (
                  <p className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {errorMessage(instructionsError, 'Payment instructions could not be loaded.')}
                  </p>
                )
              : instructions
                ? (
                    <dl className="
                      grid gap-2 text-sm
                      sm:grid-cols-3
                    "
                    >
                      <div>
                        <dt className="text-muted-foreground">Bank or wallet</dt>
                        <dd className="font-medium text-foreground">{instructions.bankOrWalletLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Account title</dt>
                        <dd className="font-medium text-foreground">{instructions.accountTitle}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Account number</dt>
                        <dd className="font-medium text-foreground">{instructions.accountNumber}</dd>
                      </div>
                    </dl>
                  )
                : <p className="text-sm text-muted-foreground">Payment instructions are unavailable.</p>}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderAccountTitle">Sender account title/name</Label>
            <Controller
              name="senderAccountTitle"
              control={control}
              render={({ field }) => <Input id="senderAccountTitle" placeholder="Your account title or name" {...field} />}
            />
            {errors.senderAccountTitle && <p className="text-sm text-destructive">{errors.senderAccountTitle.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderAccountNumber">Sender account number</Label>
            <Controller
              name="senderAccountNumber"
              control={control}
              render={({ field }) => <Input id="senderAccountNumber" placeholder="Your account number" {...field} />}
            />
            {errors.senderAccountNumber && <p className="text-sm text-destructive">{errors.senderAccountNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionScreenshot">Transaction screenshot</Label>
            <Controller
              name="screenshot"
              control={control}
              render={({ field: { onChange, ref } }) => (
                <Input
                  id="transactionScreenshot"
                  onChange={event => onChange(event.target.files?.[0])}
                  ref={ref}
                  accept="image/jpeg,image/png,image/webp"
                  type="file"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP, up to 5 MB.</p>
            {errors.screenshot && <p className="text-sm text-destructive">{errors.screenshot.message}</p>}
          </div>

          {(uploadStatus !== 'idle' || submitting) && (
            <div role="status" className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {submitting
                    ? mode === 'resubmit' ? 'Resubmitting payment proof...' : 'Creating order...'
                    : uploadStatus === 'uploaded'
                      ? 'Screenshot uploaded.'
                      : 'Uploading screenshot...'}
                </span>
                <span>
                  {uploadProgress}
                  %
                </span>
              </div>
              <Progress value={uploadProgress} aria-label="Payment proof upload progress" />
            </div>
          )}

          {displayedError && (
            <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {displayedError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)} disabled={busy} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handlePaymentSubmit)}
            disabled={busy || loadingInstructions || !!instructionsError || !instructions}
            type="button"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
            {mode === 'resubmit' ? 'Resubmit payment proof' : 'Submit payment proof'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
