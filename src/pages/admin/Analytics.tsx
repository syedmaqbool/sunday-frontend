import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  RotateCcw,
  Target,
  Heart,
  ShoppingBag,
  CheckCircle2,
  Search,
  Zap,
} from "lucide-react";
import { differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";

type Dim = "location" | "category" | "price_range" | "age" | "size";

const DIMS: { key: Dim; label: string }[] = [
  { key: "location", label: "Location" },
  { key: "category", label: "Category" },
  { key: "price_range", label: "Price Range" },
  { key: "age", label: "Age" },
  { key: "size", label: "Size" },
];
const DIM_LABELS = Object.fromEntries(DIMS.map((d) => [d.key, d.label])) as Record<Dim, string>;

const PRICE_BUCKETS = [
  { label: "0–50", min: 0, max: 50 },
  { label: "50–150", min: 50, max: 150 },
  { label: "150–500", min: 150, max: 500 },
  { label: "500–1500", min: 500, max: 1500 },
  { label: "1500+", min: 1500, max: Infinity },
];
const AGE_BUCKETS = [
  { label: "<18", min: 0, max: 18 },
  { label: "18–24", min: 18, max: 25 },
  { label: "25–34", min: 25, max: 35 },
  { label: "35–44", min: 35, max: 45 },
  { label: "45–54", min: 45, max: 55 },
  { label: "55+", min: 55, max: 200 },
];
const bucket = (v: number, b: typeof PRICE_BUCKETS) =>
  b.find((x) => v >= x.min && v < x.max)?.label ?? "Unknown";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(15 75% 55%)",
  "hsl(35 70% 55%)",
  "hsl(200 60% 50%)",
  "hsl(140 50% 45%)",
  "hsl(270 50% 55%)",
  "hsl(0 65% 55%)",
];

const downloadCSV = (rows: any[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const DimChips = ({ value, onChange }: { value: Dim; onChange: (d: Dim) => void }) => (
  <div className="flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
    {DIMS.map((d) => (
      <button
        key={d.key}
        onClick={() => onChange(d.key)}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
          value === d.key
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {d.label}
      </button>
    ))}
  </div>
);

const KPI = ({
  label,
  value,
  delta,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  delta?: number;
  icon: any;
  highlight?: boolean;
}) => (
  <Card className={cn("transition-shadow", highlight && "ring-1 ring-destructive/40")}>
    <CardContent className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              delta >= 0 ? "text-emerald-600" : "text-destructive",
            )}
          >
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const Analytics = () => {
  const [orderDim, setOrderDim] = useState<Dim>("location");
  const [salesDim, setSalesDim] = useState<Dim>("category");
  const [refundDim, setRefundDim] = useState<Dim>("size");
  const [convDim, setConvDim] = useState<Dim>("age");
  const [offersDim, setOffersDim] = useState<Dim>("category");
  const [leadSearch, setLeadSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics-data"],
    queryFn: async () => {
      const [orders, listings, profiles, complaints, offers] = await Promise.all([
        supabase.from("orders").select("id, buyer_id, items, subtotal, total, created_at, shipping_city"),
        supabase.from("listings").select("id, category, price, size, seller_id, title"),
        supabase.from("profiles").select("id, location, date_of_birth, phone, full_name"),
        supabase.from("complaints").select("id, buyer_id, listing_id, status, created_at"),
        supabase.from("offers").select("id, buyer_id, listing_id, amount, counter_amount, status, created_at"),
      ]);
      return {
        orders: orders.data ?? [],
        listings: listings.data ?? [],
        profiles: profiles.data ?? [],
        complaints: complaints.data ?? [],
        offers: offers.data ?? [],
      };
    },
  });

  const listingMap = useMemo(
    () => new Map((data?.listings ?? []).map((l) => [l.id, l])),
    [data],
  );
  const profileMap = useMemo(
    () => new Map((data?.profiles ?? []).map((p) => [p.id, p])),
    [data],
  );

  const dimKey = (
    dim: Dim,
    buyerId: string | null,
    listingId: string | null,
    cityFallback: string | null,
    priceFallback: number | null,
  ): string => {
    const listing = listingId ? (listingMap.get(listingId) as any) : null;
    const profile = buyerId ? (profileMap.get(buyerId) as any) : null;
    switch (dim) {
      case "location":
        return profile?.location || cityFallback || "Unknown";
      case "category":
        return listing?.category || "Unknown";
      case "price_range":
        return bucket(Number(listing?.price ?? priceFallback ?? 0), PRICE_BUCKETS);
      case "age": {
        if (!profile?.date_of_birth) return "Unknown";
        return bucket(differenceInYears(new Date(), new Date(profile.date_of_birth)), AGE_BUCKETS);
      }
      case "size":
        return listing?.size || "Unknown";
    }
  };

  const orderItemRows = useMemo(() => {
    const rows: { buyer: string; listing_id: string; price: number; qty: number; city: string | null; created_at: string }[] = [];
    for (const o of data?.orders ?? []) {
      for (const it of (o.items as any[]) ?? []) {
        rows.push({
          buyer: o.buyer_id,
          listing_id: it.listing_id,
          price: Number(it.price ?? 0),
          qty: Number(it.quantity ?? 1),
          city: o.shipping_city,
          created_at: o.created_at,
        });
      }
    }
    return rows;
  }, [data]);

  const kpis = useMemo(() => {
    const orders = data?.orders ?? [];
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const orderCount = orders.length;
    const itemsSold = orderItemRows.reduce((s, r) => s + r.qty, 0);
    const refundCount = (data?.complaints ?? []).filter((c) => c.status === "refunded").length;
    const refundRate = orderCount ? (refundCount / orderCount) * 100 : 0;
    const acceptedOffers = (data?.offers ?? []).filter((o) => o.status === "accepted").length;
    const totalOffers = (data?.offers ?? []).length;
    const conv = totalOffers ? (acceptedOffers / totalOffers) * 100 : 0;
    return { totalRevenue, orderCount, itemsSold, refundRate, conv };
  }, [data, orderItemRows]);

  const orderVolumeData = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of orderItemRows) {
      const k = dimKey(orderDim, r.buyer, r.listing_id, r.city, r.price);
      m.set(k, (m.get(k) ?? 0) + r.qty);
    }
    return Array.from(m, ([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [orderItemRows, orderDim, listingMap, profileMap]);

  const salesVolumeData = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of orderItemRows) {
      const k = dimKey(salesDim, r.buyer, r.listing_id, r.city, r.price);
      m.set(k, (m.get(k) ?? 0) + r.price * r.qty);
    }
    const rows = Array.from(m, ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
    const total = rows.reduce((s, x) => s + x.value, 0) || 1;
    return rows.slice(0, 6).map((r) => ({ ...r, pct: Math.round((r.value / total) * 100) }));
  }, [orderItemRows, salesDim, listingMap, profileMap]);

  const refundsData = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of data?.complaints ?? []) {
      if (c.status !== "refunded") continue;
      const k = dimKey(refundDim, c.buyer_id, c.listing_id, null, null);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m, ([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data, refundDim, listingMap, profileMap]);

  const funnelData = useMemo(() => {
    const offerSet = new Map<string, Set<string>>();
    for (const o of data?.offers ?? []) {
      const k = dimKey(convDim, o.buyer_id, o.listing_id, null, Number(o.amount));
      if (!offerSet.has(k)) offerSet.set(k, new Set());
      offerSet.get(k)!.add(`${o.buyer_id}|${o.listing_id}`);
    }
    const acceptedSet = new Map<string, Set<string>>();
    for (const o of (data?.offers ?? []).filter((o) => o.status === "accepted")) {
      const k = dimKey(convDim, o.buyer_id, o.listing_id, null, Number(o.amount));
      if (!acceptedSet.has(k)) acceptedSet.set(k, new Set());
      acceptedSet.get(k)!.add(`${o.buyer_id}|${o.listing_id}`);
    }
    const orderedSet = new Map<string, Set<string>>();
    for (const r of orderItemRows) {
      const k = dimKey(convDim, r.buyer, r.listing_id, r.city, r.price);
      if (!orderedSet.has(k)) orderedSet.set(k, new Set());
      orderedSet.get(k)!.add(`${r.buyer}|${r.listing_id}`);
    }
    const all = Array.from(new Set([...offerSet.keys(), ...orderedSet.keys()]));
    return all
      .map((k) => ({
        key: k,
        engaged: offerSet.get(k)?.size ?? 0,
        accepted: acceptedSet.get(k)?.size ?? 0,
        ordered: orderedSet.get(k)?.size ?? 0,
      }))
      .sort((a, b) => b.engaged - a.engaged);
  }, [data, orderItemRows, convDim, listingMap, profileMap]);

  const avgOffersTiles = useMemo(() => {
    const offersByPair = new Map<string, any[]>();
    for (const o of data?.offers ?? []) {
      const k = `${o.buyer_id}|${o.listing_id}`;
      if (!offersByPair.has(k)) offersByPair.set(k, []);
      offersByPair.get(k)!.push(o);
    }
    const agg = new Map<string, { sum: number; count: number }>();
    for (const r of orderItemRows) {
      const offers = offersByPair.get(`${r.buyer}|${r.listing_id}`) ?? [];
      const before = offers.filter((o) => new Date(o.created_at) <= new Date(r.created_at)).length;
      const k = dimKey(offersDim, r.buyer, r.listing_id, r.city, r.price);
      if (!agg.has(k)) agg.set(k, { sum: 0, count: 0 });
      const a = agg.get(k)!;
      a.sum += before;
      a.count += 1;
    }
    return Array.from(agg, ([key, v]) => ({
      key,
      avg: v.count ? Math.round((v.sum / v.count) * 10) / 10 : 0,
      samples: v.count,
    }))
      .sort((a, b) => b.samples - a.samples)
      .slice(0, 4);
  }, [data, orderItemRows, offersDim, listingMap, profileMap]);

  const priceVariance = useMemo(() => {
    let sumDiff = 0;
    let sumPct = 0;
    let n = 0;
    for (const o of data?.offers ?? []) {
      if (o.status !== "accepted") continue;
      const l = listingMap.get(o.listing_id) as any;
      if (!l) continue;
      const accepted = Number(o.counter_amount ?? o.amount);
      const original = Number(l.price);
      if (!original) continue;
      sumDiff += accepted - original;
      sumPct += ((accepted - original) / original) * 100;
      n += 1;
    }
    return {
      avgDiff: n ? Math.round((sumDiff / n) * 100) / 100 : 0,
      avgPct: n ? Math.round((sumPct / n) * 100) / 100 : 0,
      n,
    };
  }, [data, listingMap]);

  const marketingLeads = useMemo(() => {
    const orderCount = new Map<string, number>();
    for (const r of orderItemRows) orderCount.set(r.buyer, (orderCount.get(r.buyer) ?? 0) + 1);
    const offerCount = new Map<string, number>();
    for (const o of data?.offers ?? []) offerCount.set(o.buyer_id, (offerCount.get(o.buyer_id) ?? 0) + 1);

    const all = (data?.profiles ?? []).map((p: any) => {
      const orders = orderCount.get(p.id) ?? 0;
      const offers = offerCount.get(p.id) ?? 0;
      let status: { label: string; tone: string } = { label: "New", tone: "bg-muted text-muted-foreground" };
      if (orders >= 3) status = { label: "Qualified", tone: "bg-emerald-100 text-emerald-700" };
      else if (orders >= 1) status = { label: "Hot Lead", tone: "bg-orange-100 text-orange-700" };
      else if (offers >= 1) status = { label: "Nurturing", tone: "bg-sky-100 text-sky-700" };
      else status = { label: "At Risk", tone: "bg-rose-100 text-rose-700" };
      return {
        id: p.id,
        name: p.full_name || "—",
        phone: p.phone || "",
        location: p.location || "",
        orders,
        offers,
        status,
      };
    });
    return leadSearch
      ? all.filter(
          (l) =>
            l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
            l.phone.includes(leadSearch) ||
            l.location.toLowerCase().includes(leadSearch.toLowerCase()),
        )
      : all;
  }, [data, orderItemRows, leadSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const topFunnel = funnelData[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time performance metrics for the marketplace</p>
        </div>
        <Button
          size="sm"
          onClick={() => downloadCSV(marketingLeads.map(({ status, ...r }) => ({ ...r, status: status.label })), "leads-report.csv")}
        >
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KPI label="Total Revenue" value={`R ${kpis.totalRevenue.toLocaleString()}`} icon={DollarSign} delta={12.4} />
        <KPI label="Order Volume" value={kpis.orderCount.toLocaleString()} icon={ShoppingCart} delta={8.1} />
        <KPI label="Sales Volume" value={kpis.itemsSold.toLocaleString()} icon={ShoppingBag} delta={-2.4} />
        <KPI label="Refund Rate" value={`${kpis.refundRate.toFixed(1)}%`} icon={RotateCcw} delta={-0.5} highlight />
        <KPI label="Avg Conv. Rate" value={`${kpis.conv.toFixed(2)}%`} icon={Target} delta={4.2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Order Volume</CardTitle>
              <p className="text-xs text-muted-foreground">Distribution by {DIM_LABELS[orderDim]}</p>
            </div>
            <DimChips value={orderDim} onChange={setOrderDim} />
          </CardHeader>
          <CardContent>
            {orderVolumeData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ChartContainer
                config={{ value: { label: "Orders", color: "hsl(var(--primary))" } } satisfies ChartConfig}
                className="h-[260px] w-full"
              >
                <BarChart data={orderVolumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                  <XAxis dataKey="key" className="text-[10px]" tickLine={false} axisLine={false} />
                  <YAxis className="text-[10px]" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {orderVolumeData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.25)"} />
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
              <p className="text-xs text-muted-foreground">Revenue share by {DIM_LABELS[salesDim]}</p>
            </div>
            <DimChips value={salesDim} onChange={setSalesDim} />
          </CardHeader>
          <CardContent>
            {salesVolumeData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-4 py-2">
                {salesVolumeData.map((r) => (
                  <div key={r.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{r.key}</span>
                      <span className="text-muted-foreground">{r.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${r.pct}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">R {Math.round(r.value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Refunds Analytics</CardTitle>
              <p className="text-xs text-muted-foreground">Top {DIM_LABELS[refundDim]} buckets</p>
            </div>
            <DimChips value={refundDim} onChange={setRefundDim} />
          </CardHeader>
          <CardContent>
            {refundsData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No refund data</p>
            ) : (
              <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
                <ChartContainer
                  config={{ value: { label: "Refunds" } } satisfies ChartConfig}
                  className="h-[220px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={refundsData}
                      dataKey="value"
                      nameKey="key"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {refundsData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2">
                  {refundsData.map((r, i) => (
                    <div key={r.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-foreground">{r.key}</span>
                      </div>
                      <span className="font-semibold text-foreground">{r.value}</span>
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
              <p className="text-xs text-muted-foreground">Engaged → Accepted → Purchased by {DIM_LABELS[convDim]}</p>
            </div>
            <DimChips value={convDim} onChange={setConvDim} />
          </CardHeader>
          <CardContent>
            {!topFunnel ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: `Engaged · ${topFunnel.key}`, value: topFunnel.engaged, icon: Heart, tint: "bg-rose-100 text-rose-600" },
                  { label: "Offer Accepted", value: topFunnel.accepted, icon: ShoppingBag, tint: "bg-amber-100 text-amber-600" },
                  { label: "Purchased", value: topFunnel.ordered, icon: CheckCircle2, tint: "bg-emerald-100 text-emerald-600" },
                ].map((s) => {
                  const max = Math.max(topFunnel.engaged, 1);
                  return (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", s.tint)}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{s.label}</span>
                          <span className="text-muted-foreground">{s.value.toLocaleString()}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(s.value / max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Avg Number of Offers Before Order</CardTitle>
              <p className="text-xs text-muted-foreground">Sorted by {DIM_LABELS[offersDim]}</p>
            </div>
            <DimChips value={offersDim} onChange={setOffersDim} />
          </CardHeader>
          <CardContent>
            {avgOffersTiles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {avgOffersTiles.map((t) => (
                  <div key={t.key} className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <p className="font-heading text-3xl font-bold text-primary">{t.avg}</p>
                    <p className="mt-1 truncate text-[11px] uppercase tracking-wider text-muted-foreground">{t.key}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader className="space-y-0 pb-2">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Zap className="h-3 w-3" /> Price Variation
            </p>
            <CardTitle className="text-base">Market Bid Delta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Avg difference between listing price and accepted offer</p>
            <p
              className={cn(
                "font-heading text-4xl font-bold",
                priceVariance.avgPct < 0 ? "text-destructive" : "text-emerald-600",
              )}
            >
              {priceVariance.avgPct >= 0 ? "+" : ""}
              {priceVariance.avgPct}%
            </p>
            <p className="text-xs text-muted-foreground">
              {priceVariance.avgDiff >= 0 ? "+" : ""}R {priceVariance.avgDiff} avg · {priceVariance.n} accepted
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Marketing Leads</CardTitle>
            <p className="text-xs text-muted-foreground">High-potential buyers tracked from interest signals</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Filter leads…"
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCSV(
                  marketingLeads.map(({ status, ...r }) => ({ ...r, status: status.label })),
                  "marketing-leads.csv",
                )
              }
            >
              <Download className="mr-2 h-3.5 w-3.5" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {marketingLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No leads
                  </TableCell>
                </TableRow>
              ) : (
                marketingLeads.slice(0, 50).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold uppercase text-primary">
                          {l.name.slice(0, 2)}
                        </div>
                        <span className="font-medium text-foreground">{l.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.location || "—"}</TableCell>
                    <TableCell className="text-right text-sm">{l.orders}</TableCell>
                    <TableCell className="text-right text-sm">{l.offers}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          l.status.tone,
                        )}
                      >
                        {l.status.label}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {marketingLeads.length > 50 && (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Showing 50 of {marketingLeads.length} leads
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
