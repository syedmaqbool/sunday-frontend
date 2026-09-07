import type { AdminManualPaymentSubmission } from '@/types/adminOrder.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock3, FileWarning, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utilities';
import {
  getAdminOrderOptions,
  getAdminPaymentProofOptions,
  useApproveAdminManualPaymentMutation,
  useRejectAdminManualPaymentMutation,
  useRequestAdminManualPaymentResubmissionMutation,
} from '@/queries/adminOrders.query';

const reviewFormSchema = z.object({
  action: z.enum(['approve', 'reject', 'resubmit']),
  reviewNote: z.string(),
}).superRefine((values, context) => {
  if (values.action !== 'approve' && values.reviewNote.trim().length === 0) {
    context.addIssue({
      path: ['reviewNote'],
      code: z.ZodIssueCode.custom,
      message: 'A reason is required for this action.',
    });
  }
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export function maskSenderAccountNumber(accountNumber: string) {
  if (accountNumber.length <= 4)
    return '••••';

  return `${'•'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
}

function latestSubmission(submissions: AdminManualPaymentSubmission[]) {
  return [...submissions].toSorted((left, right) =>
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ?? null;
}

function reviewStatusVariant(status: AdminManualPaymentSubmission['status']) {
  if (status === 'APPROVED')
    return 'default' as const;
  if (status === 'REJECTED')
    return 'destructive' as const;
  return 'outline' as const;
}

export function AdminManualPaymentReviewDialog({
  orderId,
  canReview,
  onClose,
}: {
  orderId: string | null;
  canReview: boolean;
  onClose: () => void;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const form = useForm<ReviewFormValues>({
    defaultValues: { action: 'approve', reviewNote: '' },
    resolver: zodResolver(reviewFormSchema),
  });

  const orderQuery = useQuery(getAdminOrderOptions(orderId ?? 'missing', Boolean(orderId)));
  const order = orderQuery.data?.data;
  const currentSubmission = useMemo(
    () => latestSubmission(order?.manualPaymentSubmissions ?? []),
    [order?.manualPaymentSubmissions],
  );
  const proofQuery = useQuery(getAdminPaymentProofOptions(currentSubmission?.proofFileId));
  const approveMutation = useApproveAdminManualPaymentMutation();
  const rejectMutation = useRejectAdminManualPaymentMutation();
  const resubmissionMutation = useRequestAdminManualPaymentResubmissionMutation();
  const isMutating
    = approveMutation.isPending || rejectMutation.isPending || resubmissionMutation.isPending;

  useEffect(() => {
    setPreviewFailed(false);
    setActionError(null);
    form.reset({ action: 'approve', reviewNote: '' });
  }, [form, orderId]);

  useEffect(() => {
    if (!proofQuery.data) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(proofQuery.data);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [proofQuery.data]);

  const submitReview = async (values: ReviewFormValues) => {
    if (!orderId || !currentSubmission || currentSubmission.status !== 'SUBMITTED' || !canReview)
      return;

    setActionError(null);
    try {
      if (values.action === 'approve') {
        await approveMutation.mutateAsync(orderId);
        toast.success('Manual payment approved.');
      }
      else if (values.action === 'reject') {
        await rejectMutation.mutateAsync({
          orderId,
          payload: { reviewNote: values.reviewNote.trim() },
        });
        toast.success('Manual payment rejected.');
      }
      else {
        await resubmissionMutation.mutateAsync({
          orderId,
          payload: { reviewNote: values.reviewNote.trim() },
        });
        toast.success('Resubmission requested.');
      }
      onClose();
    }
    catch (error) {
      setActionError(error instanceof Error ? error.message : 'The review could not be saved.');
    }
  };

  const runAction = (action: ReviewFormValues['action']) => {
    form.setValue('action', action);
    void form.handleSubmit(submitReview)();
  };

  return (
    <Dialog onOpenChange={open => !open && onClose()} open={Boolean(orderId)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review manual payment</DialogTitle>
          <DialogDescription>
            Review the current backend submission before deciding how to update this order.
          </DialogDescription>
        </DialogHeader>

        {orderQuery.isPending && (
          <div role="status" className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading order review</span>
          </div>
        )}

        {orderQuery.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Review unavailable</AlertTitle>
            <AlertDescription>
              The order could not be loaded. Close this dialog and try again.
            </AlertDescription>
          </Alert>
        )}

        {order && (
          <div className="space-y-5">
            <div className="
              grid gap-4
              sm:grid-cols-2
            "
            >
              <Summary title="Order">
                <p className="font-medium">
                  #
                  {order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'PPp')}</p>
                <p className="text-sm text-muted-foreground">
                  Total: Rs
                  {' '}
                  {order.total.toLocaleString()}
                </p>
              </Summary>
              <Summary title="Buyer">
                <p className="font-medium">{order.buyerFullName}</p>
                <p className="text-sm text-muted-foreground">{order.shippingPhone}</p>
                <p className="text-sm text-muted-foreground">{order.shippingCity}</p>
              </Summary>
              <Summary title="Payment window">
                <p className="text-sm">
                  {order.expiresAt
                    ? format(new Date(order.expiresAt), 'PPp')
                    : 'No expiry recorded'}
                </p>
              </Summary>
            </div>

            {!currentSubmission && (
              <Alert>
                <FileWarning className="h-4 w-4" />
                <AlertTitle>No payment submission</AlertTitle>
                <AlertDescription>
                  This order has no manual-payment submission to review.
                </AlertDescription>
              </Alert>
            )}

            {currentSubmission && (
              <>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Current submission</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Submitted
                        {' '}
                        {format(new Date(currentSubmission.createdAt), 'PPp')}
                      </p>
                    </div>
                    <Badge variant={reviewStatusVariant(currentSubmission.status)}>
                      {currentSubmission.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                  <div className="
                    mt-4 grid gap-4
                    sm:grid-cols-2
                  "
                  >
                    <Summary title="Sender account">
                      <p className="font-mono text-sm">
                        {canReview
                          ? currentSubmission.senderAccountNumber
                          : maskSenderAccountNumber(currentSubmission.senderAccountNumber)}
                      </p>
                      <p className="text-sm text-muted-foreground">{currentSubmission.senderAccountTitle}</p>
                    </Summary>
                    <Summary title="Review">
                      <p className="text-sm">
                        {currentSubmission.reviewedAt
                          ? format(new Date(currentSubmission.reviewedAt), 'PPp')
                          : 'Awaiting first review'}
                      </p>
                      {currentSubmission.reviewNote && (
                        <p className="text-sm text-muted-foreground">{currentSubmission.reviewNote}</p>
                      )}
                    </Summary>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Protected proof</p>
                  <div className="mt-3 flex min-h-40 items-center justify-center rounded-md bg-muted/40 p-3">
                    {currentSubmission.proofFileId
                      ? proofQuery.isPending
                        ? (
                            <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading protected proof…
                            </div>
                          )
                        : proofQuery.isError || previewFailed
                          ? (
                              <div className="text-center text-sm text-muted-foreground">
                                <FileWarning className="mx-auto mb-2 h-5 w-5" />
                                Proof is unavailable or access was denied.
                              </div>
                            )
                          : previewUrl
                            ? (
                                <img
                                  src={previewUrl}
                                  onError={() => setPreviewFailed(true)}
                                  alt="Submitted payment proof"
                                  className="max-h-80 rounded object-contain"
                                />
                              )
                            : (
                                <p className="text-sm text-muted-foreground">Proof preview is unavailable.</p>
                              )
                      : (
                          <p className="text-sm text-muted-foreground">No proof file was submitted.</p>
                        )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Prior review information</p>
                  {order.manualPaymentSubmissions.map(submission => (
                    <div
                      key={submission.id}
                      className="
                        flex flex-col gap-1 rounded-md border border-border p-3 text-sm
                        sm:flex-row sm:items-start sm:justify-between
                      "
                    >
                      <div>
                        <Badge variant={reviewStatusVariant(submission.status)}>{submission.status.replaceAll('_', ' ')}</Badge>
                        {submission.reviewNote && <p className="mt-2 text-muted-foreground">{submission.reviewNote}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {submission.reviewedAt ? format(new Date(submission.reviewedAt), 'PPp') : 'Not reviewed'}
                      </span>
                    </div>
                  ))}
                </div>

                {currentSubmission.status === 'SUBMITTED' && !canReview && (
                  <Alert>
                    <Clock3 className="h-4 w-4" />
                    <AlertDescription>
                      You can view this submission, but ORDERS_UPDATE permission is required to review it.
                    </AlertDescription>
                  </Alert>
                )}

                {currentSubmission.status === 'SUBMITTED' && canReview && (
                  <Form {...form}>
                    <form onSubmit={event => event.preventDefault()} className="space-y-4">
                      <FormField
                        name="reviewNote"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for rejection or resubmission</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                disabled={isMutating}
                                placeholder="Required for reject and request resubmission"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {actionError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{actionError}</AlertDescription>
                        </Alert>
                      )}
                      <DialogFooter className="
                        flex-col gap-2
                        sm:flex-row
                      "
                      >
                        <Button onClick={() => runAction('approve')} disabled={isMutating} type="button">
                          {approveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                          <CheckCircle2 className="h-4 w-4" />
                          Approve payment
                        </Button>
                        <Button onClick={() => runAction('resubmit')} disabled={isMutating} type="button" variant="outline">
                          Request resubmission
                        </Button>
                        <Button onClick={() => runAction('reject')} disabled={isMutating} type="button" variant="destructive">
                          Reject payment
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Summary({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className={cn('rounded-md bg-muted/40 p-3')}>
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
