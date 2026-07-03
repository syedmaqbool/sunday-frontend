import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Package, MapPin, Loader2, ArrowLeft, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  listing_id: string;
  title: string;
  brand?: string | null;
  image?: string | null;
  quantity: number;
  price: number;
  seller_name?: string | null;
}

interface OrderRow {
  id: string;
  buyer_id: string;
  items: OrderItem[];
  subtotal: number;
  discount_code: string | null;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  commission_amount: number;
  total: number;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  shipping_phone: string;
  status: string;
  created_at: string;
}

// ← Mock data — API ready hone tak
const MOCK_ORDER: OrderRow = {
  id: "mock-order-001",
  buyer_id: "mock-user-001",
  items: [
    {
      listing_id: "listing-001",
      title: "Vintage Denim Jacket",
      brand: "Levi's",
      image: null,
      quantity: 1,
      price: 3500,
      seller_name: "Ahmed Store",
    },
    {
      listing_id: "listing-002",
      title: "Floral Summer Dress",
      brand: null,
      image: null,
      quantity: 2,
      price: 1800,
      seller_name: "Sara's Closet",
    },
  ],
  subtotal: 7100,
  discount_code: "SAVE10",
  discount_amount: 710,
  tax_rate: 5,
  tax_amount: 319,
  commission_amount: 200,
  total: 6909,
  shipping_first_name: "Ali",
  shipping_last_name: "Khan",
  shipping_address: "House 12, Street 4, DHA Phase 6",
  shipping_city: "Karachi",
  shipping_postal: "75500",
  shipping_phone: "+92 300 1234567",
  status: "confirmed",
  created_at: new Date().toISOString(),
};

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!id) return;

    // ← Mock fetch — API ready hone tak
    const t = setTimeout(() => {
      setOrder(MOCK_ORDER);
      setLoading(false);
    }, 600);

    return () => clearTimeout(t);
  }, [id, user, authLoading, navigate]);

  const copyOrderId = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.id);
      toast({ title: "Order ID copied" });
    } catch {
      /* ignore */
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Order not found</h1>
          <p className="mt-2 text-muted-foreground">{error || "We couldn't find this order."}</p>
          <Button className="mt-6" onClick={() => navigate("/listings")}>Continue shopping</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 px-4 py-8 sm:py-12">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> My orders
        </Link>

        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Thank you for your order!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your order has been confirmed. A confirmation email is on its way.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Order</span>
              <button
                type="button"
                onClick={copyOrderId}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-medium text-foreground hover:bg-muted/70"
              >
                #{shortId}
                <Copy className="h-3 w-3" />
              </button>
              <span className="text-muted-foreground">· {orderDate}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            {/* Items */}
            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Items ({order.items.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={`${item.listing_id}-${idx}`} className="flex items-start gap-3">
                      <div className="h-16 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/listing/${item.listing_id}`}
                          className="text-sm font-medium text-foreground hover:underline"
                        >
                          {item.title}
                        </Link>
                        {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                        {item.seller_name && (
                          <p className="text-xs text-muted-foreground">Sold by {item.seller_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="flex-shrink-0 whitespace-nowrap text-sm font-semibold text-foreground">
                        Rs {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-semibold text-foreground">Shipping address</h2>
                </div>
                <div className="text-sm text-foreground">
                  <p className="font-medium">{order.shipping_first_name} {order.shipping_last_name}</p>
                  <p className="text-muted-foreground">{order.shipping_address}</p>
                  <p className="text-muted-foreground">{order.shipping_city}, {order.shipping_postal}</p>
                  <p className="mt-2 text-muted-foreground">{order.shipping_phone}</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Payment summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">Rs {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  {Number(order.discount_amount) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-primary">
                        Discount{order.discount_code ? ` (${order.discount_code})` : ""}
                      </span>
                      <span className="text-primary">−Rs {Number(order.discount_amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">Free</span>
                  </div>
                  {Number(order.tax_amount) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax ({Number(order.tax_rate)}%)</span>
                      <span className="text-foreground">Rs {Number(order.tax_amount).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(order.commission_amount) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Platform fee</span>
                      <span className="text-foreground">Rs {Number(order.commission_amount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <span className="font-heading text-base font-semibold text-foreground">Total</span>
                  <span className="font-heading text-xl font-bold text-foreground">
                    Rs {Number(order.total).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground capitalize">Status: {order.status}</p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button onClick={() => navigate("/listings")}>Continue shopping</Button>
                  <Button variant="outline" onClick={() => navigate("/profile")}>View my orders</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;