import { useMemo, useState } from "react";
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
import { Loader2, Wallet, Download, ArrowDownRight, ArrowUpRight, CircleDollarSign } from "lucide-react";
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
};

type SellerSummary = {
  seller_id: string;
  name: string;
  sales: number;
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

const itemTotal = (it: OrderItem) => Number(it.price ?? 0) * Number(it.quantity ?? 1);

const Payouts = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSeller, setActiveSeller] = useState<SellerSummary | null>(null);
  const [form, setForm] = useState({
    amount: "",
    method: "bank_transfer",
    reference: "",
    notes: "",
    period_start: "",
    period_end: "",
  });
  const [saving, setSaving] = useState(false);

  const { data: orders = [], isLoading: lo } = useQuery({
    queryKey: ["admin-payouts-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, buyer_id, status, items, created_at")
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
        s = { seller_id: sid, name: nameOf(sid), sales: 0, paid: 0, balance: 0 };
        map.set(sid, s);
      }
      return s;
    };

    orders.forEach((o) => {
      (o.items ?? []).forEach((it, idx) => {
        if (!it.seller_id) return;
        const amt = itemTotal(it);
        const s = ensure(it.seller_id);
        s.sales += amt;
        txns.push({
          id: `sale-${o.id}-${idx}`,
          kind: "sale",
          at: o.created_at,
          seller_id: it.seller_id,
          amount: amt,
          description: it.title || "Item sold",
          reference: `Order ${o.id.slice(0, 8)}`,
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
            Track sales, refunds and weekly payments to sellers.
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
            <TabsTrigger value="history">Payout history</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Refunds</TableHead>
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
                        <TableCell className="text-right text-destructive">
                          {s.refunds > 0 ? `-${fmt(s.refunds)}` : fmt(0)}
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
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(t.at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <TxnBadge kind={t.kind} />
                        </TableCell>
                        <TableCell>{nameOf(t.seller_id)}</TableCell>
                        <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.reference}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            t.amount >= 0 ? "text-foreground" : "text-destructive"
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
                      <TableRow key={p.id}>
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

export default Payouts;
