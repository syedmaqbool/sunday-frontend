import { useQuery } from '@tanstack/react-query';
import type { PayoutRun, PayoutRunItem, SellerPayout } from '@/types/payout.type';

import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  getAdminRefundReportOptions,
  getAdminSellerPayoutsOptions,
  getPayoutRunItemsOptions,
  getPayoutRunsOptions,
  useCreateSellerPayoutMutation,
} from '@/queries/payout.query';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SELLER_COMMISSION_SHARE_RATE = 5;

function fmt(n: number) {
  return `Rs ${(Math.round(n * 100) / 100).toLocaleString('en-PK', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
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

// ─── Component ────────────────────────────────────────────────────────────────

function Payouts() {
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSeller, setActiveSeller] = useState<{
    sellerId: string;
    balance: number;
    name: string;
  } | null>(null);
  const [detailRun, setDetailRun] = useState<PayoutRun | null>(null);
  const [form, setForm] = useState({
    amount: '',
    method: 'bank_transfer',
    notes: '',
    period_end: '',
    period_start: '',
    reference: '',
  });
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: runsData, isLoading: lruns } = useQuery(getPayoutRunsOptions());
  const { data: refundsData, isLoading: lrefunds } = useQuery(getAdminRefundReportOptions());
  const { data: sellerPayoutsData, isLoading: lpayouts } = useQuery(getAdminSellerPayoutsOptions(
      sellerFilter === 'all' ? {} : { sellerId: sellerFilter },
    ));
  const { data: periodPayoutsData } = useQuery(getAdminSellerPayoutsOptions(
      rangeStart && rangeEnd
        ? { periodEnd: rangeEnd, periodStart: rangeStart }
        : {},
    ));
  // Refund report doesn't support period filtering directly — we derive period
  // refunds from all refund items and filter by sourceDate on the client side.
  const { data: allRefundsData } = useQuery(getAdminRefundReportOptions());
  const { data: runItemsData } = useQuery(getPayoutRunItemsOptions(detailRun?.id ?? '', {}));

  const createSellerPayoutMutation = useCreateSellerPayoutMutation();

  const loading = lruns || lrefunds || lpayouts;

  // ─── Derived data ──────────────────────────────────────────────────────────

  const runs: PayoutRun[] = useMemo(() => runsData?.data ?? [], [runsData?.data]);
  const refundItems: PayoutRunItem[] = useMemo(
    () => refundsData?.data ?? [],
    [refundsData?.data],
  );
  const sellerPayouts: SellerPayout[] = useMemo(
    () => sellerPayoutsData?.data ?? [],
    [sellerPayoutsData?.data],
  );

  /** Aggregate per-seller summary from payout runs */
  const sellerSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        sellerId: string;
        balance: number;
        name: string;
        paid: number;
        sales: number;
      }
    >();

    // Build from seller payouts — each record tells us sellerId + amount paid
    for (const p of sellerPayouts) {
      if (!map.has(p.sellerId)) {
        map.set(p.sellerId, {
          sellerId: p.sellerId,
          balance: 0,
          name: p.sellerFullName || `User ${p.sellerId.slice(0, 6)}`,
          paid: 0,
          sales: 0,
        });
      }
      const s = map.get(p.sellerId)!;
      s.paid += Number(p.amount);
    }

    // Add sales from payout runs (sellerPayoutAmount per run)
    // We don't have per-seller breakdown from runs alone — balance is best shown
    // per run. For the "by seller" tab we rely on the sellerPayouts list.
    map.forEach((s) => {
      s.balance = s.sales - s.paid;
    });

    return Array.from(map.values()).toSorted((a, b) => b.balance - a.balance);
  }, [sellerPayouts]);

  /** Global totals from payout runs */
  const totals = useMemo(() => {
    let sales = 0;
    let refunds = 0;
    let totalPaid = 0;

    for (const run of runs) {
      sales += Number(run.sellerPayoutAmount);
      refunds += Number(run.buyerRefundAmount);
    }

    for (const payout of sellerPayouts)
      totalPaid += Number(payout.amount);

    return {
      due: Math.max(0, sales - totalPaid),
      paid: totalPaid,
      refunds,
      sales,
    };
  }, [runs, sellerPayouts]);

  // ─── Period report items ───────────────────────────────────────────────────

  const periodItems = useMemo<PeriodItem[]>(() => {
    if (!rangeStart || !rangeEnd)
      return [];

    const payoutPeriodItems: PeriodItem[] = (periodPayoutsData?.data ?? []).map(
      p => ({
        id: `payout-${p.id}`,
        amount: Number(p.amount),
        at: p.paidAt,
        description: `Payout · ${p.method.replace('_', ' ')}`,
        kind: 'payout',
        party: p.sellerFullName || `User ${p.sellerId.slice(0, 6)}`,
        reference:
          p.reference
          || (p.periodStart && p.periodEnd
            ? `${p.periodStart} → ${p.periodEnd}`
            : ''),
      }),
    );

    // Filter all refunds client-side by sourceDate within the selected range
    const start = new Date(rangeStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(rangeEnd);
    end.setHours(23, 59, 59, 999);

    const refundPeriodItems: PeriodItem[] = (allRefundsData?.data ?? [])
      .filter((r) => {
        const d = new Date(r.sourceDate ?? r.createdAt).getTime();
        return d >= start.getTime() && d <= end.getTime();
      })
      .map(r => ({
        id: `refund-${r.id}`,
        amount: Number(r.amount),
        at: r.sourceDate ?? r.createdAt,
        description:
          (r.sourceMetadata?.listingTitle as string) || 'Refunded item',
        kind: 'refund' as const,
        party: r.userFullName || `User ${r.buyerId?.slice(0, 6) ?? '?'}`,
        reference: r.orderId ? `Order ${r.orderId.slice(0, 8)}` : '',
      }));

    return [...payoutPeriodItems, ...refundPeriodItems].toSorted(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [rangeStart, rangeEnd, periodPayoutsData, allRefundsData]);

  const periodTotals = useMemo(() => {
    let payoutTotal = 0;
    let refundTotal = 0;
    for (const item of periodItems) {
      if (!selectedIds.has(item.id))
        continue;
      if (item.kind === 'payout')
        payoutTotal += item.amount;
      else refundTotal += item.amount;
    }
    return { count: selectedIds.size, payoutTotal, refundTotal };
  }, [periodItems, selectedIds]);

  // Auto-select all when period items load
  useEffect(() => {
    setSelectedIds(new Set(periodItems.map(index => index.id)));
  }, [periodItems]);

  const toggleSelected = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id))
        next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelected = () => {
    if (selectedIds.size === periodItems.length)
      setSelectedIds(new Set());
    else setSelectedIds(new Set(periodItems.map(index => index.id)));
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const openRecord = (s: {
    sellerId: string;
    balance: number;
    name: string;
  }) => {
    setActiveSeller(s);
    setForm({
      amount: s.balance > 0 ? s.balance.toFixed(2) : '',
      method: 'bank_transfer',
      notes: '',
      period_end: '',
      period_start: '',
      reference: '',
    });
    setDialogOpen(true);
  };

  const savePayout = async () => {
    if (!activeSeller)
      return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    if (!form.period_start || !form.period_end) {
      toast({
        title: 'Period start and end are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createSellerPayoutMutation.mutateAsync({
        sellerId: activeSeller.sellerId,
        amount,
        method: form.method,
        notes: form.notes || null,
        periodEnd: form.period_end,
        periodStart: form.period_start,
        reference: form.reference,
      });
      toast({
        description: `${fmt(amount)} to ${activeSeller.name}`,
        title: 'Payout recorded',
      });
      setDialogOpen(false);
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast({
        description: message,
        title: 'Could not save payout',
        variant: 'destructive',
      });
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Date', 'Seller', 'Period', 'Method', 'Reference', 'Amount (PKR)'],
      ...sellerPayouts.map(p => [
        format(new Date(p.paidAt), 'yyyy-MM-dd HH:mm'),
        p.sellerFullName,
        p.periodStart && p.periodEnd
          ? `${p.periodStart} → ${p.periodEnd}`
          : '—',
        p.method.replace('_', ' '),
        p.reference || '',
        Number(p.amount).toFixed(2),
      ]),
    ];
    const csv = rows
      .map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          index.description.replaceAll('"', '""'),
          index.reference.replaceAll('"', '""'),
          index.amount.toFixed(2),
        ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-period-${rangeStart}_to_${rangeEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Run detail items ──────────────────────────────────────────────────────

  const detailRunItems = runItemsData?.data ?? [];
  const detailSellerItems = detailRunItems.filter(
    index => index.itemType === 'SELLER_PAYOUT',
  );
  const detailRefundItems = detailRunItems.filter(
    index => index.itemType === 'BUYER_REFUND',
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Seller payouts</h2>
          <p className="text-sm text-muted-foreground">
            Sales become payout-eligible only after the buyer confirms receipt
            with no issues. Sellers also earn a flat
            {' '}
            {SELLER_COMMISSION_SHARE_RATE}
            % commission on the listing price,
            separate from the platform fee charged to the buyer.
          </p>
        </div>
        <Button onClick={exportCsv} size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {' '}
          Export CSV
        </Button>
      </div>

      <div className="
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
        <StatCard
          value={fmt(totals.paid)}
          icon={Wallet}
          label="Paid to sellers"
          tone="muted"
        />
        <StatCard
          value={fmt(totals.due)}
          icon={CircleDollarSign}
          label="Balance due"
          tone="accent"
        />
      </div>

      {loading
        ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )
        : (
            <Tabs defaultValue="runs" className="space-y-4">
              <TabsList>
                <TabsTrigger value="runs">Payout runs</TabsTrigger>
                <TabsTrigger value="sellers">By seller</TabsTrigger>
                <TabsTrigger value="refunds">Buyer refunds</TabsTrigger>
                <TabsTrigger value="history">Payout history</TabsTrigger>
                <TabsTrigger value="period">Period report</TabsTrigger>
              </TabsList>

              {/* ── Payout Runs ── */}
              <TabsContent value="runs">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Generated by</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                          <TableHead className="text-right">
                            Seller payouts
                          </TableHead>
                          <TableHead className="text-right">
                            Buyer refunds
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {runs.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="py-10 text-center text-muted-foreground"
                            >
                              No payout runs yet.
                            </TableCell>
                          </TableRow>
                        )}
                        {runs.map(r => (
                          <TableRow
                            key={r.id}
                            onClick={() => setDetailRun(r)}
                            className="cursor-pointer"
                          >
                            <TableCell className="whitespace-nowrap text-sm font-medium">
                              {r.periodStart
                                ? `${format(new Date(r.periodStart), 'MMM d')} → ${format(new Date(r.periodEnd), 'MMM d, yyyy')}`
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {r.generatedByFullName}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {Number(r.itemCount)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600">
                              {fmt(Number(r.sellerPayoutAmount))}
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                (
                                {Number(r.sellerPayoutItemCount)}
                                )
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {fmt(Number(r.buyerRefundAmount))}
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                (
                                {Number(r.buyerRefundItemCount)}
                                )
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {fmt(Number(r.totalAmount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── By Seller ── */}
              <TabsContent value="sellers">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seller</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sellerSummaries.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-10 text-center text-muted-foreground"
                            >
                              No seller activity yet.
                            </TableCell>
                          </TableRow>
                        )}
                        {sellerSummaries.map(s => (
                          <TableRow key={s.sellerId}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-right">
                              {fmt(s.paid)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() => openRecord(s)}
                                size="sm"
                                variant="outline"
                              >
                                Record payout
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Buyer Refunds ── */}
              <TabsContent value="refunds">
                <Card>
                  <CardContent className="p-0">
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
                        {refundItems.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-10 text-center text-muted-foreground"
                            >
                              No buyer refunds.
                            </TableCell>
                          </TableRow>
                        )}
                        {refundItems.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(
                                new Date(r.sourceDate ?? r.createdAt),
                                'MMM d, yyyy',
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {r.userFullName
                                || `User ${r.buyerId?.slice(0, 6) ?? '?'}`}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {(r.sourceMetadata?.listingTitle as string)
                                || 'Refunded item'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r.orderId ? `Order ${r.orderId.slice(0, 8)}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {fmt(Number(r.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Payout History ── */}
              <TabsContent value="history">
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Filter by seller
                      </Label>
                      <Select onValueChange={setSellerFilter} value={sellerFilter}>
                        <SelectTrigger className="h-9 w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sellers</SelectItem>
                          {sellerSummaries.map(s => (
                            <SelectItem key={s.sellerId} value={s.sellerId}>
                              {s.name}
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
                        {sellerPayouts.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="py-10 text-center text-muted-foreground"
                            >
                              No payouts recorded yet.
                            </TableCell>
                          </TableRow>
                        )}
                        {sellerPayouts.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(p.paidAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {p.sellerFullName}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {p.periodStart && p.periodEnd
                                ? `${p.periodStart} → ${p.periodEnd}`
                                : '—'}
                            </TableCell>
                            <TableCell className="capitalize">
                              {p.method.replace('_', ' ')}
                            </TableCell>
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Period Report ── */}
              <TabsContent value="period">
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="rs"
                          className="text-xs text-muted-foreground"
                        >
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
                        <Label
                          htmlFor="re"
                          className="text-xs text-muted-foreground"
                        >
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
                              {periodTotals.count}
                              {' '}
                              of
                              {periodItems.length}
                              {' '}
                              selected
                            </Badge>
                            <Badge variant="outline">
                              Payouts
                              {' '}
                              {fmt(periodTotals.payoutTotal)}
                            </Badge>
                            <Badge variant="outline" className="text-destructive">
                              Refunds
                              {' '}
                              {fmt(periodTotals.refundTotal)}
                            </Badge>
                          </div>
                          <Button
                            onClick={exportPeriodCsv}
                            disabled={periodTotals.count === 0}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            {' '}
                            Export selected
                          </Button>
                        </>
                      )}
                    </div>

                    {!rangeStart || !rangeEnd
                      ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                            <CalendarRange className="h-8 w-8" />
                            <p className="text-sm">
                              Select a date range to view payouts and refunds for that
                              period.
                            </p>
                          </div>
                        )
                      : (periodItems.length === 0
                          ? (
                              <div className="py-10 text-center text-sm text-muted-foreground">
                                No payouts or refunds in this period.
                              </div>
                            )
                          : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-10">
                                      <Checkbox
                                        onCheckedChange={toggleAllSelected}
                                        aria-label="Select all"
                                        checked={
                                          selectedIds.size === periodItems.length
                                          && periodItems.length > 0
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
                                  {periodItems.map((index) => {
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
                                          {index.kind === 'payout'
                                            ? (
                                                <Badge>Payout</Badge>
                                              )
                                            : (
                                                <Badge variant="destructive">Refund</Badge>
                                              )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {index.party}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                          {index.description}
                                        </TableCell>
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
                            ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

      {/* ── Record Payout Dialog ── */}
      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payout</DialogTitle>
            <DialogDescription>
              {activeSeller ? `Paying ${activeSeller.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input
                  id="amount"
                  onChange={event => setForm({ ...form, amount: event.target.value })}
                  value={form.amount}
                  step="0.01"
                  type="number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select
                  onValueChange={v => setForm({ ...form, method: v })}
                  value={form.method}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ps">
                  Period start
                  {' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ps"
                  onChange={event =>
                    setForm({ ...form, period_start: event.target.value })}
                  value={form.period_start}
                  type="date"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pe">
                  Period end
                  {' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pe"
                  onChange={event =>
                    setForm({ ...form, period_end: event.target.value })}
                  value={form.period_end}
                  type="date"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                onChange={event =>
                  setForm({ ...form, reference: event.target.value })}
                value={form.reference}
                placeholder="e.g. TX-2026-05-18-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                onChange={event => setForm({ ...form, notes: event.target.value })}
                value={form.notes}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={savePayout}
              disabled={createSellerPayoutMutation.isPending}
            >
              {createSellerPayoutMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Payout Run Detail Dialog ── */}
      <Dialog onOpenChange={o => !o && setDetailRun(null)} open={!!detailRun}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payout run details</DialogTitle>
            <DialogDescription>
              {detailRun
                ? `${detailRun.periodStart ? format(new Date(detailRun.periodStart), 'MMM d') : ''} → ${detailRun.periodEnd ? format(new Date(detailRun.periodEnd), 'MMM d, yyyy') : ''} · Generated by ${detailRun.generatedByFullName}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {detailRun && (
            <div className="space-y-4">
              <div className="
                grid grid-cols-2 gap-3 text-sm
                md:grid-cols-4
              "
              >
                <Info
                  value={fmt(Number(detailRun.sellerPayoutAmount))}
                  label="Seller payouts"
                />
                <Info
                  value={fmt(Number(detailRun.buyerRefundAmount))}
                  label="Buyer refunds"
                />
                <Info
                  value={String(Number(detailRun.itemCount))}
                  label="Total items"
                />
                <Info
                  value={fmt(Number(detailRun.totalAmount))}
                  label="Total"
                />
              </div>

              {detailSellerItems.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Seller payouts
                  </p>
                  <div className="max-h-60 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seller</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailSellerItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.userFullName
                                || `User ${item.sellerId?.slice(0, 6) ?? '?'}`}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {(item.sourceMetadata?.listingTitle as string)
                                || '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.orderId
                                ? `Order ${item.orderId.slice(0, 8)}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.status === 'PAID'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {fmt(Number(item.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {detailRefundItems.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Buyer refunds
                  </p>
                  <div className="max-h-60 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailRefundItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.userFullName
                                || `User ${item.buyerId?.slice(0, 6) ?? '?'}`}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {(item.sourceMetadata?.listingTitle as string)
                                || '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.orderId
                                ? `Order ${item.orderId.slice(0, 8)}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.status === 'PAID'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {fmt(Number(item.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailRun(null)} variant="outline">
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
