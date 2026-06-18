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
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

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
  shipped_at?: string;
  completed_at?: string;
  received_at?: string;
  reminder_24h_sent_at?: string;
  overdue_at?: string;
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

type StatusFilter = "all" | "sold" | "shipped" | "received" | "completed" | "overdue" | "reserved";
type DateFilter = "all" | "today" | "7d" | "month";

const AUTO_COMPLETE_MS = 48 * 60 * 60 * 1000;
const SHIPPING_SLA_MS = 48 * 60 * 60 * 1000;

const dateFilterStart = (filter: DateFilter) => {
  const now = new Date();
  if (filter === "today") return startOfDay(now);
  if (filter === "7d") return subDays(startOfDay(now), 6);
  if (filter === "month") return startOfMonth(now);
  return null;
};

const isShippedLike = (s?: string) => {
  const v = s?.toLowerCase();
  return v === "shipped" || v === "delivered" || v === "completed" || v === "received";
};

const itemEffectiveStatus = (orderStatus: string, orderCreatedAt: string, entry?: ItemStatusEntry) => {
  const s = entry?.status?.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "received") return "received";
  if (s === "shipped" || s === "delivered") {
    const shipTs = entry?.shipped_at ?? entry?.updated_at;
    if (shipTs) {
      const shippedAt = new Date(shipTs).getTime();
      if (Number.isFinite(shippedAt) && Date.now() - shippedAt >= AUTO_COMPLETE_MS) {
        return "completed";
      }
    }
    return "shipped";
  }
  if (orderStatus === "cancelled") return "cancelled";
  if (entry?.overdue_at) return "overdue";
  const created = new Date(orderCreatedAt).getTime();
  if (Number.isFinite(created) && Date.now() - created >= SHIPPING_SLA_MS) return "overdue";
  return "sold";
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ADMIN_ORDERS: Order[] = [
  {
    id: "ord-8fdf392k",
    buyer_id: "mock-user-id",
    status: "shipped",
    total: 14500,
    items: [
      { listing_id: "mock-listing-1", title: "Vintage Leather Jacket", price: 6500, quantity: 1, seller_id: "mock-seller-id" },
    ],
    item_status: {
      "mock-listing-1": {
        status: "shipped",
        shipping_method: "Aramex",
        tracking_number: "ARX998877",
        shipped_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    },
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    shipping_first_name: "Bilal",
    shipping_last_name: "Shaikh",
    shipping_address: "House 12, Block C, North Nazimabad",
    shipping_city: "Karachi",
    shipping_postal: "74700",
    shipping_phone: "+92 300 1234567",
  },
  {
    id: "ord-1029ab",
    buyer_id: "mock-buyer-2",
    status: "completed",
    total: 3500,
    items: [
      { listing_id: "mock-listing-2", title: "Classic White Sneakers", price: 3500, quantity: 1, seller_id: "mock-seller-id-2" },
    ],
    item_status: {
      "mock-listing-2": {
        status: "completed",
        shipping_method: "The Courier Guy",
        tracking_number: "TCG553211",
        shipped_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    shipping_first_name: "Ayesha",
    shipping_last_name: "Khan",
    shipping_address: "Flat 4B, Clifton Block 5",
    shipping_city: "Karachi",
    shipping_postal: "75600",
    shipping_phone: "+92 321 7654321",
  },
  {
    id: "ord-77baad",
    buyer_id: "mock-buyer-3",
    status: "sold",
    total: 2800,
    items: [
      { listing_id: "mock-listing-3", title: "Bohemian Summer Dress", price: 2800, quantity: 1, seller_id: "mock-user-id" },
    ],
    item_status: {},
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    shipping_first_name: "Sana",
    shipping_last_name: "Malik",
    shipping_address: "Plot 22, DHA Phase 6",
    shipping_city: "Lahore",
    shipping_postal: "54000",
    shipping_phone: "+92 333 1122334",
  },
  {
    id: "ord-44ccde",
    buyer_id: "mock-buyer-4",
    status: "sold",
    total: 8900,
    items: [
      { listing_id: "mock-listing-5", title: "Wool Winter Coat", price: 8900, quantity: 1, seller_id: "mock-user-id" },
    ],
    item_status: {},
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    shipping_first_name: "Hassan",
    shipping_last_name: "Raza",
    shipping_address: "Street 9, F-10",
    shipping_city: "Islamabad",
    shipping_postal: "44000",
    shipping_phone: "+92 345 5566778",
  },
];

const MOCK_RESERVED_LISTINGS = [
  {
    id: "mock-listing-7",
    title: "Designer Silk Scarf",
    price: 1800,
    images: ["https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600"],
    seller_id: "mock-seller-id-2",
    reserved_for: "mock-buyer-2",
    reserved_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    reserved_offer_id: "offer-mock-1",
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_PROFILES_MAP: Record<string, { id: string; full_name: string; avatar_url: string | null; phone: string | null; location: string | null }> = {
  "mock-user-id": { id: "mock-user-id", full_name: "Muhamad Bilal Shaikh", avatar_url: null, phone: "+92 300 1234567", location: "Karachi, Pakistan" },
  "mock-seller-id": { id: "mock-seller-id", full_name: "Premium Thrifter", avatar_url: null, phone: "+92 312 9988776", location: "Karachi, Pakistan" },
  "mock-seller-id-2": { id: "mock-seller-id-2", full_name: "Closet Curator", avatar_url: null, phone: "+92 333 4455667", location: "Lahore, Pakistan" },
  "mock-buyer-2": { id: "mock-buyer-2", full_name: "Ayesha Khan", avatar_url: null, phone: "+92 321 7654321", location: "Karachi, Pakistan" },
  "mock-buyer-3": { id: "mock-buyer-3", full_name: "Sana Malik", avatar_url: null, phone: "+92 333 1122334", location: "Lahore, Pakistan" },
  "mock-buyer-4": { id: "mock-buyer-4", full_name: "Hassan Raza", avatar_url: null, phone: "+92 345 5566778", location: "Islamabad, Pakistan" },
};

const MOCK_LISTING_LOOKUP: Record<string, { id: string; title: string; seller_id: string; images: string[]; price: number; status: string }> = {
  "mock-listing-1": { id: "mock-listing-1", title: "Vintage Leather Jacket", seller_id: "mock-seller-id", images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"], price: 6500, status: "approved" },
  "mock-listing-2": { id: "mock-listing-2", title: "Classic White Sneakers", seller_id: "mock-seller-id-2", images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600"], price: 3500, status: "sold" },
  "mock-listing-3": { id: "mock-listing-3", title: "Bohemian Summer Dress", seller_id: "mock-user-id", images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600"], price: 2800, status: "pending" },
  "mock-listing-5": { id: "mock-listing-5", title: "Wool Winter Coat", seller_id: "mock-user-id", images: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600"], price: 8900, status: "sold" },
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selected, setSelected] = useState<Row | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_ADMIN_ORDERS;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const { data: reservedListings = [], isLoading: reservedLoading } = useQuery({
    queryKey: ["admin-reserved-listings"],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_RESERVED_LISTINGS;
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, images, seller_id, reserved_for, reserved_until, reserved_offer_id, updated_at")
        .eq("status", "reserved")
        .order("reserved_until", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: statusFilter === "reserved",
  });

  const reservedUserIds = useMemo(
    () => Array.from(new Set(reservedListings.flatMap((l: any) => [l.seller_id, l.reserved_for].filter(Boolean)))),
    [reservedListings]
  );

  const { data: reservedProfiles = [] } = useQuery({
    queryKey: ["admin-reserved-profiles", reservedUserIds],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return reservedUserIds.map((id) => MOCK_PROFILES_MAP[id]).filter(Boolean);
      }
      if (reservedUserIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", reservedUserIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: statusFilter === "reserved" && reservedUserIds.length > 0,
  });

  const rows = useMemo<Row[]>(() => {
    const start = dateFilterStart(dateFilter);
    const flat: Row[] = [];

    for (const o of orders) {
      if (start && new Date(o.created_at) < start) continue;
      const buyerName = [o.shipping_first_name, o.shipping_last_name].filter(Boolean).join(" ") || "—";
      for (const item of o.items ?? []) {
        if (!item?.listing_id) continue;
        const entry = o.item_status?.[item.listing_id];
        const effective = itemEffectiveStatus(o.status, o.created_at, entry);
        if (statusFilter !== "all" && effective !== statusFilter) continue;
        flat.push({
          orderId: o.id,
          created_at: o.created_at,
          buyerName,
          city: o.shipping_city,
          item,
          effective,
          entry,
          order: o,
        });
      }
    }
    return flat;
  }, [orders, statusFilter, dateFilter]);

  const counts = useMemo(() => {
    const start = dateFilterStart(dateFilter);
    let sold = 0;
    let shipped = 0;
    let received = 0;
    let completed = 0;
    let overdue = 0;
    for (const o of orders) {
      if (start && new Date(o.created_at) < start) continue;
      for (const item of o.items ?? []) {
        if (!item?.listing_id) continue;
        const eff = itemEffectiveStatus(o.status, o.created_at, o.item_status?.[item.listing_id]);
        if (eff === "sold") sold++;
        else if (eff === "shipped") shipped++;
        else if (eff === "received") received++;
        else if (eff === "completed") completed++;
        else if (eff === "overdue") overdue++;
      }
    }
    return { sold, shipped, received, completed, overdue, total: sold + shipped + received + completed + overdue };
  }, [orders, dateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">Track sold and shipped items across the marketplace.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Received</p>
            <p className="font-heading text-2xl font-semibold">{counts.received}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Completed</p>
            <p className="font-heading text-2xl font-semibold">{counts.completed}</p>
          </CardContent>
        </Card>
        <Card className={counts.overdue > 0 ? "border-destructive/60" : undefined}>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Overdue (48h)</p>
            <p className="font-heading text-2xl font-semibold text-destructive">{counts.overdue}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sold">Sold</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="overdue">Admin Review</TabsTrigger>
            <TabsTrigger value="reserved">Reserved</TabsTrigger>
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

      {statusFilter === "reserved" ? (
        <Card>
          <CardContent className="p-0">
            {reservedLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reservedListings.length === 0 ? (
              <p className="p-12 text-center text-sm text-muted-foreground">No reserved listings right now.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Reserved for</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservedListings.map((l: any) => {
                    const seller = reservedProfiles.find((p: any) => p.id === l.seller_id);
                    const buyer = reservedProfiles.find((p: any) => p.id === l.reserved_for);
                    const expiresAt = l.reserved_until ? new Date(l.reserved_until) : null;
                    const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">
                          <Link to={`/listing/${l.id}`} className="inline-flex items-center gap-1 hover:underline">
                            {l.title ?? "—"} <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{seller?.full_name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{buyer?.full_name ?? "—"}</TableCell>
                        <TableCell>
                          {expiresAt ? (
                            <Badge variant={expired ? "destructive" : "secondary"}>
                              {format(expiresAt, "MMM d, p")}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rs {Number(l.price ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
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
                    <TableRow
                      key={`${r.orderId}-${r.item.listing_id}-${i}`}
                      className="cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell className="font-medium">{r.item.title ?? "—"}</TableCell>
                      <TableCell>
                        <div className="text-sm">{r.buyerName}</div>
                        {r.city && <div className="text-xs text-muted-foreground">{r.city}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.effective === "overdue" ? "destructive" : r.effective === "shipped" ? "default" : "secondary"}>
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
      )}

      <OrderDetailDialog row={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

const OrderDetailDialog = ({ row, onClose }: { row: Row | null; onClose: () => void }) => {
  const listingId = row?.item.listing_id;
  const buyerId = row?.order.buyer_id;

  const { data: listing } = useQuery({
    queryKey: ["admin-order-listing", listingId],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_LISTING_LOOKUP[listingId!] ?? null;
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, seller_id, images, price, status")
        .eq("id", listingId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  const sellerId = listing?.seller_id ?? row?.item.seller_id;

  const { data: profiles } = useQuery({
    queryKey: ["admin-order-profiles", buyerId, sellerId],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        const ids = [buyerId, sellerId].filter(Boolean) as string[];
        return ids.map((id) => MOCK_PROFILES_MAP[id]).filter(Boolean);
      }
      const ids = [buyerId, sellerId].filter(Boolean) as string[];
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, location")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!buyerId && !!sellerId,
  });

  if (!row) return null;

  const buyerProfile = profiles?.find((p) => p.id === buyerId);
  const sellerProfile = profiles?.find((p) => p.id === sellerId);
  const entry = row.entry;
  const order = row.order;
  const shippingAddr = [order.shipping_address, order.shipping_city, order.shipping_postal]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{row.item.title ?? "Order item"}</DialogTitle>
          <DialogDescription>
            Order #{row.orderId.slice(0, 8)} · {format(new Date(row.created_at), "PPp")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            {listing?.images?.[0] && (
              <img src={listing.images[0]} alt="" className="h-24 w-24 rounded-md object-cover" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={row.effective === "shipped" ? "default" : "secondary"}>{row.effective}</Badge>
                {listing && (
                  <Link
                    to={`/listing/${listing.id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View listing <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Price: Rs {Number(row.item.price ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Buyer</p>
                <p className="text-sm font-medium">{buyerProfile?.full_name ?? row.buyerName}</p>
                {buyerProfile?.location && (
                  <p className="text-xs text-muted-foreground">{buyerProfile.location}</p>
                )}
                {order.shipping_phone && (
                  <p className="text-xs text-muted-foreground">{order.shipping_phone}</p>
                )}
                {buyerId && (
                  <Link
                    to={`/seller/${buyerId}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View profile <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Seller</p>
                <p className="text-sm font-medium">{sellerProfile?.full_name ?? "—"}</p>
                {sellerProfile?.location && (
                  <p className="text-xs text-muted-foreground">{sellerProfile.location}</p>
                )}
                {sellerProfile?.phone && (
                  <p className="text-xs text-muted-foreground">{sellerProfile.phone}</p>
                )}
                {sellerId && (
                  <Link
                    to={`/seller/${sellerId}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View profile <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Timeline</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sold (order placed)</span>
                <span>{format(new Date(order.created_at), "PPp")}</span>
              </div>
              {entry?.updated_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {entry.status === "shipped" || entry.status === "delivered" ? "Shipped" : "Status updated"}
                  </span>
                  <span>{format(new Date(entry.updated_at), "PPp")}</span>
                </div>
              )}
              {entry?.eta && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ETA</span>
                  <span>{entry.eta}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(entry?.tracking_number || entry?.shipping_method || entry?.proof_image_url) && (
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Shipping</p>
                {entry.shipping_method && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span>{entry.shipping_method}</span>
                  </div>
                )}
                {entry.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking</span>
                    <span className="font-mono text-xs">{entry.tracking_number}</span>
                  </div>
                )}
                {entry.proof_image_url && (
                  <a href={entry.proof_image_url} target="_blank" rel="noreferrer">
                    <img
                      src={entry.proof_image_url}
                      alt="Shipping proof"
                      className="mt-2 h-24 w-24 rounded-md object-cover"
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {shippingAddr && (
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Shipping address</p>
                <p>{shippingAddr}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrders;