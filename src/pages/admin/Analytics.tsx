import { useQuery } from '@tanstack/react-query';
import type { ChartConfig } from '@/components/ui/chart';
import type { DimKey } from '@/types/adminAnalytics.type';

import {
  CheckCircle2,
  DollarSign,
  Download,
  Loader2,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {

  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utilities';
import {
  getAdminAnalyticsQueryOptions,
  getAdminMarketingLeadsQueryOptions,
} from '@/queries/adminAnalytics.query';

// ── Dimension config ─────────────────────────────────────────────────────────
const DIMS: { key: DimKey; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'category', label: 'Category' },
  { key: 'priceRange', label: 'Price Range' },
  { key: 'buyerAgeBucket', label: 'Age' },
  { key: 'listingSize', label: 'Size' },
];
const DIM_LABELS = Object.fromEntries(
  DIMS.map(d => [d.key, d.label]),
) as Record<DimKey, string>;

// ── Backend bucket key → human label ─────────────────────────────────────────
const PRICE_RANGE_LABELS: Record<string, string> = {
  PKR_0_4999: 'Rs 0–4,999',
  PKR_10000_19999: 'Rs 10,000–19,999',
  PKR_20000_PLUS: 'Rs 20,000+',
  PKR_5000_9999: 'Rs 5,000–9,999',
  UNKNOWN: 'Unknown',
};
const AGE_BUCKET_LABELS: Record<string, string> = {
  AGE_13_17: '13–17',
  AGE_18_24: '18–24',
  AGE_25_34: '25–34',
  AGE_35_44: '35–44',
  AGE_45_PLUS: '45+',
  UNKNOWN: 'Unknown',
};
function humanizeKey(dim: DimKey, key: string) {
  if (dim === 'priceRange')
    return PRICE_RANGE_LABELS[key] ?? key;
  if (dim === 'buyerAgeBucket')
    return AGE_BUCKET_LABELS[key] ?? key;
  if (key === 'UNKNOWN')
    return 'Unknown';
  return key;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(15 75% 55%)',
  'hsl(35 70% 55%)',
  'hsl(200 60% 50%)',
  'hsl(140 50% 45%)',
  'hsl(270 50% 55%)',
  'hsl(0 65% 55%)',
];

function downloadCSV(rows: any[], filename: string) {
  if (rows.length === 0)
    return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => JSON.stringify(r[h] ?? '')).join(','),
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DimChips({
  onChange,
  value,
}: {
  onChange: (d: DimKey) => void;
  value: DimKey;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
      {DIMS.map(d => (
        <button
          key={d.key}
          onClick={() => onChange(d.key)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            value === d.key
              ? 'bg-background text-foreground shadow-sm'
              : `
                text-muted-foreground
                hover:text-foreground
              `,
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

function KPI({
  highlight,
  icon: Icon,
  label,
  value,
}: {
  highlight?: boolean;
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <Card
      className={cn(
        'transition-shadow',
        highlight && 'ring-1 ring-destructive/40',
      )}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

const LEAD_STATUS_META: Record<string, { label: string; tone: string }> = {
  CUSTOMER: { label: 'Customer', tone: 'bg-emerald-100 text-emerald-700' },
  ENGAGED: { label: 'Engaged', tone: 'bg-orange-100 text-orange-700' },
  NEW: { label: 'New', tone: 'bg-muted text-muted-foreground' },
};

function Analytics() {
  const [orderDim, setOrderDim] = useState<DimKey>('location');
  const [salesDim, setSalesDim] = useState<DimKey>('category');
  const [refundDim, setRefundDim] = useState<DimKey>('listingSize');
  const [convDim, setConvDim] = useState<DimKey>('buyerAgeBucket');
  const [offersDim, setOffersDim] = useState<DimKey>('category');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery(getAdminAnalyticsQueryOptions());
  const { data: leadsResult, isLoading: leadsLoading } = useQuery(getAdminMarketingLeadsQueryOptions({
      leadStatus: leadStatusFilter || undefined,
      search: leadSearch || undefined,
      size: 50,
    }));

  const leads = leadsResult?.data ?? [];
  const leadsTotal = leadsResult?.pagination?.total ?? 0;

  // ── Order volume (already sorted desc by orderCount from backend) ──────────
  const orderVolumeData = useMemo(() => {
    const rows = data?.breakdowns[orderDim] ?? [];
    return rows
      .slice(0, 8)
      .map(r => ({ key: humanizeKey(orderDim, r.key), value: r.orderCount }));
  }, [data, orderDim]);

  // ── Sales volume — re-sort by salesVolume (backend sorts by orderCount) ────
  const salesVolumeData = useMemo(() => {
    const rows = (data?.breakdowns[salesDim] ?? []).toSorted(
      (a, b) => b.salesVolume - a.salesVolume,
    );
    const total = rows.reduce((s, r) => s + r.salesVolume, 0) || 1;
    return rows.slice(0, 6).map(r => ({
      key: humanizeKey(salesDim, r.key),
      pct: Math.round((r.salesVolume / total) * 100),
      value: r.salesVolume,
    }));
  }, [data, salesDim]);

  // ── Refunds ──────────────────────────────────────────────────────────────
  const refundsData = useMemo(() => {
    const rows = (data?.breakdowns[refundDim] ?? []).filter(
      r => r.refundedComplaintCount > 0,
    );
    return rows
      .toSorted((a, b) => b.refundedComplaintCount - a.refundedComplaintCount)
      .slice(0, 5)
      .map(r => ({
        key: humanizeKey(refundDim, r.key),
        value: r.refundedComplaintCount,
      }));
  }, [data, refundDim]);

  // ── Funnel — already sorted desc by engagedOfferPairs ───────────────────────
  const funnelData = useMemo(() => {
    const rows = data?.funnels[convDim] ?? [];
    return rows.map(r => ({
      key: humanizeKey(convDim, r.key),
      accepted: r.acceptedOfferPairs,
      engaged: r.engagedOfferPairs,
      ordered: r.orderedPairs,
    }));
  }, [data, convDim]);
  const topFunnel = funnelData[0];

  // ── Avg offers before purchase — already sorted desc by orderedPairs ───────
  const avgOffersTiles = useMemo(() => {
    const rows = data?.averageOffersBeforePurchase[offersDim] ?? [];
    return rows.slice(0, 4).map(r => ({
      key: humanizeKey(offersDim, r.key),
      avg: r.averageOffersBeforePurchase,
      samples: r.orderedPairs,
    }));
  }, [data, offersDim]);

  // ── Price variance — per-dimension breakdown (no single global number) ─────
  const priceVarianceTiles = useMemo(() => {
    const rows = (data?.priceVariance[offersDim] ?? []).toSorted(
      (a, b) =>
        Math.abs(b.averageVariancePercentage)
        - Math.abs(a.averageVariancePercentage),
    );
    return rows.slice(0, 4).map(r => ({
      key: humanizeKey(offersDim, r.key),
      avgDiff: r.averageVarianceAmount,
      avgPct: r.averageVariancePercentage,
    }));
  }, [data, offersDim]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      <div className="
        flex flex-col gap-3
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Analytics Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Performance metrics for the marketplace
          </p>
        </div>
        <Button
          onClick={() =>
            downloadCSV(
              leads.map(l => ({
                location: l.location,
                name: l.name,
                offers: l.offerCount,
                orders: l.orderCount,
                phone: l.phone,
                status: LEAD_STATUS_META[l.leadStatus]?.label ?? l.leadStatus,
              })),
              'leads-report.csv',
            )}
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          {' '}
          Export Report
        </Button>
      </div>

      <div className="
        grid grid-cols-2 gap-3
        md:grid-cols-5
      "
      >
        <KPI
          value={`Rs ${(kpis?.totalRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          label="Total Revenue"
        />
        <KPI
          value={(kpis?.orderCount ?? 0).toLocaleString()}
          icon={ShoppingCart}
          label="Order Volume"
        />
        <KPI
          value={(kpis?.itemsSold ?? 0).toLocaleString()}
          icon={ShoppingBag}
          label="Items Sold"
        />
        <KPI
          value={`${(kpis?.refundRate ?? 0).toFixed(1)}%`}
          highlight
          icon={RotateCcw}
          label="Refund Rate"
        />
        <KPI
          value={`${(kpis?.averageOfferToOrderConversionRate ?? 0).toFixed(2)}%`}
          icon={Target}
          label="Offer→Order Conv."
        />
      </div>

      <div className="
        grid gap-4
        lg:grid-cols-2
      "
      >
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Order Volume</CardTitle>
              <p className="text-xs text-muted-foreground">
                Distribution by
                {' '}
                {DIM_LABELS[orderDim]}
              </p>
            </div>
            <DimChips onChange={setOrderDim} value={orderDim} />
          </CardHeader>
          <CardContent>
            {orderVolumeData.length === 0
              ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No data
                  </p>
                )
              : (
                  <ChartContainer
                    config={
                  {
                    value: { color: 'hsl(var(--primary))', label: 'Orders' },
                  } satisfies ChartConfig
                    }
                    className="h-[260px] w-full"
                  >
                    <BarChart
                      data={orderVolumeData}
                      margin={{ bottom: 0, left: 0, right: 10, top: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-border/40"
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="key"
                        tickLine={false}
                        className="text-[10px]"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        className="text-[10px]"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {orderVolumeData.map((data, index) => (
                          <Cell
                            key={data.key}
                            fill={
                              index === 0
                                ? 'hsl(var(--primary))'
                                : 'hsl(var(--primary) / 0.25)'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Sales Volume</CardTitle>
              <p className="text-xs text-muted-foreground">
                Revenue share by
                {' '}
                {DIM_LABELS[salesDim]}
              </p>
            </div>
            <DimChips onChange={setSalesDim} value={salesDim} />
          </CardHeader>
          <CardContent>
            {salesVolumeData.length === 0
              ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No data
                  </p>
                )
              : (
                  <div className="space-y-4 py-2">
                    {salesVolumeData.map(r => (
                      <div key={r.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {r.key}
                          </span>
                          <span className="text-muted-foreground">
                            {r.pct}
                            %
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            style={{ width: `${r.pct}%` }}
                            className="h-full rounded-full bg-primary transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Rs
                          {' '}
                          {Math.round(r.value).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>
      </div>

      <div className="
        grid gap-4
        lg:grid-cols-2
      "
      >
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Refunds Analytics</CardTitle>
              <p className="text-xs text-muted-foreground">
                Top
                {' '}
                {DIM_LABELS[refundDim]}
                {' '}
                buckets
              </p>
            </div>
            <DimChips onChange={setRefundDim} value={refundDim} />
          </CardHeader>
          <CardContent>
            {refundsData.length === 0
              ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No refund data
                  </p>
                )
              : (
                  <div className="
                    grid grid-cols-1 items-center gap-4
                    sm:grid-cols-2
                  "
                  >
                    <ChartContainer
                      config={{ value: { label: 'Refunds' } } satisfies ChartConfig}
                      className="h-[220px] w-full"
                    >
                      <PieChart>
                        <Pie
                          cx="50%"
                          cy="50%"
                          data={refundsData}
                          dataKey="value"
                          innerRadius={55}
                          nameKey="key"
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {refundsData.map((data, index) => (
                            <Cell
                              key={data.key}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-2">
                      {refundsData.map((r, index) => (
                        <div
                          key={r.key}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              style={{
                                background: CHART_COLORS[index % CHART_COLORS.length],
                              }}
                              className="h-2.5 w-2.5 rounded-full"
                            />
                            <span className="text-foreground">{r.key}</span>
                          </div>
                          <span className="font-semibold text-foreground">
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Conversion Funnel</CardTitle>
              <p className="text-xs text-muted-foreground">
                Engaged → Accepted → Purchased by
                {' '}
                {DIM_LABELS[convDim]}
              </p>
            </div>
            <DimChips onChange={setConvDim} value={convDim} />
          </CardHeader>
          <CardContent>
            {topFunnel
              ? (
                  <div className="space-y-3">
                    {[
                      {
                        icon: Users,
                        label: `Engaged · ${topFunnel.key}`,
                        tint: 'bg-rose-100 text-rose-600',
                        value: topFunnel.engaged,
                      },
                      {
                        icon: ShoppingBag,
                        label: 'Offer Accepted',
                        tint: 'bg-amber-100 text-amber-600',
                        value: topFunnel.accepted,
                      },
                      {
                        icon: CheckCircle2,
                        label: 'Purchased',
                        tint: 'bg-emerald-100 text-emerald-600',
                        value: topFunnel.ordered,
                      },
                    ].map((s) => {
                      const max = Math.max(topFunnel.engaged, 1);
                      return (
                        <div key={s.label} className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-full',
                              s.tint,
                            )}
                          >
                            <s.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground">
                                {s.label}
                              </span>
                              <span className="text-muted-foreground">
                                {s.value.toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                style={{ width: `${(s.value / max) * 100}%` }}
                                className="h-full rounded-full bg-primary"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No data
                  </p>
                )}
          </CardContent>
        </Card>
      </div>

      <div className="
        grid gap-4
        lg:grid-cols-3
      "
      >
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">
                Avg Number of Offers Before Order
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Sorted by
                {' '}
                {DIM_LABELS[offersDim]}
              </p>
            </div>
            <DimChips onChange={setOffersDim} value={offersDim} />
          </CardHeader>
          <CardContent>
            {avgOffersTiles.length === 0
              ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No data
                  </p>
                )
              : (
                  <div className="
                    grid grid-cols-2 gap-3
                    sm:grid-cols-4
                  "
                  >
                    {avgOffersTiles.map(t => (
                      <div
                        key={t.key}
                        className="rounded-lg border border-border bg-muted/30 p-4 text-center"
                      >
                        <p className="font-heading text-3xl font-bold text-primary">
                          {t.avg}
                        </p>
                        <p className="mt-1 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                          {t.key}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>

        <Card className="
          bg-amber-50/60
          dark:bg-amber-950/20
        "
        >
          <CardHeader className="space-y-0 pb-2">
            <p className="
              flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700
              dark:text-amber-400
            "
            >
              <Zap className="h-3 w-3" />
              {' '}
              Price Variation
            </p>
            <CardTitle className="text-base">
              Bid Delta by
              {' '}
              {DIM_LABELS[offersDim]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priceVarianceTiles.length === 0
              ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No accepted offers yet
                  </p>
                )
              : (
                  priceVarianceTiles.map(t => (
                    <div
                      key={t.key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-foreground">{t.key}</span>
                      <span
                        className={cn(
                          'font-semibold',
                          t.avgPct < 0 ? 'text-destructive' : 'text-emerald-600',
                        )}
                      >
                        {t.avgPct >= 0 ? '+' : ''}
                        {t.avgPct}
                        %
                      </span>
                    </div>
                  ))
                )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="
          flex flex-col gap-3
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div>
            <CardTitle className="text-base">Marketing Leads</CardTitle>
            <p className="text-xs text-muted-foreground">
              {leadsTotal}
              {' '}
              total leads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                onChange={event => setLeadSearch(event.target.value)}
                value={leadSearch}
                placeholder="Filter leads…"
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
            <Button
              onClick={() =>
                downloadCSV(
                  leads.map(l => ({
                    location: l.location,
                    name: l.name,
                    offers: l.offerCount,
                    orders: l.orderCount,
                    phone: l.phone,
                    status:
                      LEAD_STATUS_META[l.leadStatus]?.label ?? l.leadStatus,
                  })),
                  'marketing-leads.csv',
                )}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              {' '}
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leadsLoading
            ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>WhatsApp / Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Offers</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0
                      ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="py-8 text-center text-sm text-muted-foreground"
                            >
                              No leads
                            </TableCell>
                          </TableRow>
                        )
                      : (
                          leads.map((l) => {
                            const status
                              = LEAD_STATUS_META[l.leadStatus] ?? LEAD_STATUS_META.NEW;
                            return (
                              <TableRow key={l.userId}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold uppercase text-primary">
                                      {l.name.slice(0, 2)}
                                    </div>
                                    <span className="font-medium text-foreground">
                                      {l.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {l.phone || '—'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {l.location || '—'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {l.orderCount}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {l.offerCount}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={cn(
                                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                      status.tone,
                                    )}
                                  >
                                    {status.label}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                  </TableBody>
                </Table>
              )}
          {leadsTotal > leads.length && (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Showing
              {' '}
              {leads.length}
              {' '}
              of
              {' '}
              {leadsTotal}
              {' '}
              leads
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Analytics;
