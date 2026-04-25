import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Package, ExternalLink } from "lucide-react";
import { format, startOfDay, startOfMonth, subDays } from "date-fns";

type OrderItem = {
  listing_id?: string;
  title?: string;
  price?: number;
  quantity?: number;
  seller_id?: string;
};

type ItemStatusEntry = {
  status?: string;
  shipping_method?: string;
  tracking_number?: string;
  eta?: string;
  proof_image_url?: string;
  updated_at?: string;
};

type Order = {
  id: string;
  buyer_id: string;
  status: string;
  items: OrderItem[];
  item_status: Record<string, ItemStatusEntry>;
  total: number;
  created_at: string;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal: string | null;
  shipping_phone: string | null;
};

type Row = {
  orderId: string;
  created_at: string;
  buyerName: string;
  city: string | null;
  item: OrderItem;
  effective: string;
  entry?: ItemStatusEntry;
  order: Order;
};

type StatusFilter = "all" | "sold" | "shipped";
type DateFilter = "all" | "today" | "7d" | "month";

const dateFilterStart = (filter: DateFilter) => {
  const now = new Date();
  if (filter === "today") return startOfDay(now);
  if (filter === "7d") return subDays(startOfDay(now), 6);
  if (filter === "month") return startOfMonth(now);
  return null;
};

const itemEffectiveStatus = (orderStatus: string, entry?: ItemStatusEntry) => {
  const s = entry?.status?.toLowerCase();
  if (s === "shipped" || s === "delivered") return "shipped";
  // Anything in a confirmed order that isn't shipped yet counts as "sold"
  if (orderStatus !== "cancelled") return "sold";
  return "cancelled";
};

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const rows = useMemo(() => {
    const start = dateFilterStart(dateFilter);
    const flat: Array<{
      orderId: string;
      created_at: string;
      buyerName: string;
      city: string | null;
      item: OrderItem;
      effective: string;
      entry?: ItemStatusEntry;
    }> = [];

    for (const o of orders) {
      if (start && new Date(o.created_at) < start) continue;
      const buyerName = [o.shipping_first_name, o.shipping_last_name].filter(Boolean).join(" ") || "—";
      for (const item of o.items ?? []) {
        if (!item?.listing_id) continue;
        const entry = o.item_status?.[item.listing_id];
        const effective = itemEffectiveStatus(o.status, entry);
        if (statusFilter !== "all" && effective !== statusFilter) continue;
        flat.push({
          orderId: o.id,
          created_at: o.created_at,
          buyerName,
          city: o.shipping_city,
          item,
          effective,
          entry,
        });
      }
    }
    return flat;
  }, [orders, statusFilter, dateFilter]);

  const counts = useMemo(() => {
    const start = dateFilterStart(dateFilter);
    let sold = 0;
    let shipped = 0;
    for (const o of orders) {
      if (start && new Date(o.created_at) < start) continue;
      for (const item of o.items ?? []) {
        if (!item?.listing_id) continue;
        const eff = itemEffectiveStatus(o.status, o.item_status?.[item.listing_id]);
        if (eff === "sold") sold++;
        else if (eff === "shipped") shipped++;
      }
    }
    return { sold, shipped, total: sold + shipped };
  }, [orders, dateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">Track sold and shipped items across the marketplace.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total items</p>
              <p className="font-heading text-2xl font-semibold">{counts.total}</p>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Sold</p>
            <p className="font-heading text-2xl font-semibold">{counts.sold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Shipped</p>
            <p className="font-heading text-2xl font-semibold">{counts.shipped}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sold">Sold</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <TabsList>
            <TabsTrigger value="all">All time</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7d">Last 7 days</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted-foreground">No orders match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.orderId}-${r.item.listing_id}-${i}`}>
                    <TableCell className="font-medium">{r.item.title ?? "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{r.buyerName}</div>
                      {r.city && <div className="text-xs text-muted-foreground">{r.city}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.effective === "shipped" ? "default" : "secondary"}>
                        {r.effective}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.entry?.tracking_number ? (
                        <div>
                          <div>{r.entry.shipping_method ?? "—"}</div>
                          <div className="font-mono text-xs">{r.entry.tracking_number}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rs {Number(r.item.price ?? 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
