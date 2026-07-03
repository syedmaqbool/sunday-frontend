import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { getActiveTaxOptions } from '@/hooks/useActiveTax';
import { getCommissionTiersOptions } from '@/hooks/useCommissionTiers';
import { trackEvent } from '@/lib/analytics';
import { calcCommission } from '@/lib/commission';
import {
  createOrder,
  validateDiscount,
  validateSellerCoupon,
} from '@/services/checkout.service';

interface AppliedDiscount {
  code: string;
  discountAmount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  source: 'platform' | 'seller';
}

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

function Checkout() {
  const { clearCart, items, removeItem, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: activeTax } = useQuery(getActiveTaxOptions());
  const { data: commissionTiers } = useQuery(getCommissionTiersOptions({ onlyActive: true }));
  const [placing, setPlacing] = useState(false);
  const [appliedDiscount, setAppliedDiscount]
    = useState<AppliedDiscount | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);
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

  useEffect(() => {
    if (items.length > 0) {
      trackEvent('begin_checkout', {
        currency: 'PKR',
        items: items.map(index => ({
          item_id: index.listing.id,
          item_name: index.listing.title,
          price: index.listing.price,
          quantity: index.quantity,
        })),
        value: totalPrice,
      });
    }
  }, [items, totalPrice]);

  const itemCommissions = items.map(({ listing, quantity }) => {
    const c = calcCommission(
      commissionTiers,
      (listing as any).category,
      listing.price,
      quantity,
    );
    return { listingId: listing.id, ...c };
  });
  const commissionTotal = itemCommissions.reduce((s, index) => s + index.amount, 0);

  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const taxableAmount = totalPrice - discountAmount;
  const taxRate = activeTax?.rate ?? 0;
  const taxAmount = Math.round(taxableAmount * taxRate) / 100;
  const finalPrice = taxableAmount + taxAmount + commissionTotal;

  const handleApplyDiscount: SubmitHandler<DiscountFormValues> = async (values) => {
    const code = values.code.trim().toUpperCase();
    setApplyingCode(true);

    const listingIds = items.map(index => index.listing.id);

    try {
      // 1) Try platform-wide discount first
      try {
        const { data } = await validateDiscount({ code, listingIds });
        setAppliedDiscount({
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          source: 'platform',
        });
        discountForm.reset();
        toast({
          description: `Code "${data.code}" has been applied.`,
          title: 'Discount applied!',
        });
        return;
      }
      catch {
        // not a platform code — try seller coupon
      }

      // 2) Try seller coupon
      const { data } = await validateSellerCoupon({ code, listingIds });
      setAppliedDiscount({
        code: data.code,
        discountAmount: data.discountAmount,
        discountType: data.discountType,
        discountValue: data.discountValue,
        source: 'seller',
      });
      discountForm.reset();
      toast({
        description: `"${data.code}" applied to eligible items.`,
        title: 'Coupon applied!',
      });
    }
    catch (error: any) {
      toast({
        description: error?.message ?? 'This code is not valid.',
        title: 'Invalid code',
        variant: 'destructive',
      });
    }
    finally {
      setApplyingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
  };

  const handlePlaceOrder: SubmitHandler<ShippingFormValues> = async (shipping) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setPlacing(true);

    try {
      const { data: order } = await createOrder({
        listingIds: items.map(index => index.listing.id),
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingFirstName: shipping.firstName,
        shippingLastName: shipping.lastName,
        shippingPhone: shipping.phone,
        shippingPostal: shipping.postal,
        ...(appliedDiscount?.source === 'platform' && { discountCode: appliedDiscount.code }),
        ...(appliedDiscount?.source === 'seller' && { sellerCouponCode: appliedDiscount.code }),
      });

      trackEvent('purchase', {
        coupon: appliedDiscount?.code ?? undefined,
        currency: 'PKR',
        items: items.map(({ listing, quantity }) => ({
          item_brand: (listing as any).brand,
          item_id: listing.id,
          item_name: listing.title,
          price: listing.price,
          quantity,
        })),
        tax: order.taxAmount,
        transaction_id: order.id,
        value: order.total,
      });

      clearCart();
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['featured-listings'] });
      queryClient.invalidateQueries({ queryKey: ['trending-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      toast({
        description: 'Your order has been confirmed.',
        title: 'Order placed!',
      });
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    }
    catch (error: any) {
      toast({
        description: error?.message ?? 'Unknown error',
        title: 'Order failed',
        variant: 'destructive',
      });
    }
    finally {
      setPlacing(false);
    }
  };

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
              <div className="mb-4 space-y-3">
                {items.map(({ listing, quantity }) => {
                  const c = itemCommissions.find(
                    x => x.listingId === listing.id,
                  );
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
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {listing.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty:
                          {' '}
                          {quantity}
                        </p>
                        {c && c.amount > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Platform fee (
                            {c.rate}
                            %): Rs
                            {' '}
                            {c.amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                          Rs
                          {' '}
                          {(listing.price * quantity).toLocaleString()}
                        </p>
                        <Button
                          onClick={() => removeItem(listing.id)}
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
                {appliedDiscount
                  ? (
                      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {appliedDiscount.code}
                          </span>
                          <span className="text-xs text-primary">
                            {appliedDiscount.discountType === 'PERCENTAGE'
                              ? `−${appliedDiscount.discountValue}%`
                              : `−Rs ${appliedDiscount.discountValue.toLocaleString()}`}
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
                          disabled={applyingCode || !discountCode.trim()}
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
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  Rs
                  {' '}
                  {totalPrice.toLocaleString()}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-primary">Discount</span>
                  <span className="text-sm font-medium text-primary">
                    −Rs
                    {' '}
                    {discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <span className="text-sm text-muted-foreground">Free</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-muted-foreground">
                    {activeTax?.name}
                    {' '}
                    (
                    {taxRate}
                    %)
                  </span>
                  <span className="text-sm text-foreground">
                    Rs
                    {' '}
                    {taxAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {commissionTotal > 0 && (
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm text-muted-foreground">
                    Platform fee
                  </span>
                  <span className="text-sm text-foreground">
                    Rs
                    {' '}
                    {commissionTotal.toLocaleString()}
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
                  {finalPrice.toLocaleString()}
                </span>
              </div>
              <Button
                onClick={shippingForm.handleSubmit(handlePlaceOrder, () => {
                  toast({
                    description: 'Please fill in all shipping information.',
                    title: 'Missing details',
                    variant: 'destructive',
                  });
                })}
                disabled={placing}
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Checkout;
