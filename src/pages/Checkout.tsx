import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingBag, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const Checkout = () => {
  const { items, removeItem, totalPrice, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);

  const handlePlaceOrder = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setPlaced(true);
    clearCart();
    toast({ title: "Order placed!", description: "Your order has been confirmed." });
  };

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground">Order Confirmed</h1>
          <p className="mt-2 text-muted-foreground">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
          <Button className="mt-6" onClick={() => navigate("/listings")}>Continue Shopping</Button>
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
                  <Input id="firstName" placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main St" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Cape Town" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal code</Label>
                  <Input id="postal" placeholder="8001" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+27 12 345 6789" />
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
              <Separator />
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">R {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <span className="text-sm text-muted-foreground">Free</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-4">
                <span className="font-heading text-base font-semibold text-foreground">Total</span>
                <span className="font-heading text-xl font-bold text-foreground">R {totalPrice.toLocaleString()}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
                Place Order
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
