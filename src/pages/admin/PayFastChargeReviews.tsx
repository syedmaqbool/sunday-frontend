import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AccessDenied from '@/components/admin/AccessDenied';
import AdminPayFastChargeReviewDetail from '@/components/admin/AdminPayFastChargeReviewDetail';
import {
  formatChargeAmount,
  formatChargeReason,
  formatPurchaseStatus,
  formatTransactionId,
} from '@/components/admin/payFastChargeReviewFormat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAccessControl } from '@/hooks/useAccessControl';
import { getAdminPayFastChargeReviewsOptions } from '@/queries/adminPayFastChargeReview.query';

const PAYFAST_CHARGE_REVIEWS_PAGE_SIZE = 20;

const lookupFormSchema = z.object({
  chargeRecordId: z.string().trim().uuid('Enter a valid charge record ID.'),
});

type LookupFormValues = z.infer<typeof lookupFormSchema>;

export default function PayFastChargeReviews() {
  const { can } = useAccessControl();
  const [page, setPage] = useState(1);
  const [chargeRecordId, setChargeRecordId] = useState<string | null>(null);
  const lookupForm = useForm<LookupFormValues>({
    defaultValues: { chargeRecordId: '' },
    resolver: zodResolver(lookupFormSchema),
  });
  const canRead = can('PAYOUTS_READ');
  const canResolve = can(['PAYOUTS_READ', 'PAYOUTS_UPDATE']);
  const reviews = useQuery({
    ...getAdminPayFastChargeReviewsOptions({
      page,
      size: PAYFAST_CHARGE_REVIEWS_PAGE_SIZE,
    }),
    enabled: canRead,
    placeholderData: keepPreviousData,
  });
  const { data: reviewPage } = reviews;
  const rows = reviewPage?.data ?? [];
  const pagination = reviewPage?.pagination;

  if (!canRead) {
    return <AccessDenied description="Payout access is required to review PayFast charges." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          PayFast charge reviews
        </h1>
        <p className="text-sm text-muted-foreground">
          Unexpected PayFast charges waiting for a manual decision. Refunds are issued manually
          outside this app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Find a charge by record ID</CardTitle>
          <CardDescription>
            Recorded charges leave the unresolved list. Use the charge record ID to reopen one and
            track its outcome.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...lookupForm}>
            <form
              className="
                flex flex-col gap-3
                sm:flex-row sm:items-start
              "
              onSubmit={lookupForm.handleSubmit(values => setChargeRecordId(values.chargeRecordId))}
            >
              <FormField
                control={lookupForm.control}
                name="chargeRecordId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Charge record ID</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="sm:mt-8" type="submit" variant="outline">
                Look up charge
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Unresolved charges</CardTitle>
          <CardDescription>Each row is a distinct charge.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {reviews.isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 aria-label="Loading PayFast charges" className="h-5 w-5 animate-spin" />
            </div>
          ) : reviews.isError ? (
            <p role="alert" className="p-8 text-center text-sm text-destructive">
              Unable to load PayFast charge reviews.
            </p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No unresolved PayFast charges.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Purchase status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(review => (
                  <TableRow key={review.id}>
                    <TableCell className="break-all font-mono text-xs">{review.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatTransactionId(review.transactionId)}
                    </TableCell>
                    <TableCell>{formatChargeReason(review.reason)}</TableCell>
                    <TableCell>{formatChargeAmount(review.currency, review.amount)}</TableCell>
                    <TableCell>{formatPurchaseStatus(review.purchaseStatus)}</TableCell>
                    <TableCell>{format(new Date(review.createdAt), 'PP')}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => setChargeRecordId(review.id)}
                        size="sm"
                        variant="outline"
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {pagination && pagination.lastPage > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-border p-4 text-sm">
              <span className="text-muted-foreground">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={!pagination.prevPage || reviews.isFetching}
                  onClick={() => setPage(pagination.prevPage ?? page)}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={!pagination.nextPage || reviews.isFetching}
                  onClick={() => setPage(pagination.nextPage ?? page)}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {chargeRecordId && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Selected charge</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminPayFastChargeReviewDetail
              canResolve={canResolve}
              chargeRecordId={chargeRecordId}
              key={chargeRecordId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
