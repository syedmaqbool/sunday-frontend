import type {
  AdminMarginDatePreset,
  AdminMarginDateRange,
  AdminMarginFilter,
  AdminMarginReportOrder,
  AdminMarginReportParams,
} from '@/types/adminMarginReport.type';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import AccessDenied from '@/components/admin/AccessDenied';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useAccessControl } from '@/hooks/useAccessControl';
import { cn } from '@/lib/utilities';
import { getAdminFinanceReportSummaryQueryOptions } from '@/queries/adminFinanceReport.query';
import { getAdminMarginReportQueryOptions } from '@/queries/adminMarginReport.query';

const SELLER_SHARE_RATE = 5;
const PAGE_SIZE = 20;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function getAdminMarginDateRange(
  preset: AdminMarginDatePreset,
  referenceDate = new Date(),
): AdminMarginDateRange {
  if (preset === 'all')
    return {};

  const endDate = new Date(referenceDate);

  if (preset === 'today') {
    const startDate = new Date(referenceDate);
    startDate.setHours(0, 0, 0, 0);
    return { from: startDate.toISOString(), to: endDate.toISOString() };
  }

  const trailingDays = Number(preset.slice(0, -1));
  const startDate = new Date(referenceDate.getTime() - trailingDays * DAY_IN_MILLISECONDS);
  return { from: startDate.toISOString(), to: endDate.toISOString() };
}

function formatCurrency(amount: number) {
  const roundedAmount = Math.round(amount * 100) / 100;
  return `Rs ${roundedAmount.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

function MarginBadge({ value }: { value: number }) {
  return value >= 0
    ? (
        <Badge
          className="
            gap-1 bg-primary/10 text-primary
            hover:bg-primary/10
          "
        >
          <TrendingUp aria-hidden="true" className="h-3 w-3" />
          Positive margin
        </Badge>
      )
    : (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown aria-hidden="true" className="h-3 w-3" />
          Negative margin
        </Badge>
      );
}

function OrderDetails({ order }: { order: AdminMarginReportOrder }) {
  return (
    <div className="space-y-3 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Buyer:
        {' '}
        <span className="text-foreground">{order.buyerName}</span>
        {' · '}
        Seller
        {' '}
        {SELLER_SHARE_RATE}
        {'% share reported: '}
        {' '}
        {formatCurrency(order.sellerShare)}
      </p>
      {order.sellers.map(seller => (
        <section
          key={seller.sellerId}
          aria-label={`${seller.sellerName} seller details`}
          className="rounded-md border border-border bg-card p-3"
        >
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
            <span className="font-medium">{seller.sellerName}</span>
            <span className="text-muted-foreground">
              <span>Bank:</span>
              {' '}
              <span>{seller.bankName}</span>
              {' · '}
              <span>Estimated payout:</span>
              {' '}
              <span>{formatCurrency(seller.estimatedPayout)}</span>
              {' · '}
              <span>Estimated fee:</span>
              {' '}
              <span>{formatCurrency(seller.estimatedPayoutFee)}</span>
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {seller.items.map(item => (
              <li
                key={`${item.title}-${item.unitPrice}-${item.quantity}-${item.commissionAmount}`}
                className="flex flex-wrap justify-between gap-x-4"
              >
                <span>
                  {item.title}
                  {' × '}
                  {item.quantity}
                </span>
                <span>
                  <span>Gross line value:</span>
                  {' '}
                  <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                  {' · '}
                  <span>Commission:</span>
                  {' '}
                  <span>{formatCurrency(item.commissionAmount)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MarginFinancials() {
  const { can, isAdmin } = useAccessControl();
  const canReadFinancials = isAdmin || can('FINANCE_DASHBOARD_READ');
  const [datePreset, setDatePreset] = useState<AdminMarginDatePreset>('30d');
  const [marginFilter, setMarginFilter] = useState<AdminMarginFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(() => new Set());
  const dateRange = useMemo(() => getAdminMarginDateRange(datePreset), [datePreset]);
  const parameters = useMemo(() => {
    const queryParameters: AdminMarginReportParams = {
      ...dateRange,
      marginFilter,
      page,
      size: PAGE_SIZE,
    };

    if (search.trim())
      queryParameters.search = search.trim();

    return queryParameters;
  }, [dateRange, marginFilter, page, search]);
  const reportQuery = useQuery({
    ...getAdminMarginReportQueryOptions(parameters),
    enabled: canReadFinancials,
  });
  const financeReportParameters = useMemo(() => ({
    page: 1,
    size: 1,
    ...(dateRange.from && { periodStart: dateRange.from }),
    ...(dateRange.to && { periodEnd: dateRange.to }),
  }), [dateRange]);
  const financeReportQuery = useQuery({
    ...getAdminFinanceReportSummaryQueryOptions(financeReportParameters),
    enabled: canReadFinancials,
  });

  if (!canReadFinancials) {
    return (
      <AccessDenied description="Finance dashboard access is required to view Margin & Financials." />
    );
  }

  const report = reportQuery.data;
  const aggregates = report?.aggregates;
  const orders = report?.data ?? [];
  const pagination = report?.pagination;
  const summary = aggregates
    ? [
        { label: 'Order Value', value: formatCurrency(aggregates.orderValue) },
        { label: 'Seller Coupon Discount', value: `−${formatCurrency(aggregates.sellerCouponDiscount)}` },
        { label: 'Buyer Discount', value: `−${formatCurrency(aggregates.buyerDiscount)}` },
        { label: 'Final Order Amount', value: formatCurrency(aggregates.finalOrderAmount) },
        { label: 'Platform Commission', value: formatCurrency(aggregates.platformCommission) },
        { label: 'Seller Payout', value: formatCurrency(aggregates.sellerPayout) },
        { label: `Seller ${SELLER_SHARE_RATE}% Share`, value: `−${formatCurrency(aggregates.sellerShare)}` },
        { label: 'Estimated Payout Fees', value: `−${formatCurrency(aggregates.estimatedPayoutFee)}` },
        ...(financeReportQuery.data?.aggregates
          ? [{
              label: 'Seller incentive marketing cost',
              value: `−${formatCurrency(financeReportQuery.data.aggregates.sellerIncentiveBonusCogsMinorUnits / 100)}`,
            }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Margin &amp; Order Financials</h1>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Orders with items appear in this report only after every item is delivered, either when
          the buyer confirms receipt or when delivery completes automatically.
        </p>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Margin = Platform commission − seller coupon discount − buyer discount − seller
          {' '}
          {SELLER_SHARE_RATE}
          {'% share − estimated payout fees (HBL Rs 25, other banks Rs 75 per seller). '}
          {' '}
          The seller share applies only when a seller coupon is used. Tax is pass-through.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Payout fees are estimates for this report. They do not change actual payouts.
        </p>
      </header>

      <div
        className="
          flex flex-col gap-3
          sm:flex-row sm:flex-wrap
        "
      >
        <Input
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          value={search}
          aria-label="Search orders"
          placeholder="Search order, buyer, seller, bank…"
          className="sm:max-w-xs"
        />
        <Select
          onValueChange={(value) => {
            setDatePreset(value as AdminMarginDatePreset);
            setPage(1);
          }}
          value={datePreset}
        >
          <SelectTrigger aria-label="Date range" className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => {
            setMarginFilter(value as AdminMarginFilter);
            setPage(1);
          }}
          value={marginFilter}
        >
          <SelectTrigger aria-label="Margin filter" className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All margins</SelectItem>
            <SelectItem value="positive">Positive only (includes zero)</SelectItem>
            <SelectItem value="negative">Negative only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">
            Summary
            {aggregates && (
              <span className="font-normal text-muted-foreground">
                {' · '}
                {aggregates.matchingOrderCount}
                {' orders ('}
                {aggregates.nonNegativeMarginOrderCount}
                {' positive, '}
                {aggregates.negativeMarginOrderCount}
                {' negative)'}
              </span>
            )}
          </CardTitle>
          {aggregates && <MarginBadge value={aggregates.platformMargin} />}
        </CardHeader>
        <CardContent>
          {reportQuery.isLoading
            ? <p className="py-4 text-sm text-muted-foreground">Loading report totals…</p>
            : (
                <div
                  className="
                    grid grid-cols-2 gap-3
                    sm:grid-cols-3
                    xl:grid-cols-5
                  "
                >
                  {summary.map(metric => (
                    <div key={metric.label} className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="mt-1 font-semibold">{metric.value}</p>
                    </div>
                  ))}
                  {aggregates && (
                    <div className={cn(
                      'rounded-md border p-3',
                      aggregates.platformMargin >= 0
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-destructive/40 bg-destructive/5',
                    )}
                    >
                      <p className="text-xs text-muted-foreground">Platform Margin</p>
                      <p className={cn(
                        'mt-1 font-semibold',
                        aggregates.platformMargin >= 0 ? 'text-primary' : 'text-destructive',
                      )}
                      >
                        {formatCurrency(aggregates.platformMargin)}
                      </p>
                    </div>
                  )}
                </div>
              )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {reportQuery.isLoading
            ? (
                <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                  <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                  Loading orders…
                </div>
              )
            : reportQuery.isError
              ? (
                  <div role="alert" className="space-y-3 p-10 text-center">
                    <p className="text-sm text-destructive">Could not load the margin report.</p>
                    <Button onClick={() => void reportQuery.refetch()} variant="outline">
                      Retry
                    </Button>
                  </div>
                )
              : orders.length === 0
                ? <p className="p-10 text-center text-sm text-muted-foreground">No orders match the current filters.</p>
                : (
                    <div className="overflow-x-auto">
                      <Table className="min-w-[1120px] text-sm">
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-10" />
                            <TableHead>Order</TableHead>
                            <TableHead>Order Value</TableHead>
                            <TableHead>Seller Coupon Discount</TableHead>
                            <TableHead>Buyer Discount</TableHead>
                            <TableHead>Final Order Amount</TableHead>
                            <TableHead>Platform Commission</TableHead>
                            <TableHead>Seller Payout</TableHead>
                            <TableHead>Est. Payout Fee</TableHead>
                            <TableHead>Bank(s)</TableHead>
                            <TableHead>Platform Margin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => {
                            const isExpanded = expandedOrderIds.has(order.id);
                            return (
                              <Fragment key={order.id}>
                                <TableRow>
                                  <TableCell className="px-2">
                                    <Button
                                      onClick={() => setExpandedOrderIds((current) => {
                                        const next = new Set(current);
                                        if (next.has(order.id))
                                          next.delete(order.id);
                                        else
                                          next.add(order.id);
                                        return next;
                                      })}
                                      aria-expanded={isExpanded}
                                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} order ${order.id}`}
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                    >
                                      {isExpanded
                                        ? <ChevronDown aria-hidden="true" className="h-4 w-4" />
                                        : <ChevronRight aria-hidden="true" className="h-4 w-4" />}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <p className="flex gap-0.5 font-mono text-xs">
                                      <span>#</span>
                                      <span>{order.id.slice(0, 8)}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(order.createdAt).toLocaleDateString()}
                                      {' · '}
                                      {order.status.replaceAll('_', ' ')}
                                    </p>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">{formatCurrency(order.orderValue)}</TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {order.sellerCouponDiscount ? `−${formatCurrency(order.sellerCouponDiscount)}` : '—'}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {order.buyerDiscount ? `−${formatCurrency(order.buyerDiscount)}` : '—'}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">{formatCurrency(order.finalOrderAmount)}</TableCell>
                                  <TableCell className="whitespace-nowrap">{formatCurrency(order.platformCommission)}</TableCell>
                                  <TableCell className="whitespace-nowrap">{formatCurrency(order.sellerPayout)}</TableCell>
                                  <TableCell className="whitespace-nowrap">{formatCurrency(order.estimatedPayoutFee)}</TableCell>
                                  <TableCell>{order.bankNames}</TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <p className={cn(
                                      'font-semibold',
                                      order.platformMargin >= 0 ? 'text-primary' : 'text-destructive',
                                    )}
                                    >
                                      {formatCurrency(order.platformMargin)}
                                    </p>
                                    <MarginBadge value={order.platformMargin} />
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <TableRow className="bg-muted/30">
                                    <TableCell colSpan={11} className="p-0">
                                      <OrderDetails order={order} />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Page
                {' '}
                {pagination.currentPage}
                {' of '}
                {pagination.lastPage}
                {' · '}
                {pagination.total}
                {' orders'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(pagination.prevPage ?? 1)}
                  aria-label="Previous page"
                  disabled={pagination.prevPage === null}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(pagination.nextPage ?? page)}
                  aria-label="Next page"
                  disabled={pagination.nextPage === null}
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
    </div>
  );
}

export default MarginFinancials;
