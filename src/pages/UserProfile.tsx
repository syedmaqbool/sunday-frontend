import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerRating } from "@/hooks/useSellerRating";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Star, Package, ShoppingBag, Settings, ChevronDown, MapPin, Receipt, Truck, CheckCircle2, Phone, Calendar as CalendarIcon, Upload, X, Undo2, AlertTriangle, PackageCheck } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { OrderItemReview } from "@/components/OrderItemReview";
import { ComplaintActions } from "@/components/ComplaintActions";
import { SellerComplaintBadge } from "@/components/SellerComplaintBadge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import BankDetailsModal from "@/components/BankDetailsModal";
import { Landmark } from "lucide-react";

type ItemStatus = {
  status: "confirmed" | "shipped" | "received" | "not_received" | "completed";
  shipped_at?: string;
  shipping_method?: string;
  tracking_number?: string;
  expected_delivery?: string;
  proof_image_url?: string;
  received_at?: string;
  not_received_at?: string;
  not_received_reason?: string;
  completed_at?: string;
  auto_completed?: boolean;
  quality_confirmed?: boolean;
  quality_confirmed_at?: string;
};

// Auto-complete window after shipment if buyer hasn't responded (48h)
const AUTO_COMPLETE_MS = 48 * 60 * 60 * 1000;

const getItemStatus = (itemStatus: any, listingId: string): ItemStatus => {
  const entry = itemStatus && typeof itemStatus === "object" ? itemStatus[listingId] : null;
  if (!entry) return { status: "confirmed" };
  // Final states win
  if (entry.status === "completed" || entry.status === "received" || entry.status === "not_received") {
    // Treat explicit "received" as completed for downstream UI
    if (entry.status === "received") {
      return { ...entry, status: "completed", completed_at: entry.completed_at ?? entry.received_at };
    }
    return { ...entry, status: entry.status };
  }
  if (entry.status === "shipped") {
    // Auto-complete 48h after shipment
    if (entry.shipped_at) {
      const shippedAt = new Date(entry.shipped_at).getTime();
      if (Number.isFinite(shippedAt) && Date.now() - shippedAt >= AUTO_COMPLETE_MS) {
        return {
          ...entry,
          status: "completed",
          completed_at: new Date(shippedAt + AUTO_COMPLETE_MS).toISOString(),
          auto_completed: true,
        };
      }
    }
    return { ...entry, status: "shipped" };
  }
  return { status: "confirmed" };
};

const SHIPPING_METHODS = [
  "PostNet",
  "The Courier Guy",
  "Aramex",
  "PUDO (Pick Up Drop Off)",
  "Pargo",
  "Fastway",
  "DHL",
  "South African Post Office (SAPO)",
  "Hand Delivery",
  "Other",
];

const buildListingSellerMap = async (orders: any[]) => {
  const listingIds = Array.from(
    new Set(
      orders.flatMap((order: any) =>
        (Array.isArray(order.items) ? order.items : [])
          .map((item: any) => item.listing_id)
          .filter(Boolean),
      ),
    ),
  );

  if (listingIds.length === 0) return {} as Record<string, { seller_id: string }>;

  const { data, error } = await supabase
    .from("listings")
    .select("id, seller_id")
    .in("id", listingIds);

  if (error) throw error;

  return Object.fromEntries((data ?? []).map((listing) => [listing.id, { seller_id: listing.seller_id }]));
};

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Orders placed by this user
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ordersData = data ?? [];
      const listingSellerMap = await buildListingSellerMap(ordersData);

      return ordersData.map((order: any) => ({
        ...order,
        items: (Array.isArray(order.items) ? order.items : []).map((item: any) => ({
          ...item,
          seller_id: item.seller_id ?? listingSellerMap[item.listing_id]?.seller_id ?? null,
        })),
      }));
    },
    enabled: !!user,
  });

  // Items sold via accepted offers (negotiations)
  const { data: offerSales = [], isLoading: offerSalesLoading } = useQuery({
    queryKey: ["sold-offers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, amount, status, created_at, updated_at, listing_id, listings(id, title, images, brand, category, condition, size, price)")
        .eq("seller_id", user!.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Items sold via direct checkout (orders containing this seller's items)
  const { data: orderSales = [], isLoading: orderSalesLoading } = useQuery({
    queryKey: ["sold-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, items, item_status, shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal, shipping_phone")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ordersData = data ?? [];
      const listingSellerMap = await buildListingSellerMap(ordersData);
      const flat: any[] = [];

      ordersData.forEach((order: any) => {
        const items: any[] = Array.isArray(order.items) ? order.items : [];
        items
          .filter((it) => (it.seller_id ?? listingSellerMap[it.listing_id]?.seller_id) === user!.id)
          .forEach((it, idx) => {
            flat.push({
              id: `${order.id}-${idx}`,
              order_id: order.id,
              listing_id: it.listing_id,
              title: it.title,
              brand: it.brand,
              image: it.image,
              price: it.price,
              quantity: it.quantity,
              amount: Number(it.price) * Number(it.quantity),
              created_at: order.created_at,
              buyer_name: `${order.shipping_first_name ?? ""} ${order.shipping_last_name ?? ""}`.trim(),
              shipping_address: order.shipping_address,
              shipping_city: order.shipping_city,
              shipping_postal: order.shipping_postal,
              shipping_phone: order.shipping_phone,
              item_status: order.item_status,
            });
          });
      });

      return flat;
    },
    enabled: !!user,
  });

  const soldItems = [...orderSales, ...offerSales];
  const soldLoading = offerSalesLoading || orderSalesLoading;

  const { data: rating } = useSellerRating(user?.id);

  if (authLoading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const isLoading = profileLoading || ordersLoading || soldLoading;
  const boughtCount = orders.reduce(
    (sum: number, o: any) => sum + (Array.isArray(o.items) ? o.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0) : 0),
    0,
  );

  const initials = (profile?.full_name || user.email || "U")
    .split(/[\s@]/)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-heading text-2xl font-bold text-card-foreground">
                  {profile?.full_name || user.email}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Member since {format(new Date(profile?.created_at || user.created_at), "MMMM yyyy")}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  {rating && rating.totalReviews > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= Math.round(rating.avgRating)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-card-foreground">
                        {rating.avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({rating.totalReviews} review{rating.totalReviews !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                    {boughtCount} bought
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    {soldItems.length} sold
                  </div>
                </div>
                {(profile?.bio || profile?.location || profile?.phone) && (
                  <div className="mt-3 space-y-1 text-sm">
                    {profile?.bio && <p className="text-card-foreground">{profile.bio}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                      {profile?.location && (
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>
                      )}
                      {profile?.phone && (
                        <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <EditProfileDialog profile={profile} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => navigate("/preferences")}
                >
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </div>
            </div>

            {/* Payout details */}
            <Card className="mt-6">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Landmark className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading text-base font-semibold text-foreground">Payout details</h2>
                      <p className="text-xs text-muted-foreground">
                        Bank account we use to pay you out when your items sell.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={profile?.bank_iban || profile?.bank_account_number ? "outline" : "default"}
                    size="sm"
                    onClick={() => setBankModalOpen(true)}
                  >
                    {profile?.bank_iban || profile?.bank_account_number ? "Edit" : "Add details"}
                  </Button>
                </div>

                {(profile?.bank_iban || profile?.bank_account_number) ? (
                  <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Account holder</dt>
                      <dd className="text-foreground">{profile?.bank_account_holder || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Bank</dt>
                      <dd className="text-foreground">{profile?.bank_name || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Account number</dt>
                      <dd className="font-mono text-foreground">
                        {profile?.bank_account_number
                          ? `•••• ${profile.bank_account_number.slice(-4)}`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">IBAN</dt>
                      <dd className="font-mono text-foreground">
                        {profile?.bank_iban
                          ? `${profile.bank_iban.slice(0, 4)} •••• •••• ${profile.bank_iban.slice(-4)}`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">SWIFT / BIC</dt>
                      <dd className="font-mono text-foreground">{profile?.bank_swift || "—"}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No payout details on file yet. Add them now or you'll be asked when you create your first listing.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="bought" className="mt-6">
              <TabsList>
                <TabsTrigger value="bought">Bought ({orders.length})</TabsTrigger>
                <TabsTrigger value="sold">Sold ({soldItems.length})</TabsTrigger>
                <TabsTrigger value="returns">Returns</TabsTrigger>
              </TabsList>

              <TabsContent value="bought" className="mt-4">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-heading text-lg font-semibold text-foreground">No purchases yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Items you buy will appear here</p>
                    <Button className="mt-4" onClick={() => navigate("/listings")}>
                      Browse Listings
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                      <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <p>
                        Tap <span className="font-medium">Details</span> on any order to leave a review for each item you bought.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {orders.map((order: any) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="sold" className="mt-4">
                {soldItems.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-heading text-lg font-semibold text-foreground">No sales yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Items you sell will appear here</p>
                    <Button className="mt-4" onClick={() => navigate("/create-listing")}>
                      Create Listing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {soldItems.map((item: any) =>
                      item.order_id ? (
                        <SoldOrderCard key={item.id} item={item} />
                      ) : (
                        <TransactionCard key={item.id} item={item} label="Sold" />
                      ),
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="returns" className="mt-4">
                <ReturnsTab userId={user.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      <Footer />

      <BankDetailsModal
        open={bankModalOpen}
        onCancel={() => setBankModalOpen(false)}
        onSaved={() => {
          setBankModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        }}
        initialValues={{
          bank_account_holder: profile?.bank_account_holder ?? "",
          bank_name: profile?.bank_name ?? "",
          bank_account_number: profile?.bank_account_number ?? "",
          bank_iban: profile?.bank_iban ?? "",
          bank_swift: profile?.bank_swift ?? "",
        }}
      />
    </div>
  );
};

function TransactionCard({ item, label }: { item: any; label: string }) {
  const listing = item.listings;
  if (!listing) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <Link to={`/listing/${listing.id}`}>
          <img
            src={listing.images?.[0] || "/placeholder.svg"}
            alt={listing.title}
            className="h-20 w-20 rounded-md object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/listing/${listing.id}`}
              className="truncate font-semibold text-foreground hover:underline"
            >
              {listing.title}
            </Link>
            <Badge variant="secondary">{label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {listing.brand} · R {Number(item.amount).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.updated_at), "dd MMM yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({ order }: { order: any }) {
  const [open, setOpen] = useState(false);
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const firstImage = items[0]?.image || "/placeholder.svg";
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <img
            src={firstImage}
            alt="Order"
            className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                Order #{String(order.id).slice(0, 8).toUpperCase()}
              </span>
              <Badge variant="secondary">{order.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""} · R {Number(order.total).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} className="gap-1">
            <Receipt className="h-4 w-4" />
            {open ? "Hide" : "Details"}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {open && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            {/* Items */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Items</h4>
              <div className="space-y-2">
                {items.map((it, idx) => {
                  const status = it.listing_id ? getItemStatus(order.item_status, it.listing_id) : { status: "confirmed" as const };
                  return (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.image || "/placeholder.svg"}
                          alt={it.title}
                          className="h-12 w-12 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          {it.listing_id ? (
                            <Link to={`/listing/${it.listing_id}`} className="truncate text-sm font-medium text-foreground hover:underline">
                              {it.title}
                            </Link>
                          ) : (
                            <p className="truncate text-sm font-medium text-foreground">{it.title}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {it.brand ? `${it.brand} · ` : ""}Qty {it.quantity}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {status.status === "completed" ? (
                              <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed{status.completed_at ? ` · ${format(new Date(status.completed_at), "dd MMM")}` : ""}
                                {status.auto_completed ? " (auto)" : ""}
                              </Badge>
                            ) : status.status === "not_received" ? (
                              <Badge variant="destructive" className="gap-1">
                                <X className="h-3 w-3" />
                                Not received{status.not_received_at ? ` · ${format(new Date(status.not_received_at), "dd MMM")}` : ""}
                              </Badge>
                            ) : status.status === "shipped" ? (
                              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/15">
                                <Truck className="h-3 w-3" />
                                Shipped{status.shipped_at ? ` · ${format(new Date(status.shipped_at), "dd MMM")}` : ""}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Confirmed
                              </Badge>
                            )}
                          </div>
                          {status.status === "shipped" && (status.shipping_method || status.tracking_number || status.expected_delivery || status.proof_image_url) && (
                            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                              {status.shipping_method && <p>Via {status.shipping_method}</p>}
                              {status.tracking_number && <p>Tracking: <span className="font-medium text-foreground">{status.tracking_number}</span></p>}
                              {status.expected_delivery && <p>ETA {format(new Date(status.expected_delivery), "dd MMM yyyy")}</p>}
                              {status.proof_image_url && (
                                <a href={status.proof_image_url} target="_blank" rel="noreferrer" className="mt-1 inline-block">
                                  <img src={status.proof_image_url} alt="Shipping proof" className="h-20 w-20 rounded-md border border-border object-cover" />
                                </a>
                              )}
                            </div>
                          )}
                          {status.status === "not_received" && status.not_received_reason && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Reason: <span className="text-foreground">{status.not_received_reason}</span>
                            </p>
                          )}
                          {it.listing_id && status.status === "shipped" && (
                            <BuyerReceiptActions
                              orderId={order.id}
                              listingId={it.listing_id}
                              onChanged={() => queryClient.invalidateQueries({ queryKey: ["my-orders"] })}
                            />
                          )}
                          {it.listing_id && status.status === "completed" && !(status as any).quality_confirmed && (
                            <BuyerQualityConfirm
                              orderId={order.id}
                              listingId={it.listing_id}
                              onChanged={() => queryClient.invalidateQueries({ queryKey: ["my-orders"] })}
                            />
                          )}
                          {it.listing_id && it.seller_id && status.status === "completed" && !(status as any).quality_confirmed && (
                            <ComplaintActions
                              orderId={order.id}
                              listingId={it.listing_id}
                              sellerId={it.seller_id}
                              buyerId={order.buyer_id}
                            />
                          )}
                          {it.listing_id && it.seller_id && status.status === "completed" && (status as any).quality_confirmed && (
                            <OrderItemReview
                              orderId={order.id}
                              listingId={it.listing_id}
                              sellerId={it.seller_id}
                              sellerName={it.seller_name}
                            />
                          )}
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                          R {(Number(it.price) * Number(it.quantity)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Billing summary */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Billing summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">R {Number(order.subtotal).toLocaleString()}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-primary">
                      Discount{order.discount_code ? ` (${order.discount_code})` : ""}
                    </span>
                    <span className="text-primary">−R {Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">R {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping details */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4" /> Shipping address
              </h4>
              <div className="text-sm text-muted-foreground">
                <p className="text-foreground">
                  {order.shipping_first_name} {order.shipping_last_name}
                </p>
                <p>{order.shipping_address}</p>
                <p>
                  {order.shipping_city}
                  {order.shipping_postal ? `, ${order.shipping_postal}` : ""}
                </p>
                <p>{order.shipping_phone}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SoldOrderCard({ item }: { item: any }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [shipping, setShipping] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [method, setMethod] = useState<string>("");
  const [tracking, setTracking] = useState("");
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const status = item.listing_id ? getItemStatus(item.item_status, item.listing_id) : { status: "confirmed" as const };
  const isShipped = status.status === "shipped";

  const resetForm = () => {
    setMethod("");
    setTracking("");
    setExpectedDate(undefined);
    setProofFile(null);
    setProofPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!item.order_id || !item.listing_id) return;
    if (!method) return toast.error("Please select a shipping method");
    if (!expectedDate) return toast.error("Please select an expected delivery date");
    if (!proofFile) return toast.error("Please upload a proof image");

    setShipping(true);
    try {
      // Upload proof image
      const ext = proofFile.name.split(".").pop() || "jpg";
      const path = `${user!.id}/shipments/${item.order_id}-${item.listing_id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("review-media")
        .upload(path, proofFile, { upsert: true, contentType: proofFile.type });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from("review-media").getPublicUrl(path);

      // Merge into item_status
      const { data: current, error: fetchErr } = await supabase
        .from("orders")
        .select("item_status")
        .eq("id", item.order_id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      const merged = {
        ...((current?.item_status as any) ?? {}),
        [item.listing_id]: {
          status: "shipped",
          shipped_at: new Date().toISOString(),
          shipping_method: method,
          tracking_number: tracking.trim() || null,
          expected_delivery: expectedDate.toISOString(),
          proof_image_url: pub.publicUrl,
        },
      };

      const { error } = await supabase
        .from("orders")
        .update({ item_status: merged })
        .eq("id", item.order_id);
      if (error) throw error;

      toast.success("Marked as shipped");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["sold-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    } finally {
      setShipping(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Link to={item.listing_id ? `/listing/${item.listing_id}` : "#"}>
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              className="h-20 w-20 rounded-md object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {item.listing_id ? (
                <Link
                  to={`/listing/${item.listing_id}`}
                  className="truncate font-semibold text-foreground hover:underline"
                >
                  {item.title}
                </Link>
              ) : (
                <span className="truncate font-semibold text-foreground">{item.title}</span>
              )}
              <Badge variant="secondary">Sold</Badge>
              {status.status === "completed" ? (
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed{status.completed_at ? ` · ${format(new Date(status.completed_at), "dd MMM")}` : ""}
                  {status.auto_completed ? " (auto)" : ""}
                </Badge>
              ) : status.status === "not_received" ? (
                <Badge variant="destructive" className="gap-1">
                  <X className="h-3 w-3" />
                  Not received
                </Badge>
              ) : isShipped ? (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/15">
                  <Truck className="h-3 w-3" />
                  Shipped{status.shipped_at ? ` · ${format(new Date(status.shipped_at), "dd MMM")}` : ""}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Confirmed
                </Badge>
              )}
              {item.order_id && item.listing_id && (
                <SellerComplaintBadge orderId={item.order_id} listingId={item.listing_id} />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {item.brand ? `${item.brand} · ` : ""}Qty {item.quantity} · R {Number(item.amount).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.created_at), "dd MMM yyyy")}
            </p>
          </div>
          {item.order_id && status.status === "confirmed" && (
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Truck className="h-4 w-4" />
              Mark as Shipped
            </Button>
          )}
        </div>

        {isShipped && (status.shipping_method || status.tracking_number || status.expected_delivery || status.proof_image_url) && (
          <>
            <Separator />
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Truck className="h-4 w-4" /> Shipment details
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {status.shipping_method && (
                  <p><span className="text-foreground font-medium">Method:</span> {status.shipping_method}</p>
                )}
                {status.tracking_number && (
                  <p><span className="text-foreground font-medium">Tracking:</span> {status.tracking_number}</p>
                )}
                {status.expected_delivery && (
                  <p><span className="text-foreground font-medium">Expected delivery:</span> {format(new Date(status.expected_delivery), "dd MMM yyyy")}</p>
                )}
                {status.proof_image_url && (
                  <a href={status.proof_image_url} target="_blank" rel="noreferrer" className="mt-2 block">
                    <img src={status.proof_image_url} alt="Shipping proof" className="h-24 w-24 rounded-md border border-border object-cover" />
                  </a>
                )}
              </div>
            </div>
          </>
        )}

        {item.order_id && (item.buyer_name || item.shipping_address) && (
          <>
            <Separator />
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4" /> Ship to
              </h4>
              <div className="space-y-0.5 text-sm text-muted-foreground">
                {item.buyer_name && <p className="font-medium text-foreground">{item.buyer_name}</p>}
                {item.shipping_address && <p>{item.shipping_address}</p>}
                {(item.shipping_city || item.shipping_postal) && (
                  <p>
                    {item.shipping_city}
                    {item.shipping_postal ? `, ${item.shipping_postal}` : ""}
                  </p>
                )}
                {item.shipping_phone && (
                  <p className="flex items-center gap-1.5 pt-1">
                    <Phone className="h-3.5 w-3.5" />
                    {item.shipping_phone}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>Provide shipment details so the buyer knows what to expect.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Shipping method *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue placeholder="Select a courier" /></SelectTrigger>
                <SelectContent>
                  {SHIPPING_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tracking">Tracking number (optional)</Label>
              <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. CG1234567890" maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label>Expected delivery date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !expectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedDate ? format(expectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expectedDate}
                    onSelect={setExpectedDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label>Proof of shipment image *</Label>
              {proofPreview ? (
                <div className="relative inline-block">
                  <img src={proofPreview} alt="Proof preview" className="h-32 w-32 rounded-md border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => { setProofFile(null); setProofPreview(null); }}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  Upload receipt or parcel photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
              <p className="text-xs text-muted-foreground">JPEG/PNG/WebP, max 5MB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={shipping}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={shipping} className="gap-1.5">
              {shipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              Confirm Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function BuyerReceiptActions({
  orderId,
  listingId,
  onChanged,
}: {
  orderId: string;
  listingId: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");

  const updateStatus = async (next: "completed" | "not_received", extra: Record<string, any> = {}) => {
    setBusy(true);
    try {
      const { data: current, error: fetchErr } = await supabase
        .from("orders")
        .select("item_status")
        .eq("id", orderId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      const existing = (current?.item_status as any) ?? {};
      const now = new Date().toISOString();
      const merged = {
        ...existing,
        [listingId]: {
          ...(existing[listingId] ?? {}),
          status: next,
          ...(next === "completed"
            ? { received_at: now, completed_at: now }
            : { not_received_at: now, ...extra }),
        },
      };

      const { error } = await supabase
        .from("orders")
        .update({ item_status: merged })
        .eq("id", orderId);
      if (error) throw error;

      toast.success(next === "completed" ? "Order marked as completed" : "Reported as not received");
      setReportOpen(false);
      setReason("");
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          disabled={busy}
          onClick={() => updateStatus("completed")}
        >
          <CheckCircle2 className="h-3 w-3" />
          Mark as received
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={busy}
          onClick={() => setReportOpen(true)}
        >
          <X className="h-3 w-3" />
          Not received
        </Button>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report not received</DialogTitle>
            <DialogDescription>
              Tell us what happened. The seller and admin team will be able to follow up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="not-received-reason">Reason</Label>
            <Textarea
              id="not-received-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Tracking shows delivered but I never got it…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy || reason.trim().length < 3}
              onClick={() => updateStatus("not_received", { not_received_reason: reason.trim() })}
              className="gap-1.5"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BuyerQualityConfirm({
  orderId,
  listingId,
  onChanged,
}: {
  orderId: string;
  listingId: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      const { data: current, error: fetchErr } = await supabase
        .from("orders")
        .select("item_status")
        .eq("id", orderId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      const existing = (current?.item_status as any) ?? {};
      const now = new Date().toISOString();
      const merged = {
        ...existing,
        [listingId]: {
          ...(existing[listingId] ?? {}),
          quality_confirmed: true,
          quality_confirmed_at: now,
        },
      };

      const { error } = await supabase
        .from("orders")
        .update({ item_status: merged })
        .eq("id", orderId);
      if (error) throw error;

      toast.success("Quality confirmed — you can now leave a review");
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to confirm quality");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 text-xs"
        disabled={busy}
        onClick={confirm}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
        Mark as sufficient quality
      </Button>
    </div>
  );
}

const RETURN_STATUS_LABEL: Record<string, string> = {
  raised: "Complaint Raised",
  under_review: "Under Review",
  return_in_transit: "Return In Transit",
  return_received: "Return Received",
  refunded: "Completed · Refunded",
  rejected: "Completed · Rejected",
};

function ReturnStatusBadge({ status }: { status: string }) {
  const isCompleted = status === "refunded" || status === "rejected";
  const isReturn = status === "return_in_transit" || status === "return_received";
  const Icon = isCompleted ? CheckCircle2 : isReturn ? PackageCheck : AlertTriangle;
  return (
    <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
      <Icon className="h-3 w-3" />
      {RETURN_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function ReturnsTab({ userId }: { userId: string }) {
  const fetchComplaintsWithListings = async (column: "buyer_id" | "seller_id") => {
    const { data, error } = await supabase
      .from("complaints")
      .select("id, order_id, listing_id, status, reason, admin_notes, return_carrier, return_tracking, created_at, updated_at")
      .eq(column, userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const listingIds = Array.from(new Set(rows.map((r) => r.listing_id).filter(Boolean)));
    let listingsMap: Record<string, any> = {};
    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, images, brand")
        .in("id", listingIds);
      listingsMap = Object.fromEntries((listings ?? []).map((l: any) => [l.id, l]));
    }
    return rows.map((r) => ({ ...r, listings: listingsMap[r.listing_id] ?? null }));
  };

  const { data: myReturns = [], isLoading: loadingMine } = useQuery({
    queryKey: ["my-returns", userId],
    queryFn: () => fetchComplaintsWithListings("buyer_id"),
  });

  const { data: returnedToMe = [], isLoading: loadingSeller } = useQuery({
    queryKey: ["returns-to-me", userId],
    queryFn: () => fetchComplaintsWithListings("seller_id"),
  });

  const renderList = (items: any[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center py-10 text-center">
          <Undo2 className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {items.map((c: any) => {
          const listing = c.listings;
          const img = Array.isArray(listing?.images) ? listing.images[0] : null;
          return (
            <Card key={c.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
                {img ? (
                  <img src={img} alt={listing?.title ?? "Item"} className="h-20 w-20 flex-shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{listing?.title ?? "Item"}</p>
                      {listing?.brand && (
                        <p className="text-xs text-muted-foreground">{listing.brand}</p>
                      )}
                    </div>
                    <ReturnStatusBadge status={c.status} />
                  </div>
                  {c.reason && (
                    <p className="text-sm text-foreground"><span className="font-medium">Reason:</span> {c.reason}</p>
                  )}
                  {(c.return_carrier || c.return_tracking) && (
                    <p className="text-xs text-muted-foreground">
                      Return: {c.return_carrier ?? "—"}{c.return_tracking ? ` · ${c.return_tracking}` : ""}
                    </p>
                  )}
                  {c.admin_notes && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium">Admin note:</span> {c.admin_notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Opened {format(new Date(c.created_at), "MMM d, yyyy")}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loadingMine || loadingSeller) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="my-returns">
      <TabsList>
        <TabsTrigger value="my-returns">My Returns ({myReturns.length})</TabsTrigger>
        <TabsTrigger value="returned-to-me">Returned to Me ({returnedToMe.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="my-returns" className="mt-4">
        {renderList(myReturns, "You haven't filed any returns yet.")}
      </TabsContent>
      <TabsContent value="returned-to-me" className="mt-4">
        {renderList(returnedToMe, "No returns have been filed against your sales.")}
      </TabsContent>
    </Tabs>
  );
}

export default UserProfile;
