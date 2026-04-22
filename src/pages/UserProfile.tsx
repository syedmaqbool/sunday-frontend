import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { Loader2, Star, Package, ShoppingBag, Settings, ChevronDown, MapPin, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { OrderItemReview } from "@/components/OrderItemReview";

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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
      return data ?? [];
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
        .select("id, created_at, items, shipping_first_name, shipping_last_name, shipping_city")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Flatten: one row per item belonging to this seller
      const flat: any[] = [];
      (data ?? []).forEach((order: any) => {
        const items: any[] = Array.isArray(order.items) ? order.items : [];
        items
          .filter((it) => it.seller_id === user!.id)
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
              shipping_city: order.shipping_city,
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
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => navigate("/preferences")}
              >
                <Settings className="h-4 w-4" /> Settings
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="bought" className="mt-6">
              <TabsList>
                <TabsTrigger value="bought">Bought ({orders.length})</TabsTrigger>
                <TabsTrigger value="sold">Sold ({soldItems.length})</TabsTrigger>
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
            </Tabs>
          </>
        )}
      </main>
      <Footer />
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
                {items.map((it, idx) => (
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
                        {it.listing_id && it.seller_id && (
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
                ))}
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

export default UserProfile;
