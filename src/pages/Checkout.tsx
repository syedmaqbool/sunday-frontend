import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useActiveTax } from '@/hooks/useActiveTax';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { calcCommission } from '@/lib/commission';
// Mock switcher config  import
import { isMockDataEnabled } from '@/lib/mockConfig';

interface AppliedDiscount {
  id: string;
  applicable_listing_ids?: string[]; // undefined = all eligible items in scope
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  seller_id?: string;
  source: 'platform' | 'seller';
}

function Checkout() {
  const { clearCart, items, removeItem, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: activeTax } = useActiveTax();
  const { data: commissionTiers } = useCommissionTiers({ onlyActive: true });
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount]
    = useState<AppliedDiscount | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);
  const [shipping, setShipping] = useState({
    address: '',
    city: '',
    firstName: '',
    lastName: '',
    phone: '',
    postal: '',
  });

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

  // Compute the subtotal eligible for the applied discount.
  const eligibleSubtotalFor = (
    cartItems: typeof items,
    d: AppliedDiscount | null,
  ) => {
    if (!d)
      return 0;
    return cartItems.reduce((sum, { listing, quantity }) => {
      if (d.source === 'seller') {
        if (d.seller_id && listing.seller_id !== d.seller_id)
          return sum;
        if (
          d.applicable_listing_ids
          && !d.applicable_listing_ids.includes(listing.id)
        ) {
          return sum;
        }
      }
      return sum + listing.price * quantity;
    }, 0);
  };

  const eligibleSubtotal = eligibleSubtotalFor(items, appliedDiscount);
  const discountAmount = appliedDiscount
    ? (appliedDiscount.discount_type === 'percentage'
        ? Math.round((eligibleSubtotal * appliedDiscount.discount_value) / 100)
        : Math.min(appliedDiscount.discount_value, eligibleSubtotal))
    : 0;

  const taxableAmount = totalPrice - discountAmount;
  const taxRate = activeTax?.rate ?? 0;
  const taxAmount = Math.round(taxableAmount * taxRate) / 100;
  const finalPrice = taxableAmount + taxAmount + commissionTotal;

  const handleApplyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code)
      return;

    setApplyingCode(true);

    // Mock Code Interception
    if (isMockDataEnabled) {
      setTimeout(() => {
        setAppliedDiscount({
          id: 'mock-coupon-id',
          code,
          discount_type: 'percentage',
          discount_value: 10, // 10% Flat Mock discount
          min_order_amount: 0,
          source: 'platform',
        });
        setDiscountCode('');
        setApplyingCode(false);
        toast({
          description: `Promo code "${code}" (10% off) applied successfully.`,
          title: 'Mock Discount applied!',
        });
      }, 600);
      return;
    }

    try {
      // 1) Try platform-wide discount_codes first
      const { data: platform } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();

      if (platform) {
        if (platform.expires_at && new Date(platform.expires_at) < new Date()) {
          toast({ title: 'Code expired', variant: 'destructive' });
          return;
        }
        if (
          platform.max_uses !== null
          && platform.current_uses >= platform.max_uses
        ) {
          toast({ title: 'Code exhausted', variant: 'destructive' });
          return;
        }
        if (totalPrice < (platform.min_order_amount || 0)) {
          toast({
            description: `Order must be at least Rs ${platform.min_order_amount} to use this code.`,
            title: 'Minimum not met',
            variant: 'destructive',
          });
          return;
        }
        setAppliedDiscount({
          id: platform.id,
          code: platform.code,
          discount_type: platform.discount_type,
          discount_value: Number(platform.discount_value),
          min_order_amount: Number(platform.min_order_amount || 0),
          source: 'platform',
        });
        setDiscountCode('');
        toast({
          description: `Code "${platform.code}" has been applied.`,
          title: 'Discount applied!',
        });
        return;
      }

      // 2) Try seller coupons
      const { data: sc } = await supabase
        .from('seller_coupons' as any)
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();

      if (!sc) {
        toast({
          description: 'This code is not valid.',
          title: 'Invalid code',
          variant: 'destructive',
        });
        return;
      }
      const sCoupon: any = sc;
      const now = new Date();
      if (sCoupon.starts_at && new Date(sCoupon.starts_at) > now) {
        toast({
          description: 'This coupon isn\'t active yet.',
          title: 'Not yet active',
          variant: 'destructive',
        });
        return;
      }
      if (sCoupon.expires_at && new Date(sCoupon.expires_at) < now) {
        toast({ title: 'Code expired', variant: 'destructive' });
        return;
      }
      if (
        sCoupon.max_uses !== null
        && sCoupon.current_uses >= sCoupon.max_uses
      ) {
        toast({ title: 'Code exhausted', variant: 'destructive' });
        return;
      }

      // Per-user limit
      if (sCoupon.per_user_limit && user) {
        const { count } = await supabase
          .from('seller_coupon_redemptions' as any)
          .select('id', { count: 'exact', head: true })
          .eq('coupon_id', sCoupon.id)
          .eq('user_id', user.id);
        if ((count ?? 0) >= sCoupon.per_user_limit) {
          toast({
            description: 'You\'ve already used this coupon.',
            title: 'Limit reached',
            variant: 'destructive',
          });
          return;
        }
      }

      // Load listing ids for item-based
      let applicableIds: string[] | undefined;
      if (sCoupon.scope === 'item_based') {
        const { data: links } = await supabase
          .from('seller_coupon_listings' as any)
          .select('listing_id')
          .eq('coupon_id', sCoupon.id);
        applicableIds = ((links ?? []) as any[]).map(l => l.listing_id);
      }

      // Confirm the cart contains qualifying items
      const cartHasMatch = items.some((index) => {
        if (index.listing.seller_id !== sCoupon.seller_id)
          return false;
        return !(applicableIds && !applicableIds.includes(index.listing.id));
      });
      if (!cartHasMatch) {
        toast({
          description: 'Your cart has no items eligible for this coupon.',
          title: 'Not applicable',
          variant: 'destructive',
        });
        return;
      }

      const candidate: AppliedDiscount = {
        id: sCoupon.id,
        applicable_listing_ids: applicableIds,
        code: sCoupon.code,
        discount_type: sCoupon.discount_type,
        discount_value: Number(sCoupon.discount_value),
        min_order_amount: Number(sCoupon.min_order_amount || 0),
        seller_id: sCoupon.seller_id,
        source: 'seller',
      };

      const eligible = eligibleSubtotalFor(items, candidate);
      if (eligible < (sCoupon.min_order_amount || 0)) {
        toast({
          description: `Eligible items must total at least Rs ${sCoupon.min_order_amount}.`,
          title: 'Minimum not met',
          variant: 'destructive',
        });
        return;
      }

      setAppliedDiscount(candidate);
      setDiscountCode('');
      toast({
        description: `"${sCoupon.code}" applied to eligible items.`,
        title: 'Coupon applied!',
      });
    }
    catch {
      toast({
        description: 'Could not validate code.',
        title: 'Error',
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

  const handlePlaceOrder = async () => {
    // Basic Auth Check Override for testing
    if (!user && !isMockDataEnabled) {
      navigate('/auth');
      return;
    }

    // Basic shipping validation
    const required = [
      'firstName',
      'lastName',
      'address',
      'city',
      'postal',
      'phone',
    ] as const;
    for (const k of required) {
      if (shipping[k].trim()) {
        continue;
      }

      toast({
        description: 'Please fill in all shipping information.',
        title: 'Missing details',
        variant: 'destructive',
      });
      return;
    }

    setPlacing(true);

    // Mock Place Order Flow
    if (isMockDataEnabled) {
      setTimeout(() => {
        setPlaced(true);
        clearCart();
        setPlacing(false);
        toast({
          description: 'Your demo order has been confirmed successfully.',
          title: 'Mock Order placed!',
        });
      }, 1500);
      return;
    }

    try {
      // Re-validate listings server-side: block if any item is reserved for another buyer.
      const listingIds = items.map(index => index.listing.id);
      const { data: freshListings, error: freshError } = await supabase
        .from('listings')
        .select(
          'id, title, status, reserved_for, reserved_until, reserved_offer_id, price',
        )
        .in('id', listingIds);
      if (freshError) {
        toast({
          description: freshError.message,
          title: 'Validation failed',
          variant: 'destructive',
        });
        setPlacing(false);
        return;
      }
      const blocked = (freshListings ?? []).find((l: any) => {
        if (l.status === 'sold')
          return true;
        if (l.status === 'reserved') {
          const stillValid
            = l.reserved_until && new Date(l.reserved_until) > new Date();
          return stillValid && l.reserved_for !== user?.id;
        }
        return false;
      });
      if (blocked) {
        toast({
          description: `"${blocked.title}" is reserved for another buyer or already sold.`,
          title: 'Item unavailable',
          variant: 'destructive',
        });
        setPlacing(false);
        return;
      }

      // Authoritative price: when listing is reserved for this buyer, use the accepted offer amount.
      const reservedOfferIds = (freshListings ?? [])
        .filter(
          (l: any) =>
            l.status === 'reserved'
            && l.reserved_for === user?.id
            && l.reserved_offer_id,
        )
        .map((l: any) => l.reserved_offer_id as string);
      const offerAmountByListing = new Map<string, number>();
      if (reservedOfferIds.length > 0) {
        const { data: acceptedOffers } = await supabase
          .from('offers')
          .select('id, listing_id, amount, status, buyer_id')
          .in('id', reservedOfferIds);
        for (const offer of acceptedOffers) {
          if (offer.status === 'accepted' && offer.buyer_id === user?.id) {
            offerAmountByListing.set(offer.listing_id as string, Number(offer.amount));
          }
        }
      }

      // Snapshot items for the order record (apply authoritative reserved price)
      const itemsSnapshot = items.map(({ listing, quantity }) => {
        const overridePrice = offerAmountByListing.get(listing.id);
        const price
          = typeof overridePrice === 'number' ? overridePrice : listing.price;
        const c = calcCommission(
          commissionTiers,
          (listing as any).category,
          price,
          quantity,
        );
        return {
          brand: listing.brand,
          category: (listing as any).category ?? null,
          commission_amount: c.amount,
          commission_rate: c.rate,
          commission_tier_id: c.tier?.id ?? null,
          commission_tier_name: c.tier?.name ?? null,
          image: listing.images?.[0] ?? null,
          listing_id: listing.id,
          price,
          quantity,
          seller_id: listing.seller_id,
          seller_name: listing.seller_name,
          title: listing.title,
          ...((typeof overridePrice === 'number') && { reserved_offer_price: true }),
        };
      });

      // Recompute monetary totals from the authoritative snapshot
      const authoritativeSubtotal = itemsSnapshot.reduce(
        (s, index) => s + index.price * index.quantity,
        0,
      );
      const authoritativeCommission = itemsSnapshot.reduce(
        (s, index) => s + Number(index.commission_amount || 0),
        0,
      );
      const authoritativeEligible = appliedDiscount
        ? itemsSnapshot.reduce((sum, index) => {
            if (appliedDiscount.source === 'seller') {
              if (
                appliedDiscount.seller_id
                && index.seller_id !== appliedDiscount.seller_id
              ) {
                return sum;
              }
              if (
                appliedDiscount.applicable_listing_ids
                && !appliedDiscount.applicable_listing_ids.includes(index.listing_id)
              ) {
                return sum;
              }
            }
            return sum + index.price * index.quantity;
          }, 0)
        : 0;
      const authoritativeDiscount = appliedDiscount
        ? (appliedDiscount.discount_type === 'percentage'
            ? Math.round(
                (authoritativeEligible * appliedDiscount.discount_value) / 100,
              )
            : Math.min(appliedDiscount.discount_value, authoritativeEligible))
        : 0;
      const authoritativeTaxable
        = authoritativeSubtotal - authoritativeDiscount;
      const authoritativeTax = Math.round(authoritativeTaxable * taxRate) / 100;
      const authoritativeTotal
        = authoritativeTaxable + authoritativeTax + authoritativeCommission;
      const { data: orderRow, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user?.id,
          commission_amount: authoritativeCommission,
          discount_amount: authoritativeDiscount,
          discount_code: appliedDiscount?.code ?? null,
          items: itemsSnapshot,
          shipping_address: shipping.address,
          shipping_city: shipping.city,
          shipping_first_name: shipping.firstName,
          shipping_last_name: shipping.lastName,
          shipping_phone: shipping.phone,
          shipping_postal: shipping.postal,
          status: 'confirmed',
          subtotal: authoritativeSubtotal,
          tax_amount: authoritativeTax,
          tax_rate: taxRate,
          total: authoritativeTotal,
        } as any)
        .select('id')
        .single();

      if (orderError || !orderRow) {
        toast({
          description: orderError?.message ?? 'Unknown error',
          title: 'Order failed',
          variant: 'destructive',
        });
        setPlacing(false);
        return;
      }

      trackEvent('purchase', {
        coupon: appliedDiscount?.code ?? undefined,
        currency: 'PKR',
        items: itemsSnapshot.map(index => ({
          item_brand: index.brand,
          item_id: index.listing_id,
          item_name: index.title,
          price: index.price,
          quantity: index.quantity,
        })),
        tax: authoritativeTax,
        transaction_id: orderRow.id,
        value: authoritativeTotal,
      });

      // Send invoice email (fire-and-forget — don't block the UI)
      if (user?.email) {
        try {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              idempotencyKey: `order-invoice-${orderRow.id}`,
              recipientEmail: user.email,
              templateData: {
                orderId: orderRow.id,
                buyerName: shipping.firstName,
                commissionAmount: authoritativeCommission,
                discountAmount: authoritativeDiscount,
                discountCode: appliedDiscount?.code ?? null,
                items: itemsSnapshot.map(index => ({
                  brand: index.brand,
                  price: index.price,
                  quantity: index.quantity,
                  title: index.title,
                })),
                orderDate: new Date().toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
                shippingAddress: shipping.address,
                shippingCity: shipping.city,
                shippingName: `${shipping.firstName} ${shipping.lastName}`,
                shippingPhone: shipping.phone,
                shippingPostal: shipping.postal,
                subtotal: authoritativeSubtotal,
                taxAmount: authoritativeTax,
                taxName: activeTax?.name,
                taxRate,
                total: authoritativeTotal,
              },
              templateName: 'order-invoice',
            },
          });
        }
        catch (error) {
          console.error('Failed to enqueue invoice email', error);
        }
      }

      // Mark purchased listings as sold so they disappear from browse
      const soldIds = itemsSnapshot.map(index => index.listing_id).filter(Boolean);
      if (soldIds.length > 0) {
        await supabase.rpc('mark_listings_sold', { _listing_ids: soldIds });
      }

      // Increment coupon usage + record redemption
      if (appliedDiscount) {
        if (appliedDiscount.source === 'platform') {
          const { data: codeData } = await supabase
            .from('discount_codes')
            .select('current_uses')
            .eq('id', appliedDiscount.id)
            .single();
          if (codeData) {
            await supabase
              .from('discount_codes')
              .update({ current_uses: codeData.current_uses + 1 })
              .eq('id', appliedDiscount.id);
          }
        }
        else {
          const { data: cd } = await supabase
            .from('seller_coupons' as any)
            .select('current_uses')
            .eq('id', appliedDiscount.id)
            .single();
          if (cd) {
            await supabase
              .from('seller_coupons' as any)
              .update({ current_uses: ((cd as any).current_uses ?? 0) + 1 })
              .eq('id', appliedDiscount.id);
          }
          await supabase.from('seller_coupon_redemptions' as any).insert({
            coupon_id: appliedDiscount.id,
            discount_amount: authoritativeDiscount,
            order_id: orderRow.id,
            seller_id: appliedDiscount.seller_id,
            user_id: user?.id,
          });
        }
      }

      setPlaced(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['featured-listings'] });
      queryClient.invalidateQueries({ queryKey: ['trending-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      toast({
        description: 'Your order has been confirmed.',
        title: 'Order placed!',
      });
    }
    finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-primary" />
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Order Confirmed
          </h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for your purchase. You'll receive a confirmation email
            shortly.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => navigate('/listings')} variant="outline">
              Continue Shopping
            </Button>
            <Button onClick={() => navigate('/profile')}>View My Orders</Button>
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
                  <Input
                    id="firstName"
                    onChange={event =>
                      setShipping({ ...shipping, firstName: event.target.value })}
                    value={shipping.firstName}
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    onChange={event =>
                      setShipping({ ...shipping, lastName: event.target.value })}
                    value={shipping.lastName}
                    placeholder="Doe"
                  />
                </div>
                <div className="
                  space-y-2
                  sm:col-span-2
                "
                >
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    onChange={event =>
                      setShipping({ ...shipping, address: event.target.value })}
                    value={shipping.address}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    onChange={event =>
                      setShipping({ ...shipping, city: event.target.value })}
                    value={shipping.city}
                    placeholder="Cape Town"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal code</Label>
                  <Input
                    id="postal"
                    onChange={event =>
                      setShipping({ ...shipping, postal: event.target.value })}
                    value={shipping.postal}
                    placeholder="8001"
                  />
                </div>
                <div className="
                  space-y-2
                  sm:col-span-2
                "
                >
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    onChange={event =>
                      setShipping({ ...shipping, phone: event.target.value })}
                    value={shipping.phone}
                    placeholder="+27 12 345 6789"
                  />
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
                            {appliedDiscount.discount_type === 'percentage'
                              ? `−${appliedDiscount.discount_value}%`
                              : `−Rs ${appliedDiscount.discount_value.toLocaleString()}`}
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
                      <div className="flex gap-2">
                        <Input
                          onChange={event =>
                            setDiscountCode(event.target.value.toUpperCase())}
                          onKeyDown={event =>
                            event.key === 'Enter' && handleApplyDiscount()}
                          value={discountCode}
                          placeholder="Discount code"
                          className="flex-1 uppercase"
                        />
                        <Button
                          onClick={handleApplyDiscount}
                          disabled={applyingCode || !discountCode.trim()}
                          size="default"
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
                      </div>
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
                onClick={handlePlaceOrder}
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
