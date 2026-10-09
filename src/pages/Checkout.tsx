import type { SubmitHandler } from 'react-hook-form';
import type { CheckoutQuote, CheckoutQuoteConflictResponse } from '@/types/checkout.type';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Footer from '@/components/Footer';
import { ManualPaymentDialog } from '@/components/ManualPaymentDialog';
import { CheckoutDispatchNotice } from '@/components/MarketplaceNotices';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { getErrorToastOptions } from '@/lib/errorToast';
import {
  useCheckoutQuoteMutation,
  useCreateCheckoutMutation,
} from '@/queries/checkout.query';
import { getListingMediaUrls } from '@/queries/marketplace.query';

const shippingSchema = z.object({
  address: z.string().trim().min(1, 'Address is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  phone: z.string().trim().min(1, 'Phone is required.'),
  postal: z.string().trim().min(1, 'Postal code is required.'),
});

const discountSchema = z.object({
  code: z.string().trim().min(1, 'Discount code is required.'),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;
type DiscountFormValues = z.infer<typeof discountSchema>;

function getUpdatedCheckoutQuote(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error) || !('data' in error))
    return null;

  const response = error.response;
  const body = error.data;
  if (
    typeof response !== 'object'
    || response === null
    || !('status' in response)
    || response.status !== 409
    || typeof body !== 'object'
    || body === null
    || !('code' in body)
    || body.code !== 'APP_CHECKOUT_QUOTE_CHANGED'
    || !('data' in body)
    || typeof body.data !== 'object'
    || body.data === null
    || !('quote' in body.data)
  ) {
    return null;
  }

  return (body as CheckoutQuoteConflictResponse).data.quote;
}

function Checkout() {
  const { clearCart, isHydrated, items, removeItem, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [manualPaymentError, setManualPaymentError] = useState<string | null>(null);
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote | null>(null);
  const [quoteForKey, setQuoteForKey] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [marketplaceDiscountCode, setMarketplaceDiscountCode] = useState<string | null>(null);
  const [quoteReviewStatus, setQuoteReviewStatus] = useState<'none' | 'required' | 'reviewed'>('none');
  const [applyingCode, setApplyingCode] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const lastQuoteRequestKey = useRef<string | null>(null);
  const currentQuoteRequestKey = useRef('');
  const currentListingIdsKey = useRef('');
  const { mutateAsync: requestCheckoutQuote } = useCheckoutQuoteMutation();
  const { mutateAsync: createCheckout } = useCreateCheckoutMutation();
  const shippingForm = useForm<ShippingFormValues>({
    defaultValues: {
      address: '',
      city: '',
      firstName: '',
      lastName: '',
      phone: '',
      postal: '',
    },
    mode: 'all',
    resolver: zodResolver(shippingSchema),
  });
  const discountForm = useForm<DiscountFormValues>({
    defaultValues: { code: '' },
    mode: 'all',
    resolver: zodResolver(discountSchema),
  });
  const discountCode = discountForm.watch('code');
  const listingIds = items.map(index => index.listing.id);
  const acceptedOfferItem = items.find(({ listing }) =>
    listing.status === 'RESERVED' && listing.reservedForCurrentUser === true,
  );
  const hasMixedAcceptedOfferCart = Boolean(acceptedOfferItem) && items.length > 1;
  const listingIdsKey = JSON.stringify(listingIds);
  const quoteRequestKey = JSON.stringify([listingIdsKey, marketplaceDiscountCode]);
  currentQuoteRequestKey.current = quoteRequestKey;
  currentListingIdsKey.current = listingIdsKey;
  const currentQuote = quoteForKey === quoteRequestKey ? checkoutQuote : null;
  const hasAcceptedOfferReservation = items.some(({ listing }) =>
    listing.reservedForCurrentUser && listing.reservedOfferId,
  );
  const acceptedOfferReviewItem = items.find(({ listing }) =>
    listing.reservedForCurrentUser
    && listing.reservedOfferId
    && listing.reservedUntil === null,
  );
  const hasAcceptedOfferAwaitingReview = !!acceptedOfferReviewItem;
  const hasExpiredAcceptedOffer = items.some(({ listing }) => {
    if (!listing.reservedForCurrentUser || !listing.reservedOfferId)
      return false;

    if (listing.reservedUntil === null)
      return false;

    const expiresAt = listing.reservedUntil ? new Date(listing.reservedUntil).getTime() : NaN;
    return !Number.isFinite(expiresAt) || expiresAt <= currentTime;
  });
  useEffect(() => {
    if (!hasAcceptedOfferReservation)
      return;

    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasAcceptedOfferReservation]);

  useEffect(() => {
    if (items.length > 0) {
      trackEvent('begin_checkout', {
        currency: 'PKR',
        items: items.map(index => ({
          item_id: index.listing.id,
          item_name: index.listing.title,
          price: index.listing.price,
          quantity: 1,
        })),
        value: totalPrice,
      });
    }
  }, [items, totalPrice]);

  useEffect(() => {
    if (!isHydrated || items.length === 0) {
      lastQuoteRequestKey.current = null;
      setCheckoutQuote(null);
      setQuoteForKey(null);
      setQuoteLoading(false);
      return;
    }

    if (lastQuoteRequestKey.current === quoteRequestKey)
      return;

    const requestedQuoteKey = quoteRequestKey;
    const requestedListingIds = JSON.parse(listingIdsKey) as string[];
    lastQuoteRequestKey.current = requestedQuoteKey;
    setQuoteLoading(true);
    setQuoteError(null);

    void requestCheckoutQuote({
      listingIds: requestedListingIds,
      ...(marketplaceDiscountCode && { discountCode: marketplaceDiscountCode }),
    })
      .then(({ data }) => {
        if (currentQuoteRequestKey.current !== requestedQuoteKey)
          return;
        setCheckoutQuote(data);
        setQuoteForKey(requestedQuoteKey);
        setQuoteReviewStatus('none');
      })
      .catch((error: unknown) => {
        if (currentQuoteRequestKey.current !== requestedQuoteKey)
          return;
        setCheckoutQuote(null);
        setQuoteForKey(null);
        setQuoteError(error instanceof Error ? error.message : 'Checkout quote could not be loaded.');
      })
      .finally(() => {
        if (currentQuoteRequestKey.current === requestedQuoteKey)
          setQuoteLoading(false);
      });
  }, [isHydrated, items.length, listingIdsKey, marketplaceDiscountCode, quoteRequestKey, requestCheckoutQuote]);

  const handleApplyDiscount: SubmitHandler<DiscountFormValues> = async (values) => {
    const code = values.code.trim().toUpperCase();
    const requestedQuoteKey = JSON.stringify([listingIdsKey, code]);
    setApplyingCode(true);
    setQuoteLoading(true);
    setQuoteError(null);
    lastQuoteRequestKey.current = requestedQuoteKey;

    try {
      const { data } = await requestCheckoutQuote({ discountCode: code, listingIds });
      if (currentListingIdsKey.current !== listingIdsKey)
        return;
      setMarketplaceDiscountCode(code);
      setCheckoutQuote(data);
      setQuoteForKey(requestedQuoteKey);
      setQuoteReviewStatus('none');
      discountForm.reset();
      toast({
        description: `Code "${data.marketplaceDiscountCode ?? code}" has been applied.`,
        title: 'Marketplace discount applied!',
      });
    }
    catch (error: unknown) {
      toast(getErrorToastOptions(error, 'This marketplace discount code is not valid.'));
    }
    finally {
      setApplyingCode(false);
      if (currentListingIdsKey.current === listingIdsKey)
        setQuoteLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setMarketplaceDiscountCode(null);
    setCheckoutQuote(null);
    setQuoteForKey(null);
    setQuoteReviewStatus('none');
    discountForm.reset();
  };

  const handlePlaceOrder: SubmitHandler<ShippingFormValues> = async () => {
    if (
      hasMixedAcceptedOfferCart
      || hasExpiredAcceptedOffer
      || hasAcceptedOfferAwaitingReview
      || !currentQuote
      || quoteLoading
      || quoteReviewStatus === 'required'
    ) {
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    setManualPaymentError(null);
    setManualPaymentOpen(true);
  };

  const handleManualPaymentSubmit = async ({
    proofFileId,
    senderAccountNumber,
    senderAccountTitle,
  }: {
    proofFileId: string;
    senderAccountNumber: string;
    senderAccountTitle: string;
  }) => {
    if (
      hasMixedAcceptedOfferCart
      || hasExpiredAcceptedOffer
      || hasAcceptedOfferAwaitingReview
      || !currentQuote
      || quoteLoading
      || quoteReviewStatus === 'required'
    ) {
      setManualPaymentOpen(false);
      return;
    }

    if (placing)
      return;
    const shipping = shippingSchema.parse(shippingForm.getValues());

    setPlacing(true);
    setManualPaymentError(null);

    try {
      const response = await createCheckout({
        proofFileId,
        listingIds,
        quoteRevision: currentQuote.quoteRevision,
        senderAccountNumber,
        senderAccountTitle,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingFirstName: shipping.firstName,
        shippingLastName: shipping.lastName,
        shippingPhone: shipping.phone,
        shippingPostal: shipping.postal,
        ...(currentQuote.marketplaceDiscountCode && { discountCode: currentQuote.marketplaceDiscountCode }),
      });
      const result = response.data;
      if (!result?.manualPaymentSubmission || !result.order)
        throw new Error('Checkout did not return the manual payment submission.');

      clearCart();
      setManualPaymentOpen(false);
      navigate(`/order-confirmation/${result.order.id}`, { replace: true });
    }
    catch (error: unknown) {
      const updatedQuote = getUpdatedCheckoutQuote(error);
      if (updatedQuote && currentListingIdsKey.current === listingIdsKey) {
        const updatedQuoteRequestKey = JSON.stringify([listingIdsKey, updatedQuote.marketplaceDiscountCode]);
        lastQuoteRequestKey.current = updatedQuoteRequestKey;
        if (marketplaceDiscountCode !== updatedQuote.marketplaceDiscountCode) {
          setMarketplaceDiscountCode(updatedQuote.marketplaceDiscountCode);
          discountForm.reset();
        }
        setCheckoutQuote(updatedQuote);
        setQuoteForKey(updatedQuoteRequestKey);
        setQuoteReviewStatus('required');
        setManualPaymentOpen(false);
        setManualPaymentError(null);
        toast({
          description: 'The order was not created. Review the updated price and coupons before trying again.',
          title: 'Checkout quote changed',
          variant: 'destructive',
        });
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      setManualPaymentError(message);
      toast(getErrorToastOptions(error, 'Order failed'));
      throw error;
    }
    finally {
      setPlacing(false);
    }
  };

  if (!isHydrated) {
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

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Your cart is empty
          </h1>
          <Link
            to="/listings"
            className="
              mt-4 text-primary
              hover:underline
            "
          >
            Browse listings
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="
        container flex-1 px-4 py-6
        sm:py-8
      "
      >
        <Link
          to="/listings"
          className="
            mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground
            hover:text-foreground
            sm:mb-6
          "
        >
          <ArrowLeft className="h-4 w-4" />
          {' '}
          Continue shopping
        </Link>

        <h1 className="
          mb-6 font-heading text-2xl font-bold text-foreground
          sm:mb-8 sm:text-3xl
        "
        >
          Checkout
        </h1>

        <div className="
          grid gap-6
          lg:grid-cols-5 lg:gap-8
        "
        >
          {/* Shipping info */}
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
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
                Shipping Information
              </h2>
              <div className="
                grid gap-4
                sm:grid-cols-2
              "
              >
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Controller
                    name="firstName"
                    control={shippingForm.control}
                    render={({ field }) => (
                      <Input id="firstName" placeholder="Jane" {...field} />
                    )}
                  />
                  {shippingForm.formState.errors.firstName && <p className="text-sm text-destructive">{shippingForm.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Controller
                    name="lastName"
                    control={shippingForm.control}
                    render={({ field }) => (
                      <Input id="lastName" placeholder="Doe" {...field} />
                    )}
                  />
                  {shippingForm.formState.errors.lastName && <p className="text-sm text-destructive">{shippingForm.formState.errors.lastName.message}</p>}
                </div>
                <div className="
                  space-y-2
                  sm:col-span-2
                "
                >
                  <Label htmlFor="address">Address</Label>
                  <Controller
                    name="address"
                    control={shippingForm.control}
                    render={({ field }) => (
                      <Input id="address" placeholder="123 Main St" {...field} />
                    )}
                  />
                  {shippingForm.formState.errors.address && <p className="text-sm text-destructive">{shippingForm.formState.errors.address.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Controller
                    name="city"
                    control={shippingForm.control}
                    render={({ field }) => (
                      <Input id="city" placeholder="Cape Town" {...field} />
                    )}
                  />
                  {shippingForm.formState.errors.city && <p className="text-sm text-destructive">{shippingForm.formState.errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal code</Label>
                  <Controller
                    name="postal"
                    control={shippingForm.control}
                    render={({ field }) => (
                      <Input id="postal" placeholder="8001" {...field} />
                    )}
                  />
                  {shippingForm.formState.errors.postal && <p className="text-sm text-destructive">{shippingForm.formState.errors.postal.message}</p>}
                </div>
                <div className="
                  space-y-2
                  sm:col-span-2
                "
                >
                  <Label htmlFor="phone">Phone</Label>
                  <Controller
                    name="phone"
                    control={shippingForm.control}
                    render={({ field }) => (
                      <Input id="phone" placeholder="+27 12 345 6789" {...field} />
                    )}
                  />
                  {shippingForm.formState.errors.phone && <p className="text-sm text-destructive">{shippingForm.formState.errors.phone.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="
              rounded-lg border border-border bg-card p-4
              sm:p-6
              lg:sticky lg:top-24
            "
            >
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
                Order Summary (
                {totalItems}
                )
              </h2>
              {hasMixedAcceptedOfferCart && acceptedOfferItem && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
                >
                  <strong>{acceptedOfferItem.listing.title}</strong>
                  {' '}
                  is reserved through your accepted offer and must be checked out by itself. Remove the other cart items to continue.
                </div>
              )}
              <div className="mb-4 space-y-3">
                {items.map(({ listing }) => {
                  const quotedItem = currentQuote?.items.find(item => item.listingId === listing.id);
                  return (
                    <div
                      key={listing.id}
                      className="
                        flex items-start gap-2
                        sm:gap-3
                      "
                    >
                      <div className="h-14 w-11 flex-shrink-0 overflow-hidden rounded bg-muted">
                        <img
                          src={getListingMediaUrls(listing)[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {listing.title}
                        </p>
                        {quotedItem && quotedItem.platformFeeAmount > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Platform fee: Rs
                            {' '}
                            {quotedItem.platformFeeAmount.toLocaleString()}
                          </p>
                        )}
                        {quotedItem && quotedItem.marketplaceDiscountAmount > 0 && (
                          <p className="text-[11px] text-primary">
                            Marketplace discount: −Rs
                            {' '}
                            {quotedItem.marketplaceDiscountAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                          Rs
                          {' '}
                          {(quotedItem?.price ?? listing.price).toLocaleString()}
                        </p>
                        <Button
                          onClick={() => removeItem(listing.id)}
                          aria-label={`Remove ${listing.title} from cart`}
                          size="icon"
                          variant="ghost"
                          className="
                            h-6 w-6 text-muted-foreground
                            hover:text-destructive
                          "
                        >
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
                <p className="mb-2 text-xs text-muted-foreground">
                  You can enter an optional marketplace discount code.
                </p>
                {marketplaceDiscountCode
                  ? (
                      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {currentQuote?.marketplaceDiscountCode ?? marketplaceDiscountCode}
                          </span>
                          <span className="text-xs text-primary">
                            −Rs
                            {' '}
                            {(currentQuote?.marketplaceDiscountAmount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          onClick={handleRemoveDiscount}
                          size="icon"
                          variant="ghost"
                          className="
                            h-6 w-6 text-muted-foreground
                            hover:text-destructive
                          "
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  : (
                      <form
                        onSubmit={discountForm.handleSubmit(handleApplyDiscount)}
                        className="flex gap-2"
                      >
                        <Controller
                          name="code"
                          control={discountForm.control}
                          render={({ field }) => (
                            <Input
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={event => field.onChange(event.target.value.toUpperCase())}
                              ref={field.ref}
                              value={field.value}
                              placeholder="Discount code"
                              className="flex-1 uppercase"
                            />
                          )}
                        />
                        <Button
                          disabled={applyingCode || quoteLoading || !discountCode.trim()}
                          size="default"
                          type="submit"
                          variant="outline"
                        >
                          {applyingCode
                            ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )
                            : (
                                'Apply'
                              )}
                        </Button>
                      </form>
                    )}
              </div>

              <Separator />
              {quoteLoading && !currentQuote && (
                <p role="status" className="py-3 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Calculating your checkout quote…
                </p>
              )}
              {quoteError && !currentQuote && (
                <p role="alert" className="py-3 text-sm text-destructive">
                  {quoteError}
                </p>
              )}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  Rs
                  {' '}
                  {(currentQuote?.subtotal ?? totalPrice).toLocaleString()}
                </span>
              </div>
              {(currentQuote?.marketplaceDiscountAmount ?? 0) > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-primary">Marketplace discount</span>
                  <span className="text-sm font-medium text-primary">
                    −Rs
                    {' '}
                    {currentQuote!.marketplaceDiscountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {/* <div className="flex items-center justify-between pb-3">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <span className="text-sm text-muted-foreground">Free</span>
              </div> */}
              {(currentQuote?.taxAmount ?? 0) > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-muted-foreground">
                    Tax (
                    {currentQuote!.taxRate}
                    %)
                  </span>
                  <span className="text-sm text-foreground">
                    Rs
                    {' '}
                    {currentQuote!.taxAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {currentQuote && currentQuote.platformFeeAmount > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-muted-foreground">
                    Platform fee
                  </span>
                  <span className="text-sm text-foreground">
                    Rs
                    {' '}
                    {currentQuote.platformFeeAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between py-4">
                <span className="font-heading text-base font-semibold text-foreground">
                  Total
                </span>
                <span className="font-heading text-xl font-bold text-foreground">
                  Rs
                  {' '}
                  {currentQuote ? currentQuote.total.toLocaleString() : '—'}
                </span>
              </div>
              {quoteReviewStatus === 'required' && currentQuote && (
                <div role="alert" className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground">
                  <p className="mb-2">
                    The price or coupon selection changed. Your order was not created. Review the updated quote before retrying.
                  </p>
                  <Button
                    onClick={() => setQuoteReviewStatus('reviewed')}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    I reviewed the updated quote
                  </Button>
                </div>
              )}
              {quoteReviewStatus === 'reviewed' && (
                <p role="status" className="mb-3 text-sm text-muted-foreground">
                  Updated quote reviewed. You can continue when ready.
                </p>
              )}
              {hasExpiredAcceptedOffer && (
                <p role="alert" className="mb-3 text-sm text-destructive">
                  The payment deadline for this accepted offer has passed. Remove the item from your cart to continue.
                </p>
              )}
              {hasAcceptedOfferAwaitingReview && acceptedOfferReviewItem && (
                <p role="alert" className="mb-3 text-sm text-foreground">
                  Payment proof is awaiting admin review for
                  {' '}
                  <strong>{acceptedOfferReviewItem.listing.title}</strong>
                  . You cannot start another checkout for this item while the review is pending.
                </p>
              )}
              <Button
                onClick={shippingForm.handleSubmit(handlePlaceOrder, () => {
                  toast({
                    description: 'Please fill in all shipping information.',
                    title: 'Missing details',
                    variant: 'destructive',
                  });
                })}
                disabled={
                  placing
                  || quoteLoading
                  || !currentQuote
                  || quoteReviewStatus === 'required'
                  || hasMixedAcceptedOfferCart
                  || hasExpiredAcceptedOffer
                  || hasAcceptedOfferAwaitingReview
                }
                size="lg"
                className="w-full"
              >
                {placing
                  ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )
                  : (
                      'Place Order'
                    )}
              </Button>
              <CheckoutDispatchNotice />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ManualPaymentDialog
        onOpenChange={setManualPaymentOpen}
        onSubmit={handleManualPaymentSubmit}
        error={manualPaymentError}
        open={manualPaymentOpen}
        submitting={placing}
      />
    </div>
  );
}

export default Checkout;
