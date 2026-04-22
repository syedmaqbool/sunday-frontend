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
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppliedDiscount {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
}

const Checkout = () => {
  const { items, removeItem, totalPrice, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);
  const [shipping, setShipping] = useState({
    firstName: "", lastName: "", address: "", city: "", postal: "", phone: "",
  });

  const discountAmount = appliedDiscount
    ? appliedDiscount.discount_type === "percentage"
      ? Math.round(totalPrice * appliedDiscount.discount_value / 100)
      : Math.min(appliedDiscount.discount_value, totalPrice)
    : 0;

  const finalPrice = totalPrice - discountAmount;

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
      // Snapshot items for the order record
      const itemsSnapshot = items.map(({ listing, quantity }) => ({
        listing_id: listing.id,
        seller_id: listing.seller_id,
        seller_name: listing.seller_name,
        title: listing.title,
        brand: listing.brand,
        image: listing.images?.[0] ?? null,
        price: listing.price,
        quantity,
      }));

      const { error: orderError } = await supabase.from("orders").insert({
        buyer_id: user.id,
        items: itemsSnapshot,
        subtotal: totalPrice,
        discount_code: appliedDiscount?.code ?? null,
        discount_amount: discountAmount,
        total: finalPrice,
        shipping_first_name: shipping.firstName,
        shipping_last_name: shipping.lastName,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_postal: shipping.postal,
        shipping_phone: shipping.phone,
        status: "confirmed",
      });

      if (orderError) {
        toast({ title: "Order failed", description: orderError.message, variant: "destructive" });
        setPlacing(false);
        return;
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
      <main className="container flex-1 py-8">
        <Link to="/listings" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Shipping info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
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
            <div className="rounded-lg border border-border bg-card p-6 sticky top-24">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Order Summary ({totalItems})</h2>
              <div className="space-y-3 mb-4">
                {items.map(({ listing, quantity }) => (
                  <div key={listing.id} className="flex items-center gap-3">
                    <div className="h-14 w-11 flex-shrink-0 overflow-hidden rounded bg-muted">
                      <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">R {(listing.price * quantity).toLocaleString()}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(listing.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
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
                          : `−R ${appliedDiscount.discount_value.toLocaleString()}`}
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
                <span className="font-medium text-foreground">R {totalPrice.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-primary">Discount</span>
                  <span className="text-sm font-medium text-primary">−R {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <span className="text-sm text-muted-foreground">Free</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-4">
                <span className="font-heading text-base font-semibold text-foreground">Total</span>
                <span className="font-heading text-xl font-bold text-foreground">R {finalPrice.toLocaleString()}</span>
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
