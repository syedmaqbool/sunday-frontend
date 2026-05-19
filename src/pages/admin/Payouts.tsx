import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wallet, Download, ArrowDownRight, ArrowUpRight, CircleDollarSign, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

type OrderItem = {
  listing_id?: string;
  title?: string;
  price?: number;
  quantity?: number;
  seller_id?: string;
};

type Order = {
  id: string;
  buyer_id: string;
  status: string;
  items: OrderItem[];
  created_at: string;
  item_status?: Record<string, { status?: string }> | null;
};

// A sale is payout-eligible only after the buyer confirms receipt with no
// issues. Auto-completed orders (after the 12h confirmation window) also count.
const CONFIRMED_STATUSES = new Set(["received", "completed"]);
const isItemConfirmed = (order: Order, listingId?: string) => {
  if (!listingId) return false;
  const s = order.item_status?.[listingId]?.status?.toLowerCase?.();
  return !!s && CONFIRMED_STATUSES.has(s);
};

type Complaint = {
  id: string;
  order_id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  status: string;
  resolved_at: string | null;
  updated_at: string;
  created_at: string;
};

type Profile = { id: string; full_name: string | null };

type Payout = {
  id: string;
  seller_id: string;
  period_start: string | null;
  period_end: string | null;
  amount: number;
  method: string;
  reference: string;
  notes: string;
  status: string;
  paid_at: string;
  created_at: string;
};

type TxnKind = "sale" | "refund" | "payout";
type Txn = {
  id: string;
  kind: TxnKind;
  at: string;
  seller_id: string;
  amount: number; // positive = credit to seller, negative = debit
  description: string;
  reference?: string;
  refunded?: boolean; // sale later refunded — excluded from payout balance
};

type SellerSummary = {
  seller_id: string;
  name: string;
  sales: number;          // net sales eligible for payout (excludes refunded)
  refundedSales: number;  // gross value of refunded sales (excluded from payout)
  refundedCount: number;
  paid: number;
  balance: number;
};

type BuyerRefund = {
  id: string;
  buyer_id: string;
  buyer_name: string;
  order_id: string;
  listing_id: string;
  title: string;
  amount: number;
  at: string;
};

const fmt = (n: number) =>
  `Rs ${(Math.round(n * 100) / 100).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const itemGross = (it: OrderItem) => Number(it.price ?? 0) * Number(it.quantity ?? 1);
const itemCommission = (it: OrderItem) => Number((it as any).commission_amount ?? 0);
/** Seller payout = full listing price. The platform fee is paid by the buyer on top at checkout. */
const itemTotal = (it: OrderItem) => itemGross(it);

const Payouts = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSeller, setActiveSeller] = useState<SellerSummary | null>(null);
  const [detailPayout, setDetailPayout] = useState<Payout | null>(null);
  const [form, setForm] = useState({
    amount: "",
    method: "bank_transfer",
    reference: "",
    notes: "",
    period_start: "",
    period_end: "",
  });
  const [saving, setSaving] = useState(false);
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rangeInitialized, setRangeInitialized] = useState(false);

  const { data: orders = [], isLoading: lo } = useQuery({
    queryKey: ["admin-payouts-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, buyer_id, status, items, item_status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const { data: complaints = [], isLoading: lc } = useQuery({
    queryKey: ["admin-payouts-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, order_id, listing_id, seller_id, buyer_id, status, resolved_at, updated_at, created_at")
        .eq("status", "refunded");
      if (error) throw error;
      return (data ?? []) as unknown as Complaint[];
    },
  });

  const { data: payouts = [], isLoading: lp } = useQuery({
    queryKey: ["admin-payouts-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_payouts")
        .select("*")
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Payout[];
    },
  });

  const sellerIds = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => o.items?.forEach((it) => it.seller_id && s.add(it.seller_id)));
    payouts.forEach((p) => p.seller_id && s.add(p.seller_id));
    return Array.from(s);
  }, [orders, payouts]);

  const buyerIds = useMemo(() => {
    const s = new Set<string>();
    complaints.forEach((c) => c.buyer_id && s.add(c.buyer_id));
    return Array.from(s);
  }, [complaints]);

  const profileIds = useMemo(
    () => Array.from(new Set([...sellerIds, ...buyerIds])),
    [sellerIds, buyerIds],
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-payouts-profiles", profileIds.sort().join(",")],
    enabled: profileIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.full_name?.trim() || `User ${id.slice(0, 6)}`;

  const { transactions, summaries, buyerRefunds } = useMemo(() => {
    const txns: Txn[] = [];
    const map = new Map<string, SellerSummary>();
    const ensure = (sid: string): SellerSummary => {
      let s = map.get(sid);
      if (!s) {
        s = { seller_id: sid, name: nameOf(sid), sales: 0, refundedSales: 0, refundedCount: 0, paid: 0, balance: 0 };
        map.set(sid, s);
      }
      return s;
    };

    // Build a quick lookup of refunded (order_id, listing_id) pairs
    const refundedKey = (orderId: string, listingId: string) => `${orderId}|${listingId}`;
    const refundedSet = new Set<string>(
      complaints.map((c) => refundedKey(c.order_id, c.listing_id)),
    );

    orders.forEach((o) => {
      (o.items ?? []).forEach((it, idx) => {
        if (!it.seller_id) return;
        const amt = itemTotal(it);
        const s = ensure(it.seller_id);
        const isRefunded = it.listing_id ? refundedSet.has(refundedKey(o.id, it.listing_id)) : false;
        const confirmed = isItemConfirmed(o, it.listing_id);
        if (isRefunded) {
          s.refundedSales += amt;
          s.refundedCount += 1;
        } else if (confirmed) {
          s.sales += amt;
        } else {
          // Not yet confirmed by buyer — not eligible for payout. Skip entirely.
          return;
        }
        txns.push({
          id: `sale-${o.id}-${idx}`,
          kind: "sale",
          at: o.created_at,
          seller_id: it.seller_id,
          amount: isRefunded ? 0 : amt,
          description: isRefunded ? `Refunded — ${it.title || "Item"}` : it.title || "Item sold",
          reference: `Order ${o.id.slice(0, 8)}`,
          refunded: isRefunded,
        });
      });
    });

    payouts.forEach((p) => {
      const s = ensure(p.seller_id);
      s.paid += Number(p.amount);
      txns.push({
        id: `payout-${p.id}`,
        kind: "payout",
        at: p.paid_at,
        seller_id: p.seller_id,
        amount: -Number(p.amount),
        description: `Payout · ${p.method.replace("_", " ")}`,
        reference: p.reference || (p.period_start && p.period_end ? `${p.period_start} → ${p.period_end}` : ""),
      });
    });

    const refunds: BuyerRefund[] = complaints.map((c) => {
      const order = orders.find((o) => o.id === c.order_id);
      const item = order?.items?.find((it) => it.listing_id === c.listing_id);
      return {
        id: c.id,
        buyer_id: c.buyer_id,
        buyer_name: nameOf(c.buyer_id),
        order_id: c.order_id,
        listing_id: c.listing_id,
        title: item?.title || "Refunded item",
        amount: item ? itemTotal(item) : 0,
        at: c.resolved_at || c.updated_at || c.created_at,
      };
    });

    map.forEach((s) => {
      s.balance = s.sales - s.paid;
    });

    const list = Array.from(map.values()).sort((a, b) => b.balance - a.balance);
    txns.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    refunds.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { transactions: txns, summaries: list, buyerRefunds: refunds };
  }, [orders, complaints, payouts, profiles]);

  const filteredTxns = useMemo(
    () => (sellerFilter === "all" ? transactions : transactions.filter((t) => t.seller_id === sellerFilter)),
    [transactions, sellerFilter],
  );

  const totals = useMemo(() => {
    const sellerTotals = summaries.reduce(
      (acc, s) => {
        acc.sales += s.sales;
        acc.paid += s.paid;
        acc.due += Math.max(0, s.balance);
        return acc;
      },
      { sales: 0, paid: 0, due: 0 },
    );
    const refundTotal = buyerRefunds.reduce((sum, r) => sum + r.amount, 0);
    return { ...sellerTotals, refunds: refundTotal };
  }, [summaries, buyerRefunds]);

  type PeriodItem = {
    id: string;
    kind: "payout" | "refund";
    at: string;
    party: string;
    description: string;
    reference: string;
    amount: number;
  };

  const periodItems = useMemo<PeriodItem[]>(() => {
    if (!rangeStart || !rangeEnd) return [];
    const start = new Date(rangeStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(rangeEnd);
    end.setHours(23, 59, 59, 999);
    const inRange = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };
    const items: PeriodItem[] = [];
    payouts.forEach((p) => {
      if (!inRange(p.paid_at)) return;
      items.push({
        id: `payout-${p.id}`,
        kind: "payout",
        at: p.paid_at,
        party: nameOf(p.seller_id),
        description: `Payout · ${p.method.replace("_", " ")}`,
        reference: p.reference || (p.period_start && p.period_end ? `${p.period_start} → ${p.period_end}` : ""),
        amount: Number(p.amount),
      });
    });
    buyerRefunds.forEach((r) => {
      if (!inRange(r.at)) return;
      items.push({
        id: `refund-${r.id}`,
        kind: "refund",
        at: r.at,
        party: r.buyer_name,
        description: r.title,
        reference: `Order ${r.order_id.slice(0, 8)}`,
        amount: r.amount,
      });
    });
    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return items;
  }, [rangeStart, rangeEnd, payouts, buyerRefunds, profiles]);

  useEffect(() => {
    if (!rangeStart || !rangeEnd) {
      setSelectedIds(new Set());
      setRangeInitialized(false);
      return;
    }
    setSelectedIds(new Set(periodItems.map((i) => i.id)));
    setRangeInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, periodItems.length]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelected = () => {
    if (selectedIds.size === periodItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(periodItems.map((i) => i.id)));
  };

  const periodTotals = useMemo(() => {
    let payoutTotal = 0;
    let refundTotal = 0;
    periodItems.forEach((i) => {
      if (!selectedIds.has(i.id)) return;
      if (i.kind === "payout") payoutTotal += i.amount;
      else refundTotal += i.amount;
    });
    return { payoutTotal, refundTotal, count: selectedIds.size };
  }, [periodItems, selectedIds]);

  const exportPeriodCsv = () => {
    const rows = [
      ["Date", "Type", "Party", "Description", "Reference", "Amount (PKR)"],
      ...periodItems
        .filter((i) => selectedIds.has(i.id))
        .map((i) => [
          format(new Date(i.at), "yyyy-MM-dd HH:mm"),
          i.kind,
          i.party,
          i.description.replace(/"/g, '""'),
          i.reference.replace(/"/g, '""'),
          i.amount.toFixed(2),
        ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-period-${rangeStart}_to_${rangeEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openRecord = (s: SellerSummary) => {
    setActiveSeller(s);
    setForm({
      amount: s.balance > 0 ? s.balance.toFixed(2) : "",
      method: "bank_transfer",
      reference: "",
      notes: "",
      period_start: "",
      period_end: "",
    });
    setDialogOpen(true);
  };

  const savePayout = async () => {
    if (!activeSeller) return;
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("seller_payouts").insert({
      seller_id: activeSeller.seller_id,
      amount,
      method: form.method,
      reference: form.reference,
      notes: form.notes,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      status: "paid",
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save payout", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payout recorded", description: `${fmt(amount)} to ${activeSeller.name}` });
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-payouts-records"] });
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Type", "Seller", "Amount (PKR)", "Description", "Reference"],
      ...filteredTxns.map((t) => [
        format(new Date(t.at), "yyyy-MM-dd HH:mm"),
        t.kind,
        nameOf(t.seller_id),
        t.amount.toFixed(2),
        t.description.replace(/"/g, '""'),
        (t.reference ?? "").replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = lo || lc || lp;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Seller payouts</h2>
          <p className="text-sm text-muted-foreground">
            Sales become payout-eligible only after the buyer confirms receipt with no issues.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Gross sales" value={fmt(totals.sales)} icon={ArrowUpRight} tone="positive" />
        <StatCard label="Buyer refunds" value={fmt(totals.refunds)} icon={ArrowDownRight} tone="negative" />
        <StatCard label="Paid to sellers" value={fmt(totals.paid)} icon={Wallet} tone="muted" />
        <StatCard label="Balance due" value={fmt(totals.due)} icon={CircleDollarSign} tone="accent" />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="sellers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sellers">By seller</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="refunds">Buyer refunds</TabsTrigger>
            <TabsTrigger value="history">Payout history</TabsTrigger>
            <TabsTrigger value="period">Period report</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Net sales</TableHead>
                      <TableHead className="text-right">Refunded (excluded)</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance due</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No seller activity yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {summaries.map((s) => (
                      <TableRow key={s.seller_id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">{fmt(s.sales)}</TableCell>
                        <TableCell className="text-right">
                          {s.refundedSales > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-destructive">
                              <span>−{fmt(s.refundedSales)}</span>
                              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                {s.refundedCount}
                              </Badge>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{fmt(s.paid)}</TableCell>
                        <TableCell className="text-right">
                          <span className={s.balance > 0 ? "font-semibold text-primary" : "text-muted-foreground"}>
                            {fmt(s.balance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant={s.balance > 0 ? "default" : "outline"} onClick={() => openRecord(s)}>
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

          <TabsContent value="transactions">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Filter</Label>
                  <Select value={sellerFilter} onValueChange={setSellerFilter}>
                    <SelectTrigger className="h-9 w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sellers</SelectItem>
                      {summaries.map((s) => (
                        <SelectItem key={s.seller_id} value={s.seller_id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    {filteredTxns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No transactions.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredTxns.map((t) => (
                      <TableRow key={t.id} className={t.refunded ? "bg-destructive/5" : undefined}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(t.at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <TxnBadge kind={t.kind} />
                            {t.refunded && (
                              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                Refunded
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{nameOf(t.seller_id)}</TableCell>
                        <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.reference}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            t.refunded
                              ? "text-muted-foreground line-through"
                              : t.amount >= 0
                              ? "text-foreground"
                              : "text-destructive"
                          }`}
                        >
                          {t.amount >= 0 ? "+" : "-"}
                          {fmt(Math.abs(t.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

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
                    {buyerRefunds.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          No buyer refunds.
                        </TableCell>
                      </TableRow>
                    )}
                    {buyerRefunds.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(r.at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{r.buyer_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{r.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          Order {r.order_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {fmt(r.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
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
                    {payouts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No payouts recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {payouts.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => setDetailPayout(p)}
                      >
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(p.paid_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{nameOf(p.seller_id)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.period_start && p.period_end
                            ? `${p.period_start} → ${p.period_end}`
                            : "—"}
                        </TableCell>
                        <TableCell className="capitalize">{p.method.replace("_", " ")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.reference || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(p.amount))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="period">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rs" className="text-xs text-muted-foreground">From</Label>
                    <Input
                      id="rs"
                      type="date"
                      className="h-9 w-44"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="re" className="text-xs text-muted-foreground">To</Label>
                    <Input
                      id="re"
                      type="date"
                      className="h-9 w-44"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
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
                        size="sm"
                        variant="outline"
                        onClick={exportPeriodCsv}
                        disabled={periodTotals.count === 0}
                      >
                        <Download className="mr-2 h-4 w-4" /> Export selected
                      </Button>
                    </>
                  )}
                </div>

                {!rangeStart || !rangeEnd ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                    <CalendarRange className="h-8 w-8" />
                    <p className="text-sm">Select a date range to view payouts and refunds for that period.</p>
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
                            checked={
                              selectedIds.size === periodItems.length && periodItems.length > 0
                            }
                            onCheckedChange={toggleAllSelected}
                            aria-label="Select all"
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
                      {periodItems.map((i) => {
                        const checked = selectedIds.has(i.id);
                        return (
                          <TableRow
                            key={i.id}
                            data-state={checked ? "selected" : undefined}
                            className={!checked ? "opacity-60" : undefined}
                          >
                            <TableCell>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleSelected(i.id)}
                                aria-label={`Select ${i.description}`}
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(i.at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              {i.kind === "payout" ? (
                                <Badge>Payout</Badge>
                              ) : (
                                <Badge variant="destructive">Refund</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{i.party}</TableCell>
                            <TableCell className="max-w-xs truncate">{i.description}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{i.reference}</TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                i.kind === "refund" ? "text-destructive" : ""
                              }`}
                            >
                              {fmt(i.amount)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payout</DialogTitle>
            <DialogDescription>
              {activeSeller ? `Paying ${activeSeller.name} — balance due ${fmt(activeSeller.balance)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
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
                <Label htmlFor="ps">Period start</Label>
                <Input
                  id="ps"
                  type="date"
                  value={form.period_start}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pe">Period end</Label>
                <Input
                  id="pe"
                  type="date"
                  value={form.period_end}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                placeholder="e.g. TX-2026-05-18-001"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePayout} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayoutDetailDialog
        payout={detailPayout}
        onClose={() => setDetailPayout(null)}
        orders={orders}
        complaints={complaints}
        nameOf={nameOf}
      />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  tone: "positive" | "negative" | "muted" | "accent";
}) => {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 bg-emerald-500/10"
      : tone === "negative"
      ? "text-destructive bg-destructive/10"
      : tone === "accent"
      ? "text-primary bg-primary/10"
      : "text-muted-foreground bg-muted";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-heading text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const TxnBadge = ({ kind }: { kind: TxnKind }) => {
  if (kind === "sale") return <Badge variant="secondary">Sale</Badge>;
  if (kind === "refund") return <Badge variant="destructive">Refund</Badge>;
  return <Badge>Payout</Badge>;
};

const PayoutDetailDialog = ({
  payout,
  onClose,
  orders,
  complaints,
  nameOf,
}: {
  payout: Payout | null;
  onClose: () => void;
  orders: Order[];
  complaints: Complaint[];
  nameOf: (id: string) => string;
}) => {
  const details = useMemo(() => {
    if (!payout) return null;
    const refundedSet = new Set(complaints.map((c) => `${c.order_id}|${c.listing_id}`));
    const start = payout.period_start ? new Date(payout.period_start) : null;
    const end = payout.period_end ? new Date(payout.period_end) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    const inRange = (iso: string) => {
      if (!start || !end) return true;
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };
    const rows: Array<{
      key: string;
      order_id: string;
      listing_id?: string;
      title: string;
      buyer_id: string;
      amount: number;
      at: string;
      refunded: boolean;
    }> = [];
    orders.forEach((o) => {
      if (!inRange(o.created_at)) return;
      (o.items ?? []).forEach((it, idx) => {
        if (it.seller_id !== payout.seller_id) return;
        const refunded = it.listing_id ? refundedSet.has(`${o.id}|${it.listing_id}`) : false;
        // Only confirmed (or refunded) items belong on a payout record.
        if (!refunded && !isItemConfirmed(o, it.listing_id)) return;
        rows.push({
          key: `${o.id}-${idx}`,
          order_id: o.id,
          listing_id: it.listing_id,
          title: it.title || "Item",
          buyer_id: o.buyer_id,
          amount: itemTotal(it),
          at: o.created_at,
          refunded,
        });
      });
    });
    rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const eligible = rows.filter((r) => !r.refunded);
    const eligibleTotal = eligible.reduce((s, r) => s + r.amount, 0);
    const refundedTotal = rows.filter((r) => r.refunded).reduce((s, r) => s + r.amount, 0);
    return { rows, eligibleCount: eligible.length, eligibleTotal, refundedTotal };
  }, [payout, orders, complaints]);

  return (
    <Dialog open={!!payout} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Payout details</DialogTitle>
          <DialogDescription>
            {payout
              ? `${nameOf(payout.seller_id)} · ${fmt(Number(payout.amount))} · ${format(
                  new Date(payout.paid_at),
                  "MMM d, yyyy",
                )}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {payout && details && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Info label="Method" value={payout.method.replace("_", " ")} />
              <Info
                label="Period"
                value={
                  payout.period_start && payout.period_end
                    ? `${payout.period_start} → ${payout.period_end}`
                    : "All time"
                }
              />
              <Info label="Reference" value={payout.reference || "—"} />
              <Info label="Sales included" value={String(details.eligibleCount)} />
            </div>
            {payout.notes && (
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-0.5 whitespace-pre-wrap">{payout.notes}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">Eligible total {fmt(details.eligibleTotal)}</Badge>
              {details.refundedTotal > 0 && (
                <Badge variant="destructive">Refunded {fmt(details.refundedTotal)}</Badge>
              )}
            </div>
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
                  {details.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No sales matched this payout.
                      </TableCell>
                    </TableRow>
                  )}
                  {details.rows.map((r) => (
                    <TableRow key={r.key} className={r.refunded ? "bg-destructive/5" : undefined}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(r.at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span>{r.title}</span>
                          {r.refunded && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                              Refunded
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{nameOf(r.buyer_id)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        Order {r.order_id.slice(0, 8)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          r.refunded ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {fmt(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-medium capitalize">{value}</p>
  </div>
);

export default Payouts;
