import type { AdminBoostPaymentSubmission } from '@/types/adminBoost.type';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileWarning, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  getAdminBoostPaymentProofOptions,
  getAdminBoostPaymentSubmissionsOptions,
  useApproveAdminBoostPaymentMutation,
  useCompleteAdminBoostRefundMutation,
  useRejectAdminBoostPaymentMutation,
  useRequestAdminBoostPaymentResubmissionMutation,
} from '@/queries/adminBoost.query';

function statusLabel(status: AdminBoostPaymentSubmission['boostPurchase']['status']) {
  return status.replaceAll('_', ' ');
}

function ReviewSubmission({
  canReview,
  submission,
}: {
  canReview: boolean;
  submission: AdminBoostPaymentSubmission;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState(submission.boostPurchase.status);
  const [paymentSubmissionStatus, setPaymentSubmissionStatus] = useState(submission.paymentSubmission.status);
  const proofQuery = useQuery(getAdminBoostPaymentProofOptions(submission.paymentSubmission.proofFileId));
  const approveMutation = useApproveAdminBoostPaymentMutation();
  const rejectMutation = useRejectAdminBoostPaymentMutation();
  const resubmissionMutation = useRequestAdminBoostPaymentResubmissionMutation();
  const refundMutation = useCompleteAdminBoostRefundMutation();
  const isMutating = approveMutation.isPending
    || rejectMutation.isPending
    || resubmissionMutation.isPending
    || refundMutation.isPending;
  const isActionable = paymentSubmissionStatus === 'SUBMITTED' && canReview;

  useEffect(() => {
    setPurchaseStatus(submission.boostPurchase.status);
    setPaymentSubmissionStatus(submission.paymentSubmission.status);
  }, [submission.boostPurchase.status, submission.paymentSubmission.status]);

  useEffect(() => {
    if (!proofQuery.data) {
      setPreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(proofQuery.data);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [proofQuery.data]);

  async function runReview(action: 'approve' | 'reject' | 'resubmit') {
    if (!isActionable)
      return;
    if (action !== 'approve' && reviewNote.trim().length === 0) {
      setActionError('A reason is required for this action.');
      return;
    }
    setActionError(null);
    try {
      if (action === 'approve') {
        const response = await approveMutation.mutateAsync({ submissionId: submission.paymentSubmission.id });
        setPurchaseStatus(response.data.purchase.status);
        setPaymentSubmissionStatus(response.data.paymentSubmission.status);
        if (response.data.refundRequired)
          toast.success('Payment verified. A manual refund is required because the listing is no longer eligible.');
        else
          toast.success('Boost payment approved.');
      }
      else if (action === 'reject') {
        const response = await rejectMutation.mutateAsync({ submissionId: submission.paymentSubmission.id, payload: { reviewNote: reviewNote.trim() } });
        setPaymentSubmissionStatus(response.data.paymentSubmission.status);
        toast.success('Boost payment rejected.');
      }
      else {
        const response = await resubmissionMutation.mutateAsync({ submissionId: submission.paymentSubmission.id, payload: { reviewNote: reviewNote.trim() } });
        setPaymentSubmissionStatus(response.data.paymentSubmission.status);
        toast.success('Replacement proof requested.');
      }
    }
    catch (error) {
      setActionError(error instanceof Error ? error.message : 'The review could not be saved.');
    }
  }

  async function recordRefund() {
    if (!canReview || submission.boostPurchase.status !== 'REFUND_REQUIRED')
      return;
    setActionError(null);
    try {
      const response = await refundMutation.mutateAsync(submission.boostPurchase.id);
      setPurchaseStatus(response.data.status);
      if (response.data.status === 'REFUNDED')
        toast.success('Manual refund recorded.');
    }
    catch (error) {
      setActionError(error instanceof Error ? error.message : 'The refund could not be recorded.');
    }
  }

  const isRefundRequired = purchaseStatus === 'REFUND_REQUIRED';
  const isRefunded = purchaseStatus === 'REFUNDED';

  return (
    <Card className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{submission.listing.title}</h3>
          <p className="text-sm text-muted-foreground">
            {submission.seller.firstName}
            {' '}
            {submission.seller.lastName}
            {' · '}
            {submission.seller.email}
          </p>
        </div>
        <Badge variant={isRefunded ? 'default' : isRefundRequired ? 'destructive' : 'outline'}>
          {statusLabel(purchaseStatus)}
        </Badge>
      </div>

      <div className="
        grid gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      "
      >
        <Summary title="Purchase">
          <p>{submission.boosts.map(boost => boost.packageName ?? 'Custom campaign').join(', ')}</p>
          <p>{submission.boosts.map(boost => boost.placement.replaceAll('_', ' ')).join(', ')}</p>
          <p>
            Rs
            {submission.boostPurchase.amount.toLocaleString()}
          </p>
          <p>{submission.boosts.map(boost => boost.durationDays ? `${boost.durationDays} days` : 'Campaign').join(', ')}</p>
        </Summary>
        <Summary title="Sender account">
          <p className="font-mono">{submission.paymentSubmission.senderAccountNumber}</p>
          <p>{submission.paymentSubmission.senderAccountTitle}</p>
          <p>
            Submitted
            {format(new Date(submission.paymentSubmission.createdAt), 'PPp')}
          </p>
        </Summary>
        <Summary title="Listing">
          <p>{submission.listing.status.replaceAll('_', ' ')}</p>
          {(isRefundRequired || isRefunded) && (
            <p className="mt-1 font-medium text-destructive">
              {isRefunded ? 'Manual refund completed.' : 'Listing is no longer eligible. Refund required.'}
            </p>
          )}
        </Summary>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Payment proof</p>
        <div className="mt-3 flex min-h-40 items-center justify-center rounded-md bg-muted/40 p-3">
          {proofQuery.isPending
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
                ? <img src={previewUrl} onError={() => setPreviewFailed(true)} alt="Submitted boost payment proof" className="max-h-80 rounded object-contain" />
                : <p className="text-sm text-muted-foreground">Proof preview is unavailable.</p>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {submission.proof.filename}
          {' · '}
          {paymentSubmissionStatus.replaceAll('_', ' ')}
          {' · '}
          {submission.paymentSubmission.reviewNote ?? 'Awaiting review'}
        </p>
      </div>

      {paymentSubmissionStatus === 'SUBMITTED' && !canReview && (
        <Alert>
          <Clock3 className="h-4 w-4" />
          <AlertDescription>BOOSTS_UPDATE permission is required to review payments.</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {isActionable && (
        <div className="space-y-3">
          <Textarea onChange={event => setReviewNote(event.target.value)} value={reviewNote} aria-label="Reason for rejection or replacement proof" disabled={isMutating} placeholder="Required for reject and request replacement proof" rows={3} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void runReview('approve')} disabled={isMutating} type="button">
              <CheckCircle2 className="h-4 w-4" />
              Approve payment
            </Button>
            <Button onClick={() => void runReview('resubmit')} disabled={isMutating} type="button" variant="outline">Request replacement proof</Button>
            <Button onClick={() => void runReview('reject')} disabled={isMutating} type="button" variant="destructive">Reject payment</Button>
          </div>
        </div>
      )}

      {isRefundRequired && (
        <Button onClick={() => void recordRefund()} disabled={!canReview || isMutating} type="button">
          {refundMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Record refund completed
        </Button>
      )}
      {isRefunded && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Refund completed</AlertTitle>
          <AlertDescription>The manual refund has been recorded.</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}

function Summary({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-3 text-sm">
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export function AdminBoostPaymentReviewQueue({ canReview }: { canReview: boolean }) {
  const [page, setPage] = useState(1);
  const submissionsQuery = useQuery(getAdminBoostPaymentSubmissionsOptions({ page, size: 50 }));
  const submissions = submissionsQuery.data?.data ?? [];
  const lastPage = submissionsQuery.data?.pagination?.lastPage ?? 1;

  if (submissionsQuery.isPending) {
    return (
      <div role="status" className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading boost payment reviews</span>
      </div>
    );
  }
  if (submissionsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Review queue unavailable</AlertTitle>
        <AlertDescription>Boost payment submissions could not be loaded. Try again.</AlertDescription>
      </Alert>
    );
  }
  if (submissions.length === 0)
    return <Card className="p-8 text-center text-sm text-muted-foreground">No boost payment submissions need review.</Card>;

  return (
    <div className="space-y-4">
      {submissions.map(submission => <ReviewSubmission key={submission.paymentSubmission.id} canReview={canReview} submission={submission} />)}
      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button onClick={() => setPage(currentPage => currentPage - 1)} disabled={page <= 1 || submissionsQuery.isFetching} type="button" variant="outline">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page
            {page}
            {' '}
            of
            {lastPage}
          </span>
          <Button onClick={() => setPage(currentPage => currentPage + 1)} disabled={page >= lastPage || submissionsQuery.isFetching} type="button" variant="outline">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
