import type {
  AdminPayoutTransaction,
  RecordAdminSellerPaymentReviewError,
  SellerPayoutReviewReason,
  SellerPayment,
} from '@/types/payout.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { HTTPError } from 'ky';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  CircleDollarSign,
  Download,
  Loader2,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { formatEnumLabel } from '@/lib/utilities';
import {
  getAdminBuyerRefundsOptions,
  getAdminSellerPayableOptions,
  getAdminSellerPaymentOptions,
  getAdminSellerPaymentsOptions,
  getAdminPayoutSellerSummariesOptions,
  getAdminPayoutTransactionsOptions,
  useRecordAdminSellerPaymentMutation,
} from '@/queries/payout.query';

// ─── Constants ────────────────────────────────────────────────────────────────

const SELLER_SUMMARY_PAGE_SIZE = 20;
const BUYER_REFUNDS_PAGE_SIZE = 20;
const SELLER_FILTER_PAGE_SIZE = 100;
const SELLER_PAYMENT_PAGE_SIZE = 20;
const PAYOUT_TRANSACTION_PAGE_SIZE = 20;
const PERIOD_REPORT_PAGE_SIZE = 100;

const recordSellerPaymentSchema = z.object({
  notes: z.string(),
  reference: z.string().trim().min(1, 'Reference is required.'),
});

type RecordSellerPaymentForm = z.infer<typeof recordSellerPaymentSchema>;

const sellerPayoutReviewReasonLabels: Record<SellerPayoutReviewReason, string> = {
  INCOMPLETE_ACCOUNTING_ADJUSTMENT: 'Incomplete accounting adjustment',
  INCOMPLETE_PAYABLE_CALCULATION: 'Incomplete payable calculation',
  UNALLOCATED_PAID_AMOUNT: 'Unallocated paid amount',
};

function fmt(n: number) {
  return `Rs ${(Math.round(n * 100) / 100).toLocaleString('en-PK', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function PayoutComponentCaption({
  payoutComponent,
}: {
  payoutComponent: AdminPayoutTransaction['payoutComponent'];
}) {
  if (payoutComponent !== 'SELLER_INCENTIVE_BONUS') return null;

  return <span className="block text-xs text-muted-foreground">Seller incentive bonus</span>;
}

interface PeriodItem {
  id: string;
  amount: number;
  at: string;
  description: string;
  kind: 'payout' | 'refund';
  party: string;
  reference: string;
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getAdditionalPageQueryOptions<TQueryOptions>(
  lastPage: number | undefined,
  createPageQueryOptions: (page: number) => TQueryOptions,
) {
  return Array.from({ length: Math.max((lastPage ?? 1) - 1, 0) }, (_, index) =>
    createPageQueryOptions(index + 2),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function Payouts() {
  const queryClient = useQueryClient();
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [transactionSellerFilter, setTransactionSellerFilter] = useState<string>('all');
  const [transactionPage, setTransactionPage] = useState(1);
  const [isExportingTransactions, setIsExportingTransactions] = useState(false);
  const [transactionsExportError, setTransactionsExportError] = useState<string | null>(null);
  const [selectedSellerPayment, setSelectedSellerPayment] = useState<SellerPayment | null>(null);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [sellerSummaryPage, setSellerSummaryPage] = useState(1);
  const [buyerRefundPage, setBuyerRefundPage] = useState(1);
  const [sellerPaymentPage, setSellerPaymentPage] = useState(1);
  const [recordPayoutSellerId, setRecordPayoutSellerId] = useState<string | null>(null);
  const [recordPayoutIdempotencyKey, setRecordPayoutIdempotencyKey] = useState<string | null>(null);
  const [recordPayoutError, setRecordPayoutError] = useState<string | null>(null);
  const [recordPayoutReviewReason, setRecordPayoutReviewReason] =
    useState<SellerPayoutReviewReason | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // ─── Queries ───────────────────────────────────────────────────────────────

  const {
    data: buyerRefundsData,
    error: buyerRefundsError,
    isFetching: buyerRefundsFetching,
    isLoading: buyerRefundsLoading,
    refetch: refetchBuyerRefunds,
  } = useQuery({
    ...getAdminBuyerRefundsOptions({ page: buyerRefundPage, size: BUYER_REFUNDS_PAGE_SIZE }),
    placeholderData: previousData => previousData,
  });
  const sellerPaymentParameters = {
    page: sellerPaymentPage,
    size: SELLER_PAYMENT_PAGE_SIZE,
    ...(sellerFilter === 'all' ? {} : { sellerId: sellerFilter }),
  };
  const {
    data: sellerPaymentsData,
    error: sellerPaymentsError,
    isFetching: sellerPaymentsFetching,
    isLoading: sellerPaymentsLoading,
    refetch: refetchSellerPayments,
  } = useQuery(getAdminSellerPaymentsOptions(sellerPaymentParameters));
  const {
    data: sellerPaymentDetailResponse,
    error: sellerPaymentDetailError,
    isLoading: sellerPaymentDetailLoading,
    refetch: refetchSellerPaymentDetail,
  } = useQuery(getAdminSellerPaymentOptions(selectedSellerPayment?.id ?? ''));
  const {
    data: sellerSummariesData,
    error: sellerSummariesError,
    isFetching: sellerSummariesFetching,
    isLoading: sellerSummariesLoading,
    refetch: refetchSellerSummaries,
  } = useQuery({
    ...getAdminPayoutSellerSummariesOptions({
      page: sellerSummaryPage,
      size: SELLER_SUMMARY_PAGE_SIZE,
    }),
    placeholderData: previousData => previousData,
  });
  const transactionParameters = {
    page: transactionPage,
    size: PAYOUT_TRANSACTION_PAGE_SIZE,
    ...(transactionSellerFilter === 'all' ? {} : { sellerId: transactionSellerFilter }),
  };
  const {
    data: transactionsData,
    error: transactionsError,
    isFetching: transactionsFetching,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    ...getAdminPayoutTransactionsOptions(transactionParameters),
    placeholderData: previousData => previousData,
  });
  const { data: sellerFilterSummariesFirstPage, isLoading: sellerFilterSummariesFirstPageLoading } =
    useQuery(getAdminPayoutSellerSummariesOptions({ page: 1, size: SELLER_FILTER_PAGE_SIZE }));
  const additionalSellerFilterSummaryQueries = useQueries({
    queries: Array.from(
      { length: Math.max((sellerFilterSummariesFirstPage?.pagination.lastPage ?? 1) - 1, 0) },
      (_, index) =>
        getAdminPayoutSellerSummariesOptions({
          page: index + 2,
          size: SELLER_FILTER_PAGE_SIZE,
        }),
    ),
  });
  const {
    data: sellerPayablePreviewResponse,
    error: sellerPayablePreviewError,
    isFetching: sellerPayablePreviewFetching,
    isLoading: sellerPayablePreviewLoading,
    refetch: refetchSellerPayablePreview,
  } = useQuery({
    ...getAdminSellerPayableOptions(recordPayoutSellerId ?? ''),
    enabled: Boolean(recordPayoutSellerId),
  });
  const periodReportRange =
    rangeStart && rangeEnd && rangeEnd >= rangeStart
      ? {
          from: new Date(`${rangeStart}T00:00:00`).toISOString(),
          to: new Date(`${rangeEnd}T23:59:59.999`).toISOString(),
        }
      : null;
  const periodPaymentsParameters = {
    page: 1,
    paidFrom: periodReportRange?.from,
    paidTo: periodReportRange?.to,
    size: PERIOD_REPORT_PAGE_SIZE,
  };
  const periodPaymentsQuery = useQuery({
    ...getAdminSellerPaymentsOptions(periodPaymentsParameters),
    enabled: Boolean(periodReportRange),
  });
  const additionalPeriodPaymentQueries = useQueries({
    queries: getAdditionalPageQueryOptions(periodPaymentsQuery.data?.pagination.lastPage, page =>
      getAdminSellerPaymentsOptions({
        ...periodPaymentsParameters,
        page,
      }),
    ),
  });
  const periodRefundsParameters = {
    page: 1,
    resolvedFrom: periodReportRange?.from,
    resolvedTo: periodReportRange?.to,
    size: PERIOD_REPORT_PAGE_SIZE,
  };
  const periodRefundsQuery = useQuery({
    ...getAdminBuyerRefundsOptions(periodRefundsParameters),
    enabled: Boolean(periodReportRange),
  });
  const additionalPeriodRefundQueries = useQueries({
    queries: getAdditionalPageQueryOptions(periodRefundsQuery.data?.pagination.lastPage, page =>
      getAdminBuyerRefundsOptions({
        ...periodRefundsParameters,
        page,
      }),
    ),
  });
  const periodReportLoading =
    Boolean(periodReportRange) &&
    (periodPaymentsQuery.isFetching ||
      additionalPeriodPaymentQueries.some(query => query.isFetching) ||
      periodRefundsQuery.isFetching ||
      additionalPeriodRefundQueries.some(query => query.isFetching));
  const periodReportError =
    periodPaymentsQuery.error ??
    additionalPeriodPaymentQueries.find(query => query.error)?.error ??
    periodRefundsQuery.error ??
    additionalPeriodRefundQueries.find(query => query.error)?.error;
  const recordAdminSellerPaymentMutation = useRecordAdminSellerPaymentMutation();
  const recordSellerPaymentForm = useForm<RecordSellerPaymentForm>({
    defaultValues: { notes: '', reference: '' },
    resolver: zodResolver(recordSellerPaymentSchema),
  });

  const loading = sellerSummariesLoading && sellerSummaryPage === 1;

  // ─── Derived data ──────────────────────────────────────────────────────────

  const buyerRefunds = buyerRefundsData?.data ?? [];
  const sellerPayments = sellerPaymentsData?.data ?? [];
  const sellerPaymentDetail = sellerPaymentDetailResponse?.data;
  const selectedPaymentDetails = sellerPaymentDetail ?? selectedSellerPayment;
  const sellerPaymentDetailNotFound =
    sellerPaymentDetailError instanceof HTTPError &&
    sellerPaymentDetailError.response.status === 404;
  const sellerFilterSummariesLoading =
    sellerFilterSummariesFirstPageLoading ||
    additionalSellerFilterSummaryQueries.some(query => query.isLoading);
  const sellerFilterSummaries = [
    ...(sellerFilterSummariesFirstPage?.data ?? []),
    ...additionalSellerFilterSummaryQueries.flatMap(query => query.data?.data ?? []),
  ];

  const sellerSummaries = sellerSummariesData?.data ?? [];
  const sellerSummaryPagination = sellerSummariesData?.pagination;
  const transactions: AdminPayoutTransaction[] = transactionsData?.data ?? [];
  const transactionPagination = transactionsData?.pagination;
  const totals = {
    due: sellerSummariesData?.aggregates?.balanceDue ?? 0,
    paid: sellerSummariesData?.aggregates?.paid ?? 0,
    refunds: sellerSummariesData?.aggregates?.buyerRefunds ?? 0,
    sales: sellerSummariesData?.aggregates?.grossSales ?? 0,
  };
  const sellerPayablePreview = sellerPayablePreviewResponse?.data;

  const openRecordPayout = (sellerId: string) => {
    setRecordPayoutSellerId(sellerId);
    setRecordPayoutIdempotencyKey(crypto.randomUUID());
    setRecordPayoutError(null);
    setRecordPayoutReviewReason(null);
    recordSellerPaymentForm.reset({ notes: '', reference: '' });
  };

  const closeRecordPayout = (open: boolean) => {
    if (open || recordAdminSellerPaymentMutation.isPending) return;

    setRecordPayoutSellerId(null);
    setRecordPayoutIdempotencyKey(null);
    setRecordPayoutError(null);
    setRecordPayoutReviewReason(null);
    recordSellerPaymentForm.reset({ notes: '', reference: '' });
  };

  const submitSellerPayment = async (values: RecordSellerPaymentForm) => {
    if (
      !recordPayoutSellerId ||
      !sellerPayablePreview ||
      sellerPayablePreview.total === null ||
      recordPayoutReviewReason ||
      sellerPayablePreview.payableStatus === 'REVIEW_REQUIRED' ||
      sellerPayablePreview.bankDetailsMissing ||
      !recordPayoutIdempotencyKey
    ) {
      return;
    }

    setRecordPayoutError(null);
    try {
      const response = await recordAdminSellerPaymentMutation.mutateAsync({
        sellerId: recordPayoutSellerId,
        payload: {
          expectedAmount: sellerPayablePreview.total,
          idempotencyKey: recordPayoutIdempotencyKey,
          notes: values.notes.trim() || null,
          reference: values.reference,
        },
      });

      toast({
        description: `${fmt(response.data.amount)} paid to ${sellerPayablePreview.sellerFullName}.`,
        title: 'Payout recorded',
      });
      closeRecordPayout(false);
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 422) {
        let response: RecordAdminSellerPaymentReviewError | undefined;
        try {
          response = (await error.response.clone().json()) as RecordAdminSellerPaymentReviewError;
        } catch {
          response = undefined;
        }

        if (response?.code === 'APP_SELLER_PAYOUT_REVIEW_REQUIRED' && response.reviewReason) {
          const reasonLabel = sellerPayoutReviewReasonLabels[response.reviewReason];
          setRecordPayoutReviewReason(response.reviewReason);
          setRecordPayoutError(
            `Seller requires finance review: ${reasonLabel}. This payout was not recorded.`,
          );
          await refetchSellerSummaries();
          return;
        }
      }

      if (error instanceof HTTPError) {
        let errorCode: string | undefined;
        let errorMessage: string | undefined;
        try {
          const body = (await error.response.clone().json()) as {
            code?: unknown;
            message?: unknown;
          };
          errorCode = typeof body.code === 'string' ? body.code : undefined;
          errorMessage = typeof body.message === 'string' ? body.message : undefined;
        } catch {
          errorCode = undefined;
          errorMessage = undefined;
        }

        if (
          error.response.status === 422 &&
          errorCode === 'APP_SELLER_PAYOUT_BANK_DETAILS_MISSING'
        ) {
          setRecordPayoutError(
            errorMessage ?? 'Complete bank details are required to record a seller payment.',
          );
          await refetchSellerPayablePreview();
          return;
        }

        if (error.response.status === 409 && errorCode === 'APP_SELLER_PAYOUT_AMOUNT_CHANGED') {
          setRecordPayoutError(
            'The seller balance changed. Review the updated amount before saving again.',
          );
          const refreshedPreview = await refetchSellerPayablePreview();
          if (refreshedPreview.data) setRecordPayoutIdempotencyKey(crypto.randomUUID());
          return;
        }
      }

      setRecordPayoutError(
        error instanceof Error ? error.message : 'Could not record this payout.',
      );
    }
  };

  // ─── Period report items ───────────────────────────────────────────────────

  const periodItems: PeriodItem[] = (() => {
    if (!periodReportRange || periodReportLoading || periodReportError) return [];

    const payments = [
      ...(periodPaymentsQuery.data?.data ?? []),
      ...additionalPeriodPaymentQueries.flatMap(query => query.data?.data ?? []),
    ];
    const refunds = [
      ...(periodRefundsQuery.data?.data ?? []),
      ...additionalPeriodRefundQueries.flatMap(query => query.data?.data ?? []),
    ];
    const payoutPeriodItems: PeriodItem[] = payments.map(payment => ({
      id: `payout-${payment.id}`,
      amount: Number(payment.amount),
      at: payment.paidAt,
      description: `Payout · ${payment.method?.replace('_', ' ') ?? '—'}`,
      kind: 'payout',
      party: payment.sellerFullName || `User ${payment.sellerId.slice(0, 6)}`,
      reference:
        payment.reference ||
        (payment.periodStart && payment.periodEnd
          ? `${payment.periodStart} → ${payment.periodEnd}`
          : ''),
    }));

    const refundPeriodItems: PeriodItem[] = refunds.map(refund => ({
      id: `refund-${refund.complaintId}`,
      amount: Number(refund.amount),
      at: refund.date,
      description: refund.listingTitle || 'Refunded item',
      kind: 'refund',
      party: refund.buyerFullName || `User ${refund.buyerId.slice(0, 6)}`,
      reference: refund.orderId ? `Order ${refund.orderId.slice(0, 8)}` : '',
    }));

    return [...payoutPeriodItems, ...refundPeriodItems].toSorted(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  })();

  const periodTotals = useMemo(() => {
    let payoutTotal = 0;
    let refundTotal = 0;
    for (const item of periodItems) {
      if (!selectedIds.has(item.id)) continue;
      if (item.kind === 'payout') payoutTotal += item.amount;
      else refundTotal += item.amount;
    }
    return { count: selectedIds.size, payoutTotal, refundTotal };
  }, [periodItems, selectedIds]);

  // Auto-select all when period items load or the selected date range changes.
  const periodItemSelectionKey = JSON.stringify({
    itemIds: periodItems.map(item => item.id),
    rangeEnd,
    rangeStart,
  });
  useEffect(() => {
    const { itemIds } = JSON.parse(periodItemSelectionKey) as { itemIds: string[] };
    setSelectedIds(new Set(itemIds));
  }, [periodItemSelectionKey]);

  const toggleSelected = (id: string) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelected = () => {
    if (selectedIds.size === periodItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(periodItems.map(index => index.id)));
  };

  const retryPeriodReport = () => {
    void Promise.all([
      periodPaymentsQuery.refetch(),
      ...additionalPeriodPaymentQueries.map(query => query.refetch()),
      periodRefundsQuery.refetch(),
      ...additionalPeriodRefundQueries.map(query => query.refetch()),
    ]);
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const exportCsv = async () => {
    setIsExportingTransactions(true);
    setTransactionsExportError(null);

    try {
      const exportParameters = {
        page: 1,
        size: PAYOUT_TRANSACTION_PAGE_SIZE,
        ...(transactionSellerFilter === 'all' ? {} : { sellerId: transactionSellerFilter }),
      };
      const firstPage = await queryClient.fetchQuery(
        getAdminPayoutTransactionsOptions(exportParameters),
      );
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(firstPage.pagination.lastPage - 1, 0) }, (_, index) =>
          queryClient.fetchQuery(
            getAdminPayoutTransactionsOptions({ ...exportParameters, page: index + 2 }),
          ),
        ),
      );
      const matchingTransactions = [
        ...firstPage.data,
        ...remainingPages.flatMap(page => page.data),
      ];
      const rows = [
        ['Date', 'Type', 'Seller', 'Amount (PKR)', 'Description', 'Reference'],
        ...matchingTransactions.map(transaction => [
          format(new Date(transaction.date), 'yyyy-MM-dd HH:mm'),
          transaction.type.toLowerCase(),
          transaction.sellerFullName,
          Number(transaction.amount).toFixed(2),
          transaction.description,
          transaction.reference ?? '',
        ]),
      ];
      downloadCsv(rows, `payout-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch {
      setTransactionsExportError('Could not export transactions. Please try again.');
    } finally {
      setIsExportingTransactions(false);
    }
  };

  const exportPeriodCsv = () => {
    const rows = [
      ['Date', 'Type', 'Party', 'Description', 'Reference', 'Amount (PKR)'],
      ...periodItems
        .filter(index => selectedIds.has(index.id))
        .map(index => [
          format(new Date(index.at), 'yyyy-MM-dd HH:mm'),
          index.kind,
          index.party,
          index.description,
          index.reference,
          index.amount.toFixed(2),
        ]),
    ];
    downloadCsv(rows, `payout-period-${rangeStart}_to_${rangeEnd}.csv`);
  };

  // ─── Run detail items ──────────────────────────────────────────────────────

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Seller payouts</h2>
          <p className="text-sm text-muted-foreground">
            Sales become payable after the buyer confirms receipt.
          </p>
        </div>
        <Button
          disabled={isExportingTransactions}
          onClick={() => void exportCsv()}
          size="sm"
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExportingTransactions ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>
      {transactionsExportError && (
        <Alert variant="destructive">
          <AlertDescription>{transactionsExportError}</AlertDescription>
        </Alert>
      )}

      <div
        className="
          grid grid-cols-2 gap-3
          md:grid-cols-4
        "
      >
        <StatCard
          value={fmt(totals.sales)}
          icon={ArrowUpRight}
          label="Gross sales"
          tone="positive"
        />
        <StatCard
          value={fmt(totals.refunds)}
          icon={ArrowDownRight}
          label="Buyer refunds"
          tone="negative"
        />
        <StatCard value={fmt(totals.paid)} icon={Wallet} label="Paid to sellers" tone="muted" />
        <StatCard
          value={fmt(totals.due)}
          icon={CircleDollarSign}
          label="Balance due"
          tone="accent"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="sellers" className="min-w-0 space-y-4">
          <TabsList className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="sellers">By seller</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="refunds">Buyer refunds</TabsTrigger>
            <TabsTrigger value="history">Payout history</TabsTrigger>
            <TabsTrigger value="period">Period report</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card>
              <CardContent className="p-0">
                {sellerSummariesError && (
                  <Alert variant="destructive" className="m-4">
                    <AlertDescription>
                      Could not load seller balances. Please try again.{' '}
                      <Button
                        onClick={() => void refetchSellerSummaries()}
                        size="sm"
                        variant="outline"
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Net sales</TableHead>
                      <TableHead className="text-right">
                        Refunded <span className="text-xs text-muted-foreground">(excluded)</span>
                      </TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance due</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellerSummariesLoading && sellerSummaries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          Loading seller balances…
                        </TableCell>
                      </TableRow>
                    )}
                    {!sellerSummariesLoading &&
                      !sellerSummariesError &&
                      sellerSummaries.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No seller activity yet.
                          </TableCell>
                        </TableRow>
                      )}
                    {sellerSummaries.map(s => (
                      <TableRow key={s.sellerId}>
                        <TableCell className="font-medium">
                          <span>{s.sellerFullName}</span>
                          {s.payableStatus === 'REVIEW_REQUIRED' && (
                            <Badge
                              aria-label={`Finance review required: ${s.reviewReason ? sellerPayoutReviewReasonLabels[s.reviewReason] : 'reason unavailable'}`}
                              className="ml-2"
                              id={`seller-review-${s.sellerId}`}
                              variant="destructive"
                            >
                              {s.reviewReason
                                ? sellerPayoutReviewReasonLabels[s.reviewReason]
                                : 'Finance review required'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{fmt(Number(s.netSales))}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {s.refundedCount === 0 ? (
                            '—'
                          ) : (
                            <>
                              {fmt(Number(s.refundedAmount))}
                              <Badge variant="secondary" className="ml-1.5">
                                {s.refundedCount}
                              </Badge>
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{fmt(Number(s.paid))}</TableCell>
                        <TableCell
                          className={`
                            text-right font-semibold
                            ${
                              s.balanceDue === null
                                ? 'text-muted-foreground'
                                : s.balanceDue > 0
                                  ? 'text-emerald-600'
                                  : 'text-muted-foreground'
                            }
                          `}
                        >
                          {s.balanceDue === null ? '—' : fmt(Number(s.balanceDue))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            aria-describedby={
                              s.payableStatus === 'REVIEW_REQUIRED'
                                ? `seller-review-${s.sellerId}`
                                : undefined
                            }
                            disabled={s.payableStatus !== 'PAYABLE'}
                            onClick={() => openRecordPayout(s.sellerId)}
                            size="sm"
                            variant={s.payableStatus === 'PAYABLE' ? 'default' : 'outline'}
                          >
                            Record payout
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sellerSummaryPagination && sellerSummaryPagination.lastPage > 1 && (
                  <div className="flex items-center justify-between gap-3 p-4 text-sm">
                    <p className="text-muted-foreground">
                      Page {sellerSummaryPagination.currentPage} of{' '}
                      {sellerSummaryPagination.lastPage}
                      {' · '}
                      {sellerSummaryPagination.total} sellers
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setSellerSummaryPage(
                            sellerSummaryPagination.prevPage ?? sellerSummaryPage,
                          )
                        }
                        disabled={!sellerSummaryPagination.prevPage || sellerSummariesFetching}
                        size="sm"
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setSellerSummaryPage(
                            sellerSummaryPagination.nextPage ?? sellerSummaryPage,
                          )
                        }
                        disabled={!sellerSummaryPagination.nextPage || sellerSummariesFetching}
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
          </TabsContent>

          {/* ── Transactions ── */}
          <TabsContent value="transactions">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Filter</Label>
                  <Select
                    onValueChange={value => {
                      setTransactionSellerFilter(value);
                      setTransactionPage(1);
                    }}
                    value={transactionSellerFilter}
                  >
                    <SelectTrigger className="h-9 w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sellers</SelectItem>
                      {sellerFilterSummaries.map(seller => (
                        <SelectItem key={seller.sellerId} value={seller.sellerId}>
                          {seller.sellerFullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {transactionsError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Could not load transactions. Please try again.{' '}
                      <Button
                        onClick={() => void refetchTransactions()}
                        size="sm"
                        variant="outline"
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsLoading && transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          Loading transactions…
                        </TableCell>
                      </TableRow>
                    )}
                    {!transactionsLoading && !transactionsError && transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No transactions.
                        </TableCell>
                      </TableRow>
                    )}
                    {transactions.map(transaction => {
                      const amount = Number(transaction.amount);
                      return (
                        <TableRow
                          key={transaction.id}
                          className={transaction.refunded ? 'bg-destructive/5' : undefined}
                        >
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={transaction.type === 'SALE' ? 'secondary' : 'default'}
                              >
                                {transaction.type === 'SALE' ? 'Sale' : 'Payout'}
                              </Badge>
                              {transaction.refunded && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                  Refunded
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.sellerFullName}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                            {transaction.payoutComponent === 'SELLER_INCENTIVE_BONUS' && (
                              <span className="block text-xs text-muted-foreground">
                                Seller incentive bonus
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {transaction.reference || '—'}
                          </TableCell>
                          <TableCell
                            className={`
                              text-right font-medium
                              ${
                                transaction.refunded
                                  ? 'text-muted-foreground line-through'
                                  : amount < 0
                                    ? 'text-destructive'
                                    : 'text-foreground'
                              }
                            `}
                          >
                            {amount < 0 ? '-' : '+'}
                            {fmt(Math.abs(amount))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {transactionPagination && transactionPagination.lastPage > 1 && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="text-muted-foreground">
                      Page {transactionPagination.currentPage} of {transactionPagination.lastPage}
                      {' · '}
                      {transactionPagination.total} transactions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setTransactionPage(transactionPagination.prevPage ?? transactionPage)
                        }
                        disabled={!transactionPagination.prevPage || transactionsFetching}
                        size="sm"
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setTransactionPage(transactionPagination.nextPage ?? transactionPage)
                        }
                        disabled={!transactionPagination.nextPage || transactionsFetching}
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
          </TabsContent>

          {/* ── Buyer Refunds ── */}
          <TabsContent value="refunds">
            <Card>
              <CardContent className="p-0">
                {buyerRefundsError && (
                  <Alert variant="destructive" className="m-4">
                    <AlertDescription>
                      Could not load buyer refunds. Please try again.{' '}
                      <Button
                        onClick={() => void refetchBuyerRefunds()}
                        size="sm"
                        variant="outline"
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyerRefundsLoading && buyerRefunds.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          Loading buyer refunds…
                        </TableCell>
                      </TableRow>
                    )}
                    {!buyerRefundsLoading && !buyerRefundsError && buyerRefunds.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          No buyer refunds.
                        </TableCell>
                      </TableRow>
                    )}
                    {buyerRefunds.map(refund => (
                      <TableRow key={refund.complaintId}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(refund.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {refund.buyerFullName || `User ${refund.buyerId.slice(0, 6)}`}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {refund.listingTitle || 'Refunded item'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {refund.orderId ? `Order ${refund.orderId.slice(0, 8)}` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {fmt(Number(refund.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {buyerRefundsData && buyerRefundsData.pagination.lastPage > 1 && (
                  <div className="flex items-center justify-between gap-3 p-4 text-sm">
                    <p className="text-muted-foreground">
                      Page {buyerRefundsData.pagination.currentPage} of{' '}
                      {buyerRefundsData.pagination.lastPage}
                      {' · '}
                      {buyerRefundsData.pagination.total} buyer refunds
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setBuyerRefundPage(
                            buyerRefundsData.pagination.prevPage ?? buyerRefundPage,
                          )
                        }
                        disabled={!buyerRefundsData.pagination.prevPage || buyerRefundsFetching}
                        size="sm"
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setBuyerRefundPage(
                            buyerRefundsData.pagination.nextPage ?? buyerRefundPage,
                          )
                        }
                        disabled={!buyerRefundsData.pagination.nextPage || buyerRefundsFetching}
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
          </TabsContent>

          {/* ── Payout History ── */}
          <TabsContent value="history">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Filter by seller</Label>
                  <Select
                    onValueChange={value => {
                      setSellerFilter(value);
                      setSellerPaymentPage(1);
                    }}
                    value={sellerFilter}
                  >
                    <SelectTrigger className="h-9 w-64" disabled={sellerFilterSummariesLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sellers</SelectItem>
                      {sellerFilterSummaries.map(s => (
                        <SelectItem key={s.sellerId} value={s.sellerId}>
                          {s.sellerFullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paid at</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellerPaymentsError && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center">
                          <Alert variant="destructive" className="mx-auto max-w-xl text-left">
                            <AlertDescription>
                              Could not load payout history. Please try again.{' '}
                              <Button
                                onClick={() => void refetchSellerPayments()}
                                size="sm"
                                variant="outline"
                              >
                                Retry
                              </Button>
                            </AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                    {sellerPaymentsLoading && sellerPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          Loading payout history…
                        </TableCell>
                      </TableRow>
                    )}
                    {!sellerPaymentsLoading &&
                      !sellerPaymentsError &&
                      sellerPayments.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No payouts recorded yet.
                          </TableCell>
                        </TableRow>
                      )}
                    {sellerPayments.map(p => (
                      <TableRow
                        key={p.id}
                        aria-haspopup="dialog"
                        aria-label={`View payout details for ${p.sellerFullName}`}
                        className="
                          cursor-pointer
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        "
                        onClick={() => setSelectedSellerPayment(p)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedSellerPayment(p);
                          }
                        }}
                        tabIndex={0}
                      >
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(p.paidAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{p.sellerFullName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.periodStart && p.periodEnd ? `${p.periodStart} → ${p.periodEnd}` : '—'}
                        </TableCell>
                        <TableCell>{p.method ? formatEnumLabel(p.method) : '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.reference || '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {fmt(Number(p.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sellerPaymentsData && sellerPaymentsData.pagination.lastPage > 1 && (
                  <div className="flex items-center justify-between gap-3 p-4 text-sm">
                    <p className="text-muted-foreground">
                      Page {sellerPaymentsData.pagination.currentPage} of{' '}
                      {sellerPaymentsData.pagination.lastPage}
                      {' · '}
                      {sellerPaymentsData.pagination.total} payments
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setSellerPaymentPage(
                            sellerPaymentsData.pagination.prevPage ?? sellerPaymentPage,
                          )
                        }
                        disabled={!sellerPaymentsData.pagination.prevPage || sellerPaymentsFetching}
                        size="sm"
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setSellerPaymentPage(
                            sellerPaymentsData.pagination.nextPage ?? sellerPaymentPage,
                          )
                        }
                        disabled={!sellerPaymentsData.pagination.nextPage || sellerPaymentsFetching}
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
          </TabsContent>

          {/* ── Period Report ── */}
          <TabsContent value="period">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rs" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="rs"
                      onChange={event => setRangeStart(event.target.value)}
                      value={rangeStart}
                      type="date"
                      className="h-9 w-44"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="re" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="re"
                      onChange={event => setRangeEnd(event.target.value)}
                      value={rangeEnd}
                      type="date"
                      className="h-9 w-44"
                    />
                  </div>
                  {rangeStart && rangeEnd && (
                    <>
                      <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary">
                          {periodTotals.count} of {periodItems.length} selected
                        </Badge>
                        <Badge variant="outline">Payouts {fmt(periodTotals.payoutTotal)}</Badge>
                        <Badge variant="outline" className="text-destructive">
                          Refunds {fmt(periodTotals.refundTotal)}
                        </Badge>
                      </div>
                      <Button
                        onClick={exportPeriodCsv}
                        disabled={periodTotals.count === 0}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="mr-2 h-4 w-4" /> Export selected
                      </Button>
                    </>
                  )}
                </div>

                {!rangeStart || !rangeEnd ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                    <CalendarRange className="h-8 w-8" />
                    <p className="text-sm">
                      Select a date range to view payouts and refunds for that period.
                    </p>
                  </div>
                ) : rangeEnd < rangeStart ? (
                  <p className="py-10 text-center text-sm text-destructive">
                    Period end must be on or after period start.
                  </p>
                ) : periodReportLoading ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Loading period report…
                  </div>
                ) : periodReportError ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <p className="text-sm text-destructive">
                      Could not load the period report. Please try again.
                    </p>
                    <Button onClick={retryPeriodReport} size="sm" variant="outline">
                      Retry
                    </Button>
                  </div>
                ) : periodItems.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No payouts or refunds in this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            onCheckedChange={toggleAllSelected}
                            aria-label="Select all"
                            checked={
                              selectedIds.size === periodItems.length && periodItems.length > 0
                            }
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodItems.map(index => {
                        const checked = selectedIds.has(index.id);
                        return (
                          <TableRow
                            key={index.id}
                            data-state={checked ? 'selected' : undefined}
                            className={checked ? undefined : 'opacity-60'}
                          >
                            <TableCell>
                              <Checkbox
                                onCheckedChange={() => toggleSelected(index.id)}
                                aria-label={`Select ${index.description}`}
                                checked={checked}
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(index.at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {index.kind === 'payout' ? (
                                <Badge>Payout</Badge>
                              ) : (
                                <Badge variant="destructive">Refund</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{index.party}</TableCell>
                            <TableCell className="max-w-xs truncate">{index.description}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {index.reference}
                            </TableCell>
                            <TableCell
                              className={`
                                text-right font-medium
                                ${index.kind === 'refund' ? 'text-destructive' : ''}
                              `}
                            >
                              {fmt(index.amount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ── Payout Run Detail Dialog ── */}
      <Dialog open={Boolean(recordPayoutSellerId)} onOpenChange={closeRecordPayout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payout</DialogTitle>
            <DialogDescription>
              {sellerPayablePreview?.sellerFullName
                ? `Review the payout for ${sellerPayablePreview.sellerFullName}.`
                : 'Review the seller payout before recording it.'}
            </DialogDescription>
          </DialogHeader>

          {sellerPayablePreviewLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading seller payout preview…
            </p>
          )}

          {sellerPayablePreviewError && (
            <Alert variant="destructive">
              <AlertDescription>
                Could not load the seller payout preview. Please try again.{' '}
                <Button
                  disabled={sellerPayablePreviewFetching}
                  onClick={() => void refetchSellerPayablePreview()}
                  size="sm"
                  variant="outline"
                >
                  {sellerPayablePreviewFetching ? 'Retrying…' : 'Retry'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {sellerPayablePreview && (
            <form
              className="space-y-4"
              onSubmit={recordSellerPaymentForm.handleSubmit(submitSellerPayment)}
            >
              <div
                className="
                  grid gap-4
                  sm:grid-cols-2
                "
              >
                <div className="space-y-1.5">
                  <Label htmlFor="seller-payout-amount">Amount (PKR)</Label>
                  <Input
                    id="seller-payout-amount"
                    readOnly
                    value={
                      sellerPayablePreview.total === null ? '—' : fmt(sellerPayablePreview.total)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seller-payout-method">Method</Label>
                  <Input id="seller-payout-method" readOnly value="Bank transfer" />
                </div>
                <div
                  className="
                    space-y-1.5
                    sm:col-span-2
                  "
                >
                  <Label>Payment period</Label>
                  <p className="rounded-md border px-3 py-2 text-sm">
                    {sellerPayablePreview.periodStart && sellerPayablePreview.periodEnd
                      ? `${format(new Date(sellerPayablePreview.periodStart), 'MMM d, yyyy')} – ${format(new Date(sellerPayablePreview.periodEnd), 'MMM d, yyyy')}`
                      : '—'}
                  </p>
                </div>
              </div>

              {sellerPayablePreview.payableStatus === 'REVIEW_REQUIRED' && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Finance review is required:{' '}
                    {sellerPayablePreview.reviewReason
                      ? sellerPayoutReviewReasonLabels[sellerPayablePreview.reviewReason]
                      : 'the reason is unavailable'}
                    .
                  </AlertDescription>
                </Alert>
              )}

              {sellerPayablePreview.bankDetailsDiffer && (
                <Alert>
                  <AlertDescription>
                    Bank details differ between payout items. Check the account before transferring.
                  </AlertDescription>
                </Alert>
              )}

              <div
                className="
                  grid gap-3 rounded-md border p-3
                  sm:grid-cols-2
                "
              >
                <div>
                  <p className="text-xs text-muted-foreground">Base payout</p>
                  <p className="font-medium">{fmt(Number(sellerPayablePreview.base ?? 0))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seller incentive bonus</p>
                  <p className="font-medium">
                    {fmt(Number(sellerPayablePreview.sellerIncentiveBonus ?? 0))}
                  </p>
                </div>
              </div>

              <div
                className="
                  grid gap-4
                  sm:grid-cols-2
                "
              >
                <div className="space-y-1.5">
                  <Label htmlFor="seller-payout-account-holder">Account holder</Label>
                  <Input
                    id="seller-payout-account-holder"
                    readOnly
                    value={sellerPayablePreview.bankAccountHolder ?? '—'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seller-payout-account-number">Account number</Label>
                  <Input
                    id="seller-payout-account-number"
                    readOnly
                    value={sellerPayablePreview.bankAccountNumber ?? '—'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seller-payout-iban">IBAN</Label>
                  <Input
                    id="seller-payout-iban"
                    readOnly
                    value={sellerPayablePreview.bankIban ?? '—'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seller-payout-bank-name">Bank name</Label>
                  <Input
                    id="seller-payout-bank-name"
                    readOnly
                    value={sellerPayablePreview.bankName ?? '—'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seller-payout-bank-swift">SWIFT</Label>
                  <Input
                    id="seller-payout-bank-swift"
                    readOnly
                    value={sellerPayablePreview.bankSwift ?? '—'}
                  />
                </div>
              </div>

              {sellerPayablePreview.bankDetailsMissing && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Complete bank details are required before you can record this payout.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="seller-payout-reference">Reference</Label>
                <Input
                  id="seller-payout-reference"
                  {...recordSellerPaymentForm.register('reference')}
                />
                {recordSellerPaymentForm.formState.errors.reference?.message && (
                  <p className="text-sm text-destructive" role="alert">
                    {recordSellerPaymentForm.formState.errors.reference.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seller-payout-notes">Notes (optional)</Label>
                <Input id="seller-payout-notes" {...recordSellerPaymentForm.register('notes')} />
              </div>

              <p className="text-sm text-muted-foreground">
                Recording a payment does not move money. Transfer the funds first, then record the
                payment here.
              </p>

              {recordPayoutError && (
                <Alert variant="destructive">
                  <AlertDescription>{recordPayoutError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  disabled={recordAdminSellerPaymentMutation.isPending}
                  onClick={() => closeRecordPayout(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    sellerPayablePreview.total === null ||
                    Boolean(recordPayoutReviewReason) ||
                    sellerPayablePreview.payableStatus === 'REVIEW_REQUIRED' ||
                    sellerPayablePreview.bankDetailsMissing ||
                    recordAdminSellerPaymentMutation.isPending
                  }
                  type="submit"
                >
                  {recordAdminSellerPaymentMutation.isPending ? 'Saving payout…' : 'Save payout'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={open => {
          if (!open) setSelectedSellerPayment(null);
        }}
        open={Boolean(selectedSellerPayment)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payout details</DialogTitle>
            <DialogDescription>
              {selectedPaymentDetails
                ? `${selectedPaymentDetails.sellerFullName} · ${fmt(selectedPaymentDetails.amount)} · ${format(
                    new Date(selectedPaymentDetails.paidAt),
                    'MMM d, yyyy',
                  )}`
                : 'View the details for this seller payment.'}
            </DialogDescription>
          </DialogHeader>
          {sellerPaymentDetailLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading payout details…
            </p>
          )}
          {sellerPaymentDetailError && (
            <Alert variant="destructive">
              <AlertDescription>
                {sellerPaymentDetailNotFound
                  ? 'This payment is no longer available.'
                  : 'Could not load payout details. Please try again.'}{' '}
                {!sellerPaymentDetailNotFound && (
                  <Button
                    onClick={() => void refetchSellerPaymentDetail()}
                    size="sm"
                    variant="outline"
                  >
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          {sellerPaymentDetail && (
            <div className="space-y-4">
              <div
                className="
                  grid grid-cols-2 gap-3 text-sm
                  md:grid-cols-4
                "
              >
                <Info
                  label="Method"
                  value={
                    sellerPaymentDetail.method ? formatEnumLabel(sellerPaymentDetail.method) : '—'
                  }
                />
                <Info
                  label="Period"
                  value={
                    sellerPaymentDetail.periodStart && sellerPaymentDetail.periodEnd
                      ? `${sellerPaymentDetail.periodStart} → ${sellerPaymentDetail.periodEnd}`
                      : 'All time'
                  }
                />
                <Info label="Reference" value={sellerPaymentDetail.reference || '—'} />
                <Info
                  label="Sales included"
                  value={String(
                    sellerPaymentDetail.items.filter(
                      item => item.payoutComponent === 'BASE' && !item.refunded,
                    ).length,
                  )}
                />
              </div>
              {sellerPaymentDetail.baseAmount !== null && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Base payout" value={fmt(sellerPaymentDetail.baseAmount)} />
                  <Info
                    label="Seller incentive bonus"
                    value={fmt(sellerPaymentDetail.sellerIncentiveBonusAmount ?? 0)}
                  />
                </div>
              )}
              {sellerPaymentDetail.notes && (
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{sellerPaymentDetail.notes}</p>
                </div>
              )}
              {sellerPaymentDetail.itemsAvailable ? (
                <div className="max-h-[50vh] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellerPaymentDetail.items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No settled items.
                          </TableCell>
                        </TableRow>
                      )}
                      {sellerPaymentDetail.items.map((item, index) => (
                        <TableRow
                          key={`${item.orderId}-${item.payoutComponent}-${index}`}
                          className={item.refunded ? 'bg-destructive/5' : undefined}
                        >
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {format(new Date(item.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            <div className="flex items-center gap-1.5">
                              <span>{item.title}</span>
                              {item.payoutComponent === 'SELLER_INCENTIVE_BONUS' && (
                                <PayoutComponentCaption payoutComponent={item.payoutComponent} />
                              )}
                              {item.refunded && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                  Refunded
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.buyerFullName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            Order {item.orderId.slice(0, 8)}
                          </TableCell>
                          <TableCell
                            className={`
                              text-right font-medium
                              ${item.refunded ? 'text-muted-foreground line-through' : ''}
                            `}
                          >
                            {fmt(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
                  No item breakdown is available for this payment.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedSellerPayment(null)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  tone: 'accent' | 'muted' | 'negative' | 'positive';
  value: string;
}) {
  let toneClass = 'text-muted-foreground bg-muted';
  switch (tone) {
    case 'positive': {
      toneClass = 'text-emerald-600 bg-emerald-500/10';
      break;
    }
    case 'negative': {
      toneClass = 'text-destructive bg-destructive/10';
      break;
    }
    case 'accent': {
      toneClass = 'text-primary bg-primary/10';
      break;
    }
  }
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`
            flex h-10 w-10 items-center justify-center rounded-md
            ${toneClass}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-heading text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}

export default Payouts;
