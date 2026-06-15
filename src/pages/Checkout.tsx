import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingBag, ArrowLeft, CheckCircle2, Tag, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveTax } from "@/hooks/useActiveTax";
import { useCommissionTiers } from "@/hooks/useCommissionTiers";
import { calcCommission } from "@/lib/commission";
import { trackEvent } from "@/lib/analytics";

interface AppliedDiscount {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  source: "platform" | "seller";
  seller_id?: string;
  applicable_listing_ids?: string[]; // undefined = all eligible items in scope
}

const Checkout = () => {
  const { items, removeItem, totalPrice, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: activeTax } = useActiveTax();
  const { data: commissionTiers } = useCommissionTiers({ onlyActive: true });
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);
  const [shipping, setShipping] = useState({
    firstName: "", lastName: "", address: "", city: "", postal: "", phone: "",
  });

  useEffect(() => {
    if (items.length > 0) {
      trackEvent("begin_checkout", {
        currency: "PKR",
        value: totalPrice,
        items: items.map((i) => ({
          item_id: i.listing.id,
          item_name: i.listing.title,
          price: i.listing.price,
          quantity: i.quantity,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemCommissions = items.map(({ listing, quantity }) => {
    const c = calcCommission(commissionTiers, (listing as any).category, listing.price, quantity);
    return { listingId: listing.id, ...c };
  });
  const commissionTotal = itemCommissions.reduce((s, i) => s + i.amount, 0);

  const discountAmount = appliedDiscount
    ? appliedDiscount.discount_type === "percentage"
      ? Math.round(totalPrice * appliedDiscount.discount_value / 100)
      : Math.min(appliedDiscount.discount_value, totalPrice)
    : 0;

  const taxableAmount = totalPrice - discountAmount;
  const taxRate = activeTax?.rate ?? 0;
  const taxAmount = Math.round(taxableAmount * taxRate) / 100;
  const finalPrice = taxableAmount + taxAmount + commissionTotal;

  const handleApplyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;

    setApplyingCode(true);
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", code)
        .eq("active", true)
        .single();

      if (error || !data) {
        toast({ title: "Invalid code", description: "This discount code is not valid.", variant: "destructive" });
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({ title: "Code expired", description: "This discount code has expired.", variant: "destructive" });
        return;
      }

      if (data.max_uses !== null && data.current_uses >= data.max_uses) {
        toast({ title: "Code exhausted", description: "This discount code has reached its usage limit.", variant: "destructive" });
        return;
      }

      if (totalPrice < (data.min_order_amount || 0)) {
        toast({ title: "Minimum not met", description: `Order must be at least R ${data.min_order_amount} to use this code.`, variant: "destructive" });
        return;
      }

      setAppliedDiscount({
        id: data.id,
        code: data.code,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        min_order_amount: Number(data.min_order_amount || 0),
      });
      setDiscountCode("");
      toast({ title: "Discount applied!", description: `Code "${data.code}" has been applied.` });
    } catch {
      toast({ title: "Error", description: "Could not validate discount code.", variant: "destructive" });
    } finally {
      setApplyingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Basic shipping validation
    const required = ["firstName", "lastName", "address", "city", "postal", "phone"] as const;
    for (const k of required) {
      if (!shipping[k].trim()) {
        toast({ title: "Missing details", description: "Please fill in all shipping information.", variant: "destructive" });
        return;
      }
    }

    setPlacing(true);
    try {
      // Re-validate listings server-side: block if any item is reserved for another buyer.
      const listingIds = items.map((i) => i.listing.id);
      const { data: freshListings, error: freshErr } = await supabase
        .from("listings")
        .select("id, title, status, reserved_for, reserved_until, reserved_offer_id, price")
        .in("id", listingIds);
      if (freshErr) {
        toast({ title: "Validation failed", description: freshErr.message, variant: "destructive" });
        setPlacing(false);
        return;
      }
      const blocked = (freshListings ?? []).find((l: any) => {
        if (l.status === "sold") return true;
        if (l.status === "reserved") {
          const stillValid = l.reserved_until && new Date(l.reserved_until) > new Date();
          return stillValid && l.reserved_for !== user.id;
        }
        return false;
      });
      if (blocked) {
        toast({
          title: "Item unavailable",
          description: `"${blocked.title}" is reserved for another buyer or already sold.`,
          variant: "destructive",
        });
        setPlacing(false);
        return;
      }

      // Authoritative price: when listing is reserved for this buyer, use the accepted offer amount.
      const reservedOfferIds = (freshListings ?? [])
        .filter((l: any) => l.status === "reserved" && l.reserved_for === user.id && l.reserved_offer_id)
        .map((l: any) => l.reserved_offer_id as string);
      const offerAmountByListing = new Map<string, number>();
      if (reservedOfferIds.length) {
        const { data: acceptedOffers } = await supabase
          .from("offers")
          .select("id, listing_id, amount, status, buyer_id")
          .in("id", reservedOfferIds);
        for (const o of acceptedOffers ?? []) {
          if (o.status === "accepted" && o.buyer_id === user.id) {
            offerAmountByListing.set(o.listing_id as string, Number(o.amount));
          }
        }
      }

      // Snapshot items for the order record (apply authoritative reserved price)
      const itemsSnapshot = items.map(({ listing, quantity }) => {
        const overridePrice = offerAmountByListing.get(listing.id);
        const price = typeof overridePrice === "number" ? overridePrice : listing.price;
        const c = calcCommission(commissionTiers, (listing as any).category, price, quantity);
        return {
          listing_id: listing.id,
          seller_id: listing.seller_id,
          seller_name: listing.seller_name,
          title: listing.title,
          brand: listing.brand,
          image: listing.images?.[0] ?? null,
          category: (listing as any).category ?? null,
          price,
          quantity,
          commission_rate: c.rate,
          commission_amount: c.amount,
          commission_tier_id: c.tier?.id ?? null,
          commission_tier_name: c.tier?.name ?? null,
          ...(typeof overridePrice === "number" ? { reserved_offer_price: true } : {}),
        };
      });

      // Recompute monetary totals from the authoritative snapshot
      const authoritativeSubtotal = itemsSnapshot.reduce((s, i) => s + i.price * i.quantity, 0);
      const authoritativeCommission = itemsSnapshot.reduce(
        (s, i) => s + Number(i.commission_amount || 0),
        0,
      );
      const authoritativeDiscount = appliedDiscount
        ? appliedDiscount.discount_type === "percentage"
          ? Math.round(authoritativeSubtotal * appliedDiscount.discount_value / 100)
          : Math.min(appliedDiscount.discount_value, authoritativeSubtotal)
        : 0;
      const authoritativeTaxable = authoritativeSubtotal - authoritativeDiscount;
      const authoritativeTax = Math.round(authoritativeTaxable * taxRate) / 100;
      const authoritativeTotal = authoritativeTaxable + authoritativeTax + authoritativeCommission;
      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          items: itemsSnapshot,
          subtotal: authoritativeSubtotal,
          discount_code: appliedDiscount?.code ?? null,
          discount_amount: authoritativeDiscount,
          tax_rate: taxRate,
          tax_amount: authoritativeTax,
          commission_amount: authoritativeCommission,
          total: authoritativeTotal,
          shipping_first_name: shipping.firstName,
          shipping_last_name: shipping.lastName,
          shipping_address: shipping.address,
          shipping_city: shipping.city,
          shipping_postal: shipping.postal,
          shipping_phone: shipping.phone,
          status: "confirmed",
        } as any)
        .select("id")
        .single();

      if (orderError || !orderRow) {
        toast({ title: "Order failed", description: orderError?.message ?? "Unknown error", variant: "destructive" });
        setPlacing(false);
        return;
      }

      trackEvent("purchase", {
        transaction_id: orderRow.id,
        currency: "PKR",
        value: authoritativeTotal,
        tax: authoritativeTax,
        coupon: appliedDiscount?.code ?? undefined,
        items: itemsSnapshot.map((i) => ({
          item_id: i.listing_id,
          item_name: i.title,
          item_brand: i.brand,
          price: i.price,
          quantity: i.quantity,
        })),
      });

      // Send invoice email (fire-and-forget — don't block the UI)
      if (user.email) {
        supabase.functions
          .invoke("send-transactional-email", {
            body: {
              templateName: "order-invoice",
              recipientEmail: user.email,
              idempotencyKey: `order-invoice-${orderRow.id}`,
              templateData: {
                buyerName: shipping.firstName,
                orderId: orderRow.id,
                orderDate: new Date().toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
                items: itemsSnapshot.map((i) => ({
                  title: i.title,
                  brand: i.brand,
                  quantity: i.quantity,
                  price: i.price,
                })),
                subtotal: authoritativeSubtotal,
                discountCode: appliedDiscount?.code ?? null,
                discountAmount: authoritativeDiscount,
                taxName: activeTax?.name,
                taxRate,
                taxAmount: authoritativeTax,
                commissionAmount: authoritativeCommission,
                total: authoritativeTotal,
                shippingName: `${shipping.firstName} ${shipping.lastName}`,
                shippingAddress: shipping.address,
                shippingCity: shipping.city,
                shippingPostal: shipping.postal,
                shippingPhone: shipping.phone,
              },
            },
          })
          .catch((err) => console.error("Failed to enqueue invoice email", err));
      }

      // Mark purchased listings as sold so they disappear from browse
      const soldIds = itemsSnapshot.map((i) => i.listing_id).filter(Boolean);
      if (soldIds.length) {
        await supabase.rpc("mark_listings_sold", { _listing_ids: soldIds });
      }

      // Increment discount code usage
      if (appliedDiscount) {
        const { data: codeData } = await supabase
          .from("discount_codes")
          .select("current_uses")
          .eq("id", appliedDiscount.id)
          .single();
        if (codeData) {
          await supabase
            .from("discount_codes")
            .update({ current_uses: codeData.current_uses + 1 })
            .eq("id", appliedDiscount.id);
        }
      }

      setPlaced(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["featured-listings"] });
      queryClient.invalidateQueries({ queryKey: ["trending-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing"] });
      toast({ title: "Order placed!", description: "Your order has been confirmed." });
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground">Order Confirmed</h1>
          <p className="mt-2 text-muted-foreground">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => navigate("/listings")}>Continue Shopping</Button>
            <Button onClick={() => navigate("/profile")}>View My Orders</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Your cart is empty</h1>
          <Link to="/listings" className="mt-4 text-primary hover:underline">Browse listings</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 px-4 py-6 sm:py-8">
        <Link to="/listings" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:mb-6">
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-6 sm:text-3xl sm:mb-8">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Shipping info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Shipping Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="Jane" value={shipping.firstName} onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Doe" value={shipping.lastName} onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main St" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Cape Town" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal code</Label>
                  <Input id="postal" placeholder="8001" value={shipping.postal} onChange={(e) => setShipping({ ...shipping, postal: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+27 12 345 6789" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Order Summary ({totalItems})</h2>
              <div className="space-y-3 mb-4">
                {items.map(({ listing, quantity }) => {
                  const c = itemCommissions.find((x) => x.listingId === listing.id);
                  return (
                    <div key={listing.id} className="flex items-start gap-2 sm:gap-3">
                      <div className="h-14 w-11 flex-shrink-0 overflow-hidden rounded bg-muted">
                        <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                        {c && c.amount > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Platform fee ({c.rate}%): Rs {c.amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-foreground whitespace-nowrap">Rs {(listing.price * quantity).toLocaleString()}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(listing.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount code input */}
              <Separator />
              <div className="py-3">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{appliedDiscount.code}</span>
                      <span className="text-xs text-primary">
                        {appliedDiscount.discount_type === "percentage"
                          ? `−${appliedDiscount.discount_value}%`
                          : `−Rs ${appliedDiscount.discount_value.toLocaleString()}`}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleRemoveDiscount}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                      className="flex-1 uppercase"
                    />
                    <Button variant="outline" size="default" onClick={handleApplyDiscount} disabled={applyingCode || !discountCode.trim()}>
                      {applyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">Rs {totalPrice.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-primary">Discount</span>
                  <span className="text-sm font-medium text-primary">−Rs {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <span className="text-sm text-muted-foreground">Free</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-muted-foreground">{activeTax?.name} ({taxRate}%)</span>
                  <span className="text-sm text-foreground">Rs {taxAmount.toLocaleString()}</span>
                </div>
              )}
              {commissionTotal > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-muted-foreground">Platform fee</span>
                  <span className="text-sm text-foreground">Rs {commissionTotal.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between py-4">
                <span className="font-heading text-base font-semibold text-foreground">Total</span>
                <span className="font-heading text-xl font-bold text-foreground">Rs {finalPrice.toLocaleString()}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
