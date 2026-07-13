import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Copy, Loader2, MapPin, Package, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { PayFastRetryButton } from '@/components/PayFastRetryButton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { getPayFastStatusPollDelay, isPayFastRetryableStatus } from '@/lib/payfast';
import { getMyOrderOptions } from '@/queries/myOrders.query';

function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { loading: authLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (authLoading)
      return;
    if (!user) {
      navigate('/auth', {
        state: { from: location.pathname },
      });
    }
  }, [user, authLoading, location.pathname, navigate]);

  const {
    data: orderResponse,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    ...getMyOrderOptions(id ?? ''),
    enabled: Boolean(id) && Boolean(user) && !authLoading,
    retry: false,
  });
  const order = orderResponse?.data;

  useEffect(() => {
    if (!order)
      return;

    const pollDelay = getPayFastStatusPollDelay(order.paymentStatus, pollAttempt);
    if (pollDelay === null)
      return;

    const timer = setTimeout(() => {
      setPollAttempt(current => current + 1);
      void refetch();
    }, pollDelay);

    return () => clearTimeout(timer);
  }, [order, pollAttempt, refetch]);

  useEffect(() => {
    if (!order || order.paymentStatus !== 'PAID')
      return;

    const storageKey = `purchase-tracked:${order.id}`;
    if (localStorage.getItem(storageKey))
      return;

    trackEvent('purchase', {
      coupon: order.discountCode ?? undefined,
      currency: order.currency,
      items: order.items.map(item => ({
        item_brand: item.brand,
        item_id: item.listingId,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
      tax: order.taxAmount,
      transaction_id: order.id,
      value: order.total,
    });
    localStorage.setItem(storageKey, '1');
  }, [order]);

  const handleCheckPaymentStatus = async () => {
    setPollAttempt(0);
    await refetch();
  };

  const copyOrderId = async () => {
    if (!order)
      return;
    try {
      await navigator.clipboard.writeText(order.id);
      toast({ title: 'Order ID copied' });
    }
    catch {
      /* ignore */
    }
  };

  if (isLoading || authLoading) {
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
          <p className="mt-2 text-muted-foreground">{error instanceof Error ? error.message : 'We couldn\'t find this order.'}</p>
          <Button onClick={() => navigate('/listings')} className="mt-6">Continue shopping</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const isPaid = order.paymentStatus === 'PAID';
  const isPending = order.paymentStatus === 'PENDING';
  const isRetryable = isPayFastRetryableStatus(order.paymentStatus);
  const heading = isPaid
    ? 'Thank you for your order!'
    : isPending
      ? 'Payment is being verified'
      : order.paymentStatus === 'FAILED'
        ? 'Payment failed'
        : 'Payment was not initialized';
  const description = isPaid
    ? 'Your payment has been confirmed and your order is being prepared.'
    : isPending
      ? 'We are waiting for PayFast to confirm your payment. This page will check again automatically.'
      : isRetryable
        ? 'Your order exists, but payment was not completed. You can retry payment below.'
        : 'Your order is awaiting payment initialization.';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="
        container flex-1 px-4 py-8
        sm:py-12
      "
      >
        <Link
          to="/profile"
          className="
            mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          <ArrowLeft className="h-4 w-4" />
          {' '}
          My orders
        </Link>

        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="
            rounded-lg border border-border bg-card p-6 text-center
            sm:p-8
          "
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              {isPaid
                ? <CheckCircle2 className="h-8 w-8 text-primary" />
                : isPending
                  ? <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  : <XCircle className="h-8 w-8 text-destructive" />}
            </div>
            <h1 className="
              font-heading text-2xl font-bold text-foreground
              sm:text-3xl
            "
            >
              {heading}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Payment status:</span>
              <span className="text-sm font-semibold text-foreground">{order.paymentStatus}</span>
            </div>
            {isPending && pollAttempt >= 3 && (
              <div className="mt-5 flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Automatic checks are paused. Check again when you are ready.
                </p>
                <Button onClick={handleCheckPaymentStatus} disabled={isFetching} type="button" variant="outline">
                  {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check payment status
                </Button>
              </div>
            )}
            {isRetryable && (
              <PayFastRetryButton orderId={order.id} className="mt-5" />
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Order</span>
              <button
                onClick={copyOrderId}
                type="button"
                className="
                  inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-medium text-foreground
                  hover:bg-muted/70
                "
              >
                #
                {shortId}
                <Copy className="h-3 w-3" />
              </button>
              <span className="text-muted-foreground">
                ·
                {orderDate}
              </span>
            </div>
          </div>

          <div className="
            mt-6 grid gap-6
            lg:grid-cols-5
          "
          >
            {/* Items */}
            <div className="
              space-y-6
              lg:col-span-3
            "
            >
              <div className="
                rounded-lg border border-border bg-card p-4
                sm:p-6
              "
              >
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Items (
                    {order.items.length}
                    )
                  </h2>
                </div>
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="h-16 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/listing/${item.listingId}`}
                          className="
                            text-sm font-medium text-foreground
                            hover:underline
                          "
                        >
                          {item.title}
                        </Link>
                        {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                        {item.sellerFullName && (
                          <p className="text-xs text-muted-foreground">
                            Sold by
                            {item.sellerFullName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qty:
                          {item.quantity}
                        </p>
                      </div>
                      <p className="flex-shrink-0 whitespace-nowrap text-sm font-semibold text-foreground">
                        Rs
                        {' '}
                        {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div className="
                rounded-lg border border-border bg-card p-4
                sm:p-6
              "
              >
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-semibold text-foreground">Shipping address</h2>
                </div>
                <div className="text-sm text-foreground">
                  <p className="font-medium">
                    {order.shippingFirstName}
                    {' '}
                    {order.shippingLastName}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress}</p>
                  <p className="text-muted-foreground">
                    {order.shippingCity}
                    ,
                    {' '}
                    {order.shippingPostal}
                  </p>
                  <p className="mt-2 text-muted-foreground">{order.shippingPhone}</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="
                rounded-lg border border-border bg-card p-4
                sm:p-6
                lg:sticky lg:top-24
              "
              >
                <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Payment summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">
                      Rs
                      {Number(order.subtotal).toLocaleString()}
                    </span>
                  </div>
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-primary">
                        Discount
                        {order.discountCode ? ` (${order.discountCode})` : ''}
                      </span>
                      <span className="text-primary">
                        -Rs
                        {Number(order.discountAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">Free</span>
                  </div>
                  {Number(order.taxAmount) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Tax (
                        {Number(order.taxRate)}
                        %)
                      </span>
                      <span className="text-foreground">
                        Rs
                        {Number(order.taxAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {Number(order.commissionAmount) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Platform fee</span>
                      <span className="text-foreground">
                        Rs
                        {Number(order.commissionAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <span className="font-heading text-base font-semibold text-foreground">Total</span>
                  <span className="font-heading text-xl font-bold text-foreground">
                    Rs
                    {' '}
                    {Number(order.total).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs capitalize text-muted-foreground">
                  Status:
                  {order.status}
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button onClick={() => navigate('/listings')}>Continue shopping</Button>
                  <Button onClick={() => navigate('/profile')} variant="outline">View my orders</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default OrderConfirmation;
