import type { AdminPayFastChargeReviewOutcome } from '@/types/adminPayFastChargeReview.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { showErrorToast } from '@/lib/errorToast';
import {
  formatChargeAmount,
  formatChargeReason,
  formatPurchaseStatus,
  formatTransactionId,
} from '@/components/admin/payFastChargeReviewFormat';
import {
  getAdminPayFastChargeReviewOptions,
  useResolveAdminPayFastChargeReviewMutation,
} from '@/queries/adminPayFastChargeReview.query';
import { toast } from 'sonner';

const OUTCOME_LABELS: Record<AdminPayFastChargeReviewOutcome, string> = {
  NO_REFUND_REQUIRED: 'No refund required',
  REFUND_COMPLETED: 'Manual refund completed',
};

const IDENTIFIER_LABELS: Record<string, string> = {
  basket_id: 'Basket ID',
  merchant_id: 'Merchant ID',
  payment_id: 'Payment ID',
  pf_payment_id: 'PayFast payment ID',
};

const resolutionFormSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'A note is required.')
    .max(1000, 'Notes must be 1000 characters or fewer.'),
  outcome: z.enum(['NO_REFUND_REQUIRED', 'REFUND_COMPLETED'], {
    errorMap: () => ({ message: 'Choose an outcome.' }),
  }),
});

type ResolutionFormValues = z.infer<typeof resolutionFormSchema>;

export default function AdminPayFastChargeReviewDetail({
  canResolve,
  chargeRecordId,
}: {
  canResolve: boolean;
  chargeRecordId: string;
}) {
  const detail = useQuery(getAdminPayFastChargeReviewOptions(chargeRecordId));
  const resolve = useResolveAdminPayFastChargeReviewMutation();
  const form = useForm<ResolutionFormValues>({
    defaultValues: { note: '' },
    resolver: zodResolver(resolutionFormSchema),
  });

  async function submitResolution(values: ResolutionFormValues) {
    try {
      await resolve.mutateAsync({
        chargeRecordId,
        payload: { note: values.note, outcome: values.outcome },
      });
      form.reset({ note: '' });
      toast.success('PayFast charge outcome recorded');
    } catch (error) {
      showErrorToast(error, 'Failed to record the charge outcome');
    }
  }

  if (detail.isLoading) {
    return (
      <section aria-label="Charge details" className="flex justify-center p-12">
        <Loader2 aria-label="Loading charge details" className="h-5 w-5 animate-spin" />
      </section>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Charge unavailable</AlertTitle>
        <AlertDescription>The charge could not be loaded. Try another charge.</AlertDescription>
      </Alert>
    );
  }

  const review = detail.data.data;
  const identifiers = Object.entries(review.paymentIdentifiers);

  return (
    <section aria-label="Charge details" className="space-y-5">
      <dl
        className="
          grid gap-3 text-sm
          sm:grid-cols-2
        "
      >
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Charge record ID</dt>
          <dd className="break-all font-mono text-xs">{review.id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Purchase</dt>
          <dd className="break-all font-mono text-xs">
            {review.orderId ?? review.boostPurchaseId ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Purchase status</dt>
          <dd>{formatPurchaseStatus(review.purchaseStatus)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Reason</dt>
          <dd>{formatChargeReason(review.reason)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Amount</dt>
          <dd>{formatChargeAmount(review.currency, review.amount)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Received</dt>
          <dd>{format(new Date(review.createdAt), 'PPp')}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Provider</dt>
          <dd>{review.provider}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Transaction ID</dt>
          <dd className="break-all font-mono text-xs">
            {formatTransactionId(review.transactionId)}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-xs uppercase text-muted-foreground">Payment identifiers</h3>
        {identifiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment identifiers recorded.</p>
        ) : (
          <dl
            className="
              mt-2 grid gap-2 text-sm
              sm:grid-cols-2
            "
          >
            {identifiers.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-muted-foreground">{IDENTIFIER_LABELS[key] ?? key}</dt>
                <dd className="break-all font-mono text-xs">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Review state</p>
        {review.resolution ? (
          <div className="mt-2 space-y-1 text-sm">
            <Badge variant="default">Outcome recorded</Badge>
            <p>{OUTCOME_LABELS[review.resolution.outcome]}</p>
            <p className="text-muted-foreground">{review.resolution.note}</p>
            <p className="text-xs text-muted-foreground">
              Reviewed {format(new Date(review.resolution.reviewedAt), 'PPp')}
            </p>
          </div>
        ) : canResolve ? (
          <Form {...form}>
            <form className="mt-3 space-y-4" onSubmit={form.handleSubmit(submitResolution)}>
              <p className="text-sm text-muted-foreground">
                This screen does not issue refunds. Refund any amount manually outside the app, then
                record the outcome here.
              </p>
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome</FormLabel>
                    <FormControl>
                      <RadioGroup
                        disabled={resolve.isPending}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        {(Object.keys(OUTCOME_LABELS) as AdminPayFastChargeReviewOutcome[]).map(
                          outcome => (
                            <div key={outcome} className="flex items-center gap-2">
                              <RadioGroupItem id={outcome} value={outcome} />
                              <FormLabel htmlFor={outcome} className="font-normal">
                                {OUTCOME_LABELS[outcome]}
                              </FormLabel>
                            </div>
                          ),
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea disabled={resolve.isPending} rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button disabled={resolve.isPending} type="submit">
                {resolve.isPending && (
                  <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                )}
                {resolve.isPending ? 'Saving…' : 'Record outcome'}
              </Button>
            </form>
          </Form>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Awaiting review. You do not have permission to record an outcome.
          </p>
        )}
      </div>
    </section>
  );
}
