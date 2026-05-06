import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { differenceInYears } from "date-fns";

type Dim = "location" | "category" | "price_range" | "age" | "size";

const DIM_LABELS: Record<Dim, string> = {
  location: "Location",
  category: "Category",
  price_range: "Price range",
  age: "Buyer age",
  size: "Size",
};

const PRICE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "0–50", min: 0, max: 50 },
  { label: "50–150", min: 50, max: 150 },
  { label: "150–500", min: 150, max: 500 },
  { label: "500–1500", min: 500, max: 1500 },
  { label: "1500+", min: 1500, max: Infinity },
];
const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "<18", min: 0, max: 18 },
  { label: "18–24", min: 18, max: 25 },
  { label: "25–34", min: 25, max: 35 },
  { label: "35–44", min: 35, max: 45 },
  { label: "45–54", min: 45, max: 55 },
  { label: "55+", min: 55, max: 200 },
];

const bucket = (value: number, buckets: { label: string; min: number; max: number }[]) =>
  buckets.find((b) => value >= b.min && value < b.max)?.label ?? "Unknown";

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

const Analytics = () => {
  const [dim, setDim] = useState<Dim>("category");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics-data"],
    queryFn: async () => {
      const [orders, listings, profiles, complaints, offers] = await Promise.all([
        supabase.from("orders").select("id, buyer_id, items, subtotal, total, created_at, shipping_city"),
        supabase.from("listings").select("id, category, price, size, seller_id"),
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

  const dimKeyForItem = (
    buyerId: string | null,
    listingId: string | null,
    cityFallback: string | null,
    priceFallback: number | null,
  ): string => {
    const listing = listingId ? listingMap.get(listingId) : null;
    const profile = buyerId ? profileMap.get(buyerId) : null;
    switch (dim) {
      case "location":
        return profile?.location || cityFallback || "Unknown";
      case "category":
        return listing?.category || "Unknown";
      case "price_range": {
        const p = Number(listing?.price ?? priceFallback ?? 0);
        return bucket(p, PRICE_BUCKETS);
      }
      case "age": {
        if (!profile?.date_of_birth) return "Unknown";
        const yrs = differenceInYears(new Date(), new Date(profile.date_of_birth));
        return bucket(yrs, AGE_BUCKETS);
      }
      case "size":
        return listing?.size || "Unknown";
    }
  };

  // Build per-item rows from orders
  const orderItemRows = useMemo(() => {
    const rows: { buyer: string; listing_id: string; price: number; qty: number; city: string | null; created_at: string }[] = [];
    for (const o of data?.orders ?? []) {
      const items = (o.items as any[]) ?? [];
      for (const it of items) {
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

  // Aggregations
  const orderVolume = useMemo(() => {
    const agg = new Map<string, number>();
    for (const r of orderItemRows) {
      const k = dimKeyForItem(r.buyer, r.listing_id, r.city, r.price);
      agg.set(k, (agg.get(k) ?? 0) + r.qty);
    }
    return Array.from(agg, ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
  }, [orderItemRows, dim, listingMap, profileMap]);

  const salesVolume = useMemo(() => {
    const agg = new Map<string, number>();
    for (const r of orderItemRows) {
      const k = dimKeyForItem(r.buyer, r.listing_id, r.city, r.price);
      agg.set(k, (agg.get(k) ?? 0) + r.price * r.qty);
    }
    return Array.from(agg, ([key, value]) => ({ key, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  }, [orderItemRows, dim, listingMap, profileMap]);

  const refunds = useMemo(() => {
    const agg = new Map<string, number>();
    for (const c of data?.complaints ?? []) {
      if (c.status !== "refunded") continue;
      const k = dimKeyForItem(c.buyer_id, c.listing_id, null, null);
      agg.set(k, (agg.get(k) ?? 0) + 1);
    }
    return Array.from(agg, ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
  }, [data, dim, listingMap, profileMap]);

  // Favorites→order conversion: favorites table doesn't exist; use offers→order conversion as proxy
  const offersToOrder = useMemo(() => {
    const buyersOrdered = new Map<string, Set<string>>(); // dimKey -> buyer set
    for (const r of orderItemRows) {
      const k = dimKeyForItem(r.buyer, r.listing_id, r.city, r.price);
      if (!buyersOrdered.has(k)) buyersOrdered.set(k, new Set());
      buyersOrdered.get(k)!.add(`${r.buyer}|${r.listing_id}`);
    }
    const offerCounts = new Map<string, Set<string>>();
    for (const o of data?.offers ?? []) {
      const k = dimKeyForItem(o.buyer_id, o.listing_id, null, Number(o.amount));
      if (!offerCounts.has(k)) offerCounts.set(k, new Set());
      offerCounts.get(k)!.add(`${o.buyer_id}|${o.listing_id}`);
    }
    const keys = new Set([...offerCounts.keys(), ...buyersOrdered.keys()]);
    return Array.from(keys).map((key) => {
      const offers = offerCounts.get(key)?.size ?? 0;
      const orders = buyersOrdered.get(key)?.size ?? 0;
      const conversion = offers ? Math.round((orders / offers) * 1000) / 10 : 0;
      return { key, offers, orders, conversion };
    }).sort((a, b) => b.conversion - a.conversion);
  }, [data, orderItemRows, dim, listingMap, profileMap]);

  const avgOffersBeforeOrder = useMemo(() => {
    // For each (buyer,listing) that resulted in an order, count offers from same buyer on same listing prior to order
    const offersByPair = new Map<string, any[]>();
    for (const o of data?.offers ?? []) {
      const k = `${o.buyer_id}|${o.listing_id}`;
      if (!offersByPair.has(k)) offersByPair.set(k, []);
      offersByPair.get(k)!.push(o);
    }
    const agg = new Map<string, { sum: number; count: number }>();
    for (const r of orderItemRows) {
      const pair = `${r.buyer}|${r.listing_id}`;
      const offers = offersByPair.get(pair) ?? [];
      const before = offers.filter((o) => new Date(o.created_at) <= new Date(r.created_at)).length;
      const k = dimKeyForItem(r.buyer, r.listing_id, r.city, r.price);
      if (!agg.has(k)) agg.set(k, { sum: 0, count: 0 });
      const a = agg.get(k)!;
      a.sum += before;
      a.count += 1;
    }
    return Array.from(agg, ([key, v]) => ({ key, avg: v.count ? Math.round((v.sum / v.count) * 100) / 100 : 0, samples: v.count }))
      .sort((a, b) => b.avg - a.avg);
  }, [data, orderItemRows, dim, listingMap, profileMap]);

  const priceVariance = useMemo(() => {
    // Compare accepted offer amount vs original listing price
    let totalDiff = 0;
    let totalPct = 0;
    let n = 0;
    const rows: { listing: string; original: number; accepted: number; diff: number; pct: number }[] = [];
    for (const o of data?.offers ?? []) {
      if (o.status !== "accepted") continue;
      const listing = listingMap.get(o.listing_id);
      if (!listing) continue;
      const accepted = Number(o.counter_amount ?? o.amount);
      const original = Number(listing.price);
      if (!original) continue;
      const diff = accepted - original;
      const pct = (diff / original) * 100;
      totalDiff += diff;
      totalPct += pct;
      n += 1;
      rows.push({ listing: o.listing_id, original, accepted, diff: Math.round(diff * 100) / 100, pct: Math.round(pct * 100) / 100 });
    }
    return {
      avgDiff: n ? Math.round((totalDiff / n) * 100) / 100 : 0,
      avgPct: n ? Math.round((totalPct / n) * 100) / 100 : 0,
      n,
      rows: rows.slice(0, 30),
    };
  }, [data, listingMap]);

  const marketingContacts = useMemo(() => {
    return (data?.profiles ?? [])
      .map((p) => ({
        name: p.full_name ?? "",
        phone: p.phone ?? "",
        location: p.location ?? "",
      }))
      .filter((p) => p.phone);
  }, [data]);

  const exportContacts = async () => {
    // Fetch emails via auth admin not available client-side. Use profiles + offers proxy: include phone (WhatsApp).
    downloadCSV(marketingContacts, "marketing-contacts.csv");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const SimpleTable = ({ rows, valueLabel = "Count" }: { rows: { key: string; value: number }[]; valueLabel?: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{DIM_LABELS[dim]}</TableHead>
          <TableHead className="text-right">{valueLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
        ) : rows.map((r) => (
          <TableRow key={r.key}>
            <TableCell>{r.key}</TableCell>
            <TableCell className="text-right font-medium">{r.value.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Analytics Reports</h2>
          <p className="text-sm text-muted-foreground">Cross-cutting marketplace metrics and exports.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Group by</span>
          <Select value={dim} onValueChange={(v) => setDim(v as Dim)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(DIM_LABELS) as Dim[]).map((d) => (
                <SelectItem key={d} value={d}>{DIM_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="orders">Order volume</TabsTrigger>
          <TabsTrigger value="sales">Sales volume</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="offers-avg">Avg offers</TabsTrigger>
          <TabsTrigger value="variance">Price variance</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Order volume by {DIM_LABELS[dim]}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV(orderVolume, `order-volume-${dim}.csv`)}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </CardHeader>
            <CardContent><SimpleTable rows={orderVolume} valueLabel="Items ordered" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sales volume by {DIM_LABELS[dim]}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV(salesVolume, `sales-volume-${dim}.csv`)}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </CardHeader>
            <CardContent><SimpleTable rows={salesVolume} valueLabel="Revenue (R)" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Refunds by {DIM_LABELS[dim]}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV(refunds, `refunds-${dim}.csv`)}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </CardHeader>
            <CardContent><SimpleTable rows={refunds} valueLabel="Refunded complaints" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Engagement → order conversion by {DIM_LABELS[dim]}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV(offersToOrder, `conversion-${dim}.csv`)}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Favorites are not yet tracked in the database; this report uses offers as the engagement proxy.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{DIM_LABELS[dim]}</TableHead>
                    <TableHead className="text-right">Engaged buyers</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Conversion %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offersToOrder.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                  ) : offersToOrder.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell>{r.key}</TableCell>
                      <TableCell className="text-right">{r.offers}</TableCell>
                      <TableCell className="text-right">{r.orders}</TableCell>
                      <TableCell className="text-right font-medium">{r.conversion}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers-avg">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Avg offers before order by {DIM_LABELS[dim]}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV(avgOffersBeforeOrder, `avg-offers-${dim}.csv`)}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{DIM_LABELS[dim]}</TableHead>
                    <TableHead className="text-right">Avg offers</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avgOffersBeforeOrder.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                  ) : avgOffersBeforeOrder.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell>{r.key}</TableCell>
                      <TableCell className="text-right font-medium">{r.avg}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.samples}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Listing price vs accepted bid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Avg variation</p>
                  <p className="font-heading text-xl font-bold">
                    {priceVariance.avgDiff > 0 ? "+" : ""}{priceVariance.avgDiff} R
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Avg %</p>
                  <p className="font-heading text-xl font-bold">
                    {priceVariance.avgPct > 0 ? "+" : ""}{priceVariance.avgPct}%
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Accepted offers</p>
                  <p className="font-heading text-xl font-bold">{priceVariance.n}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead className="text-right">Original</TableHead>
                    <TableHead className="text-right">Accepted</TableHead>
                    <TableHead className="text-right">Δ</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceVariance.rows.map((r, i) => {
                    const l = listingMap.get(r.listing);
                    return (
                      <TableRow key={i}>
                        <TableCell className="max-w-xs truncate">{(l as any)?.title ?? r.listing.slice(0, 8)}</TableCell>
                        <TableCell className="text-right">R {r.original}</TableCell>
                        <TableCell className="text-right">R {r.accepted}</TableCell>
                        <TableCell className={`text-right ${r.diff < 0 ? "text-destructive" : "text-foreground"}`}>{r.diff > 0 ? "+" : ""}{r.diff}</TableCell>
                        <TableCell className={`text-right ${r.pct < 0 ? "text-destructive" : "text-foreground"}`}>{r.pct > 0 ? "+" : ""}{r.pct}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Marketing contacts ({marketingContacts.length})</CardTitle>
              <Button size="sm" onClick={exportContacts}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Phone numbers (WhatsApp) from user profiles. User emails are stored in the auth system and require a backend export.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone / WhatsApp</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketingContacts.slice(0, 100).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.name || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                      <TableCell>{c.location || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
