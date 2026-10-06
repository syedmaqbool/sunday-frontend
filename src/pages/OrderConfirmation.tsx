import type { Order } from '@/types/order.type';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Copy, Loader2, MapPin, Package, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import { ManualPaymentDialog } from '@/components/ManualPaymentDialog';
import { getManualVerificationCopy, getManualVerificationState, ManualVerificationStatus } from '@/components/ManualVerificationStatus';
import Navbar from '@/components/Navbar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { formatEnumLabel } from '@/lib/utilities';
import { useCancelOrderMutation, useResubmitManualPaymentMutation } from '@/queries/checkout.query';
import { fetchMarketplaceListing } from '@/queries/marketplace.query';
import { getMyOrderOptions, myOrdersQueryKey } from '@/queries/myOrders.query';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message)
    return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string')
    return error.message;
  return fallback;
}

function hasCorrectionDeadlinePassed(order: Order, currentTime: number) {
  const correctionDeadline = order.manualPaymentSubmission?.status === 'RESUBMISSION_REQUESTED'
    ? order.expiresAt
    : null;

  return correctionDeadline !== null && Date.parse(correctionDeadline) <= currentTime;
}

function getConfirmationCopy(order: Order): { description: string; heading: string } {
  if (order.status === 'CANCELLED' && order.paymentStatus === 'PAID') {
    return {
      description: order.refundStatus === 'REFUNDED'
        ? 'This order was cancelled. Your payment has been refunded.'
        : 'This order was cancelled. Your payment has been received.',
      heading: 'Order cancelled',
    };
  }

  const verificationState = getManualVerificationState(order);
  if (order.manualPaymentSubmission || verificationState === 'EXPIRED') {
    const copy = getManualVerificationCopy(verificationState);
    return { description: copy.description, heading: copy.heading };
  }

  if (order.status === 'CANCELLED') {
    return {
      description: order.cancellationReason ? formatEnumLabel(order.cancellationReason) : 'This order was cancelled.',
      heading: 'Order cancelled',
    };
  }
  if (order.paymentStatus === 'PAID') {
    return {
      description: 'Your payment has been confirmed and your order is being prepared.',
      heading: 'Thank you for your order!',
    };
  }
  if (order.paymentStatus === 'PENDING') {
    return {
      description: 'Your payment is awaiting confirmation.',
      heading: 'Payment is being verified',
    };
  }
  return {
    description: order.paymentStatus === 'FAILED'
      ? 'Your payment could not be confirmed. Please contact the store for help.'
      : 'Your order is awaiting payment.',
    heading: order.paymentStatus === 'FAILED' ? 'Payment failed' : 'Payment is pending',
  };
}

function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { loading: authLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { mutateAsync: cancelOrder } = useCancelOrderMutation();
  const { mutateAsync: resubmitManualPayment } = useResubmitManualPaymentMutation();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const orderQueryEnabled = Boolean(id) && Boolean(user) && !authLoading;

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
    isLoading,
  } = useQuery({
    ...getMyOrderOptions(id ?? ''),
    enabled: orderQueryEnabled,
    retry: false,
  });
  const order = orderResponse?.data;
  const correctionDeadlinePassed = order ? hasCorrectionDeadlinePassed(order, currentTime) : false;

  useEffect(() => {
    if (order?.manualPaymentSubmission?.status !== 'RESUBMISSION_REQUESTED' || !order.expiresAt)
      return;

    const currentTimestamp = Date.now();
    const correctionDeadline = Date.parse(order.expiresAt);
    setCurrentTime(currentTimestamp);
    const remainingTime = correctionDeadline - currentTimestamp;
    if (remainingTime <= 0)
      return;

    let timeoutId: ReturnType<typeof globalThis.setTimeout>;
    const updateTimeAtDeadline = () => {
      const updatedTimestamp = Date.now();
      setCurrentTime(updatedTimestamp);
      const timeUntilDeadline = correctionDeadline - updatedTimestamp;
      if (timeUntilDeadline > 0) {
        timeoutId = setTimeout(
          updateTimeAtDeadline,
          Math.min(timeUntilDeadline, 2_147_483_647),
        );
      }
    };
    timeoutId = setTimeout(
      updateTimeAtDeadline,
      Math.min(remainingTime, 2_147_483_647),
    );
    return () => clearTimeout(timeoutId);
  }, [order]);

  useEffect(() => {
    if (!orderQueryEnabled || isLoading || order)
      return;
    if (!error || (error instanceof HTTPError && error.response.status === 404))
      navigate('/profile', { replace: true });
  }, [error, isLoading, navigate, order, orderQueryEnabled]);

  const handleResubmit = async (values: {
    proofFileId: string;
    senderAccountNumber: string;
    senderAccountTitle: string;
  }) => {
    if (!order || resubmitting)
      return;
    if (hasCorrectionDeadlinePassed(order, Date.now())) {
      setCurrentTime(Date.now());
      setResubmitOpen(false);
      return;
    }
    setResubmitting(true);
    setResubmitError(null);
    try {
      await resubmitManualPayment({ orderId: order.id, payload: values });
      await queryClient.refetchQueries({ queryKey: myOrdersQueryKey.detail(order.id) });
      setResubmitOpen(false);
      toast({ title: 'Payment proof resubmitted' });
    }
    catch (submissionError) {
      if (submissionError instanceof HTTPError && submissionError.response.status === 409) {
        await queryClient.refetchQueries({ queryKey: myOrdersQueryKey.detail(order.id) });
        setResubmitError('This order changed while you were viewing it. We refreshed the latest order state.');
      }
      else {
        setResubmitError(getErrorMessage(submissionError, 'Payment proof could not be resubmitted.'));
      }
      throw submissionError;
    }
    finally {
      setResubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!order || cancelling)
      return;
    if (hasCorrectionDeadlinePassed(order, Date.now())) {
      setCurrentTime(Date.now());
      setCancelOpen(false);
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const response = await cancelOrder(order.id);
      await Promise.all(response.data.restorableListingIds.map(async (listingId) => {
        const listing = await fetchMarketplaceListing(listingId);
        if (listing)
          addItem(listing);
      }));
      await queryClient.refetchQueries({ queryKey: myOrdersQueryKey.detail(order.id) });
      setCancelOpen(false);
      toast({ title: 'Order cancelled' });
    }
    catch (cancellationError) {
      if (cancellationError instanceof HTTPError && cancellationError.response.status === 409) {
        await queryClient.refetchQueries({ queryKey: myOrdersQueryKey.detail(order.id) });
        setCancelError('This order changed while you were viewing it. We refreshed the latest order state.');
      }
      else {
        setCancelError(getErrorMessage(cancellationError, 'Order could not be cancelled. Refresh and try again.'));
      }
    }
    finally {
      setCancelling(false);
    }
  };

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
          <Button onClick={() => navigate('/profile')} className="mt-6">View your orders</Button>
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
  const isCancelled = order.status === 'CANCELLED';
  const isPaid = order.paymentStatus === 'PAID';
  const isPending = order.status === 'AWAITING_PAYMENT' && order.paymentStatus === 'PENDING';
  const verificationState = getManualVerificationState(order);
  const hasManualPayment = Boolean(order.manualPaymentSubmission);
  const visiblePaymentStatus = isCancelled && !isPaid ? null : order.paymentStatus;
  const { description, heading } = getConfirmationCopy(order);

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
              {verificationState === 'APPROVED' || (isPaid && !isCancelled)
                ? <CheckCircle2 className="h-8 w-8 text-primary" />
                : verificationState === 'SUBMITTED'
                  ? <Clock3 aria-label="Payment awaiting admin approval" className="h-8 w-8 animate-spin text-primary" />
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
            {(hasManualPayment || verificationState === 'EXPIRED') && (
              <ManualVerificationStatus order={order} className="mx-auto mt-4 max-w-xl text-left" />
            )}
            {visiblePaymentStatus && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Payment status:</span>
                <span className="text-sm font-semibold text-foreground">{formatEnumLabel(visiblePaymentStatus)}</span>
              </div>
            )}
            {isCancelled && order.cancelledAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Cancelled on
                {' '}
                {new Date(order.cancelledAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
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
            {hasManualPayment && (
              <div className="
                space-y-2 rounded-lg border border-border bg-card p-4
                sm:col-span-5 sm:p-6
                lg:col-span-5
              "
              >
                {order.canResubmit && !correctionDeadlinePassed && (verificationState === 'REJECTED' || verificationState === 'RESUBMISSION_REQUESTED') && (
                  <Button
                    onClick={() => {
                      setResubmitError(null);
                      setResubmitOpen(true);
                    }}
                    type="button"
                    className="w-full"
                  >
                    Resubmit payment proof
                  </Button>
                )}
                {order.canCancel && !correctionDeadlinePassed && !isCancelled && !isPaid && (
                  <AlertDialog onOpenChange={setCancelOpen} open={cancelOpen}>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" className="w-full">Cancel order</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel the order and release any listings the store makes available again. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      {cancelError && (
                        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {cancelError}
                        </p>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>Keep order</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(event) => {
                            event.preventDefault();
                            void handleCancel();
                          }}
                          disabled={cancelling}
                        >
                          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel order'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Status:
                  {' '}
                  {formatEnumLabel(order.status)}
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
      {hasManualPayment && (verificationState === 'REJECTED' || verificationState === 'RESUBMISSION_REQUESTED') && (
        <ManualPaymentDialog
          onOpenChange={setResubmitOpen}
          onSubmit={handleResubmit}
          error={resubmitError}
          mode="resubmit"
          open={resubmitOpen}
          submitting={resubmitting}
        />
      )}
    </div>
  );
}

export default OrderConfirmation;
