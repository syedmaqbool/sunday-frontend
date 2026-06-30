import type { Complaint, ComplaintStatus } from '@/types/complaint.type';
import type { Order, OrderItem } from '@/types/order.type';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Landmark,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Receipt,
  Settings,
  ShoppingBag,
  Star,
  Truck,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BankDetailsModal from '@/components/BankDetailsModal';
import { ComplaintActions } from '@/components/ComplaintActions';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { OrderItemReview } from '@/components/OrderItemReview';
import { SellerComplaintBadge } from '@/components/SellerComplaintBadge';
import { ShareProfileDialog } from '@/components/ShareProfileDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerRatingOptions } from '@/hooks/useSellerRating';
import { uploadFile } from '@/lib/uploadFile';
import { cn } from '@/lib/utilities';
import {
  getComplaintsAgainstMeOptions,
  getMyRefundComplaintsOptions,
} from '@/queries/complaint.query';
import {
  getMyOrdersOptions,
  getMySalesOptions,
  useUpdateOrderItemStatusMutation,
} from '@/queries/myOrders.query';
import { getMyProfileQueryOptions } from '@/queries/myProfile.query';
import {
  updateItemStatus,
  uploadShippingProof,
} from '@/services/myOrders.service';

const SHIPPING_METHODS = [
  'PostNet',
  'The Courier Guy',
  'Aramex',
  'PUDO (Pick Up Drop Off)',
  'Pargo',
  'Fastway',
  'DHL',
  'South African Post Office (SAPO)',
  'Hand Delivery',
  'Other',
];

// ── Status helpers ────────────────────────────────────────────────────────────
function statusBadge(status: OrderItem['status'], shippedAt?: string | null) {
  if (status === 'DELIVERED') {
    return (
      <Badge className="
        gap-1 bg-emerald-500/15 text-emerald-700
        hover:bg-emerald-500/20
      "
      >
        <CheckCircle2 className="h-3 w-3" />
        {' '}
        Completed
      </Badge>
    );
  }
  if (status === 'SHIPPED') {
    return (
      <Badge
        variant="secondary"
        className="
          gap-1 bg-primary/10 text-primary
          hover:bg-primary/15
        "
      >
        <Truck className="h-3 w-3" />
        Shipped
        {shippedAt ? ` · ${format(new Date(shippedAt), 'dd MMM')}` : ''}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      {' '}
      Confirmed
    </Badge>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function UserProfile() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery(getMyProfileQueryOptions());
  const { data: orders = [], isLoading: ordersLoading }
    = useQuery(getMyOrdersOptions());
  const { data: sales = [], isLoading: salesLoading }
    = useQuery(getMySalesOptions());
  const { data: rating } = useQuery(getSellerRatingOptions(user?.id));

  useEffect(() => {
    if (!authLoading && !user)
      navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading || !user)
    return null;

  const isLoading = profileLoading || ordersLoading || salesLoading;

  const boughtCount = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + (it.quantity || 0), 0),
    0,
  );

  const initials = (profile?.fullName || user.email || 'U')
    .split(/[\s@]/)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-8">
        {isLoading
          ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )
          : (
              <>
                {/* Profile header */}
                <div className="
                  flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6
                  sm:flex-row sm:items-start
                "
                >
                  <Avatar className="h-20 w-20 border-2 border-primary">
                    <AvatarImage src={profile?.image?.url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="
                    flex-1 text-center
                    sm:text-left
                  "
                  >
                    <h1 className="font-heading text-2xl font-bold text-card-foreground">
                      {profile?.fullName || user.email}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Member since
                      {' '}
                      {format(
                        profile?.createdAt || Date.now(),
                        'MMMM yyyy',
                      )}
                    </p>
                    <div className="
                      mt-2 flex flex-wrap items-center justify-center gap-3
                      sm:justify-start
                    "
                    >
                      {rating && rating.totalReviews > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                className={`
                                  h-4 w-4
                                  ${s <= Math.round(rating.avgRating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}
                                `}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {rating.avgRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            (
                            {rating.totalReviews}
                            {' '}
                            review
                            {rating.totalReviews === 1 ? '' : 's'}
                            )
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" />
                        {' '}
                        {boughtCount}
                        {' '}
                        bought
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        {' '}
                        {sales.length}
                        {' '}
                        sold
                      </div>
                    </div>
                    {(profile?.bio || profile?.location || profile?.phone) && (
                      <div className="mt-3 space-y-1 text-sm">
                        {profile.bio && (
                          <p className="text-card-foreground">{profile.bio}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                          {profile.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {' '}
                              {profile.location}
                            </span>
                          )}
                          {profile.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {' '}
                              {profile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="
                    flex flex-col gap-2
                    sm:items-end
                  "
                  >
                    <EditProfileDialog profile={profile} />
                    <ShareProfileDialog
                      userId={user.id}
                      userName={profile?.fullName}
                    />
                    <Button
                      onClick={() => navigate('/preferences')}
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                    >
                      <Settings className="h-4 w-4" />
                      {' '}
                      Settings
                    </Button>
                  </div>
                </div>

                {/* Payout details */}
                <Card className="mt-6">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Landmark className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-heading text-base font-semibold text-foreground">
                            Payout details
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Bank account we use to pay you out when your items sell.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setBankModalOpen(true)}
                        size="sm"
                        variant={
                          profile?.bankIban || profile?.bankAccountNumber
                            ? 'outline'
                            : 'default'
                        }
                      >
                        {profile?.bankIban || profile?.bankAccountNumber
                          ? 'Edit'
                          : 'Add details'}
                      </Button>
                    </div>

                    {profile?.bankIban || profile?.bankAccountNumber
                      ? (
                          <dl className="
                            mt-4 grid gap-x-6 gap-y-3 text-sm
                            sm:grid-cols-2
                          "
                          >
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                Account holder
                              </dt>
                              <dd>{profile.bankAccountHolder || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                Bank
                              </dt>
                              <dd>{profile.bankName || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                Account number
                              </dt>
                              <dd className="font-mono">
                                {profile.bankAccountNumber
                                  ? `•••• ${profile.bankAccountNumber.slice(-4)}`
                                  : '—'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                IBAN
                              </dt>
                              <dd className="font-mono">
                                {profile.bankIban
                                  ? `${profile.bankIban.slice(0, 4)} •••• •••• ${profile.bankIban.slice(-4)}`
                                  : '—'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                SWIFT / BIC
                              </dt>
                              <dd className="font-mono">{profile.bankSwift || '—'}</dd>
                            </div>
                          </dl>
                        )
                      : (
                          <p className="mt-4 text-sm text-muted-foreground">
                            No payout details on file yet. Add them now or you'll be
                            asked when you create your first listing.
                          </p>
                        )}
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="bought" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="bought">
                      Bought (
                      {orders.length}
                      )
                    </TabsTrigger>
                    <TabsTrigger value="sold">
                      Sold (
                      {sales.length}
                      )
                    </TabsTrigger>
                    <TabsTrigger value="returns">Returns</TabsTrigger>
                  </TabsList>

                  {/* Bought tab */}
                  <TabsContent value="bought" className="mt-4">
                    {orders.length === 0
                      ? (
                          <div className="flex flex-col items-center py-12 text-center">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 font-heading text-lg font-semibold">
                              No purchases yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Items you buy will appear here
                            </p>
                            <Button
                              onClick={() => navigate('/listings')}
                              className="mt-4"
                            >
                              Browse Listings
                            </Button>
                          </div>
                        )
                      : (
                          <>
                            <div className="mb-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                              <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <p>
                                Tap
                                {' '}
                                <span className="font-medium">Details</span>
                                {' '}
                                on any
                                order to leave a review for each item you bought.
                              </p>
                            </div>
                            <div className="space-y-3">
                              {orders.map(order => (
                                <OrderCard key={order.id} order={order} />
                              ))}
                            </div>
                          </>
                        )}
                  </TabsContent>

                  {/* Sold tab */}
                  <TabsContent value="sold" className="mt-4">
                    {sales.length === 0
                      ? (
                          <div className="flex flex-col items-center py-12 text-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 font-heading text-lg font-semibold">
                              No sales yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Items you sell will appear here
                            </p>
                            <Button
                              onClick={() => navigate('/create-listing')}
                              className="mt-4"
                            >
                              Create Listing
                            </Button>
                          </div>
                        )
                      : (
                          <div className="space-y-3">
                            {sales.map(item => (
                              <SoldOrderCard key={item.id} item={item} />
                            ))}
                          </div>
                        )}
                  </TabsContent>

                  {/* Returns tab */}
                  <TabsContent value="returns" className="mt-4">
                    <ReturnsTab />
                  </TabsContent>
                </Tabs>
              </>
            )}
      </main>
      <Footer />

      <BankDetailsModal
        onCancel={() => setBankModalOpen(false)}
        onSaved={() => {
          setBankModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['my-profile'] });
        }}
        initialValues={{
          bank_account_holder: profile?.bankAccountHolder ?? '',
          bank_account_number: profile?.bankAccountNumber ?? '',
          bank_iban: profile?.bankIban ?? '',
          bank_name: profile?.bankName ?? '',
          bank_swift: profile?.bankSwift ?? '',
        }}
        open={bankModalOpen}
      />
    </div>
  );
}

// ── OrderCard (buyer view) ─────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const items = order.items;
  const itemCount = items.reduce((s, it) => s + it.quantity, 0);
  const firstImage = items[0]?.imageUrl || '/placeholder.svg';

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
                Order #
                {order.id.slice(0, 8).toUpperCase()}
              </span>
              <Badge variant="secondary">{order.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {itemCount}
              {' '}
              item
              {itemCount === 1 ? '' : 's'}
              {' '}
              · Rs
              {' '}
              {Number(order.total).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
          <Button
            onClick={() => setOpen(v => !v)}
            size="sm"
            variant="ghost"
            className="gap-1"
          >
            <Receipt className="h-4 w-4" />
            {open ? 'Hide' : 'Details'}
            <ChevronDown
              className={`
                h-4 w-4 transition-transform
                ${open ? 'rotate-180' : ''}
              `}
            />
          </Button>
        </div>

        {open && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            {/* Items */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Items
              </h4>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || '/placeholder.svg'}
                        alt={item.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/listing/${item.listingId}`}
                          className="
                            truncate text-sm font-medium text-foreground
                            hover:underline
                          "
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {item.brand ? `${item.brand} · ` : ''}
                          Qty
                          {' '}
                          {item.quantity}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {statusBadge(item.status, item.shippedAt)}
                        </div>

                        {/* Shipping info when shipped */}
                        {item.status === 'SHIPPED' && (
                          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                            {item.shippingMethod && (
                              <p>
                                Via
                                {item.shippingMethod}
                              </p>
                            )}
                            {item.trackingNumber && (
                              <p>
                                Tracking:
                                {' '}
                                <span className="font-medium text-foreground">
                                  {item.trackingNumber}
                                </span>
                              </p>
                            )}
                            {item.expectedDelivery && (
                              <p>
                                ETA
                                {' '}
                                {format(
                                  new Date(item.expectedDelivery),
                                  'dd MMM yyyy',
                                )}
                              </p>
                            )}
                            {item.proofImageUrl && (
                              <a
                                href={item.proofImageUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <img
                                  src={item.proofImageUrl}
                                  alt="Shipping proof"
                                  className="mt-1 h-20 w-20 rounded-md border border-border object-cover"
                                />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Buyer actions */}
                        {item.status === 'SHIPPED' && (
                          <BuyerReceiptActions
                            orderId={order.id}
                            orderItemId={item.id}
                            onChanged={() =>
                              queryClient.invalidateQueries({
                                queryKey: ['my-orders'],
                              })}
                          />
                        )}

                        {/* Complaint + Review after delivered */}
                        {item.status === 'DELIVERED' && (
                          <ComplaintActions
                            orderId={order.id}
                            orderItemId={item.id}
                          />
                        )}
                        {item.status === 'DELIVERED' && (
                          <OrderItemReview
                            listingId={item.listingId}
                            orderId={order.id}
                            orderItemId={item.id}
                            sellerId={item.sellerId}
                            sellerName={item.sellerFullName}
                          />
                        )}
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold">
                        Rs
                        {' '}
                        {(Number(item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Billing */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Billing summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    Rs
                    {Number(order.subtotal).toLocaleString()}
                  </span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-primary">
                      Discount
                      {order.discountCode ? ` (${order.discountCode})` : ''}
                    </span>
                    <span className="text-primary">
                      −Rs
                      {' '}
                      {Number(order.discountAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">Free</span>
                </div>
                {Number(order.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>
                      Rs
                      {Number(order.taxAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    Rs
                    {Number(order.total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping address */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-4 w-4" />
                {' '}
                Shipping address
              </h4>
              <div className="text-sm text-muted-foreground">
                <p className="text-foreground">
                  {order.shippingFirstName}
                  {' '}
                  {order.shippingLastName}
                </p>
                <p>{order.shippingAddress}</p>
                <p>
                  {order.shippingCity}
                  {order.shippingPostal ? `, ${order.shippingPostal}` : ''}
                </p>
                <p>{order.shippingPhone}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── SoldOrderCard (seller view) ────────────────────────────────────────────────
function SoldOrderCard({ item }: { item: OrderItem }) {
  const queryClient = useQueryClient();
  // const updateStatus = useUpdateOrderItemStatusMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState('');
  const [tracking, setTracking] = useState('');
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const resetForm = () => {
    setMethod('');
    setTracking('');
    setExpectedDate(undefined);
    setProofFile(null);
    setProofPreview(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0];
    if (!file)
      return;
    if (!file.type.startsWith('image/'))
      return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024)
      return toast.error('Image must be under 5MB');
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!method)
      return toast.error('Please select a shipping method');
    if (!expectedDate)
      return toast.error('Please select an expected delivery date');
    if (!proofFile)
      return toast.error('Please upload a proof image');

    setBusy(true);
    try {
      // 1. Upload proof image
      const uploaded = await uploadFile(proofFile);

      // 2. Update item status to SHIPPED
      await updateItemStatus(item.orderId, item.id, {
        expectedDelivery: expectedDate.toISOString(),
        shippingMethod: method,
        status: 'SHIPPED',
        trackingNumber: tracking.trim() || undefined,
      });

      // 3. Upload shipping proof URL
      await uploadShippingProof(item.orderId, item.id, uploaded.data.url);

      toast.success('Marked as shipped');
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['my-sales'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    }
    catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
    finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="
          flex flex-col gap-4
          sm:flex-row sm:items-start
        "
        >
          <Link to={`/listing/${item.listingId}`}>
            <img
              src={item.imageUrl || '/placeholder.svg'}
              alt={item.title}
              className="h-20 w-20 rounded-md object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/listing/${item.listingId}`}
                className="
                  truncate font-semibold text-foreground
                  hover:underline
                "
              >
                {item.title}
              </Link>
              <Badge variant="secondary">Sold</Badge>
              {statusBadge(item.status, item.shippedAt)}
              <SellerComplaintBadge
                orderId={item.orderId}
                orderItemId={item.id}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {item.brand ? `${item.brand} · ` : ''}
              Qty
              {item.quantity}
              {' '}
              · Rs
              {' '}
              {Number(item.total).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Buyer:
              {' '}
              {item.buyerFullName}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
          {item.status === 'CONFIRMED' && (
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              className="gap-1.5"
            >
              <Truck className="h-4 w-4" />
              {' '}
              Mark as Shipped
            </Button>
          )}
        </div>

        {/* Shipment details */}
        {item.status === 'SHIPPED'
          && (item.shippingMethod
            || item.trackingNumber
            || item.proofImageUrl) && (
          <>
            <Separator />
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Truck className="h-4 w-4" />
                {' '}
                Shipment details
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {item.shippingMethod && (
                  <p>
                    <span className="font-medium text-foreground">
                      Method:
                    </span>
                    {' '}
                    {item.shippingMethod}
                  </p>
                )}
                {item.trackingNumber && (
                  <p>
                    <span className="font-medium text-foreground">
                      Tracking:
                    </span>
                    {' '}
                    {item.trackingNumber}
                  </p>
                )}
                {item.expectedDelivery && (
                  <p>
                    <span className="font-medium text-foreground">ETA:</span>
                    {' '}
                    {format(new Date(item.expectedDelivery), 'dd MMM yyyy')}
                  </p>
                )}
                {item.proofImageUrl && (
                  <a
                    href={item.proofImageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <img
                      src={item.proofImageUrl}
                      alt="Proof"
                      className="mt-2 h-24 w-24 rounded-md border border-border object-cover"
                    />
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Mark as Shipped dialog */}
      <Dialog
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o)
            resetForm();
        }}
        open={dialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>
              Provide shipment details so the buyer knows what to expect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Shipping method *</Label>
              <Select onValueChange={setMethod} value={method}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a courier" />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_METHODS.map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tracking number (optional)</Label>
              <Input
                onChange={event => setTracking(event.target.value)}
                value={tracking}
                maxLength={100}
                placeholder="e.g. CG1234567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expected delivery date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !expectedDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedDate ? format(expectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    onSelect={setExpectedDate}
                    disabled={d =>
                      d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    mode="single"
                    selected={expectedDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Proof of shipment image *</Label>
              {proofPreview
                ? (
                    <div className="relative inline-block">
                      <img
                        src={proofPreview}
                        alt="Preview"
                        className="h-32 w-32 rounded-md border border-border object-cover"
                      />
                      <button
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview(null);
                        }}
                        type="button"
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                : (
                    <label className="
                      flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground
                      hover:bg-muted/50
                    "
                    >
                      <Upload className="h-4 w-4" />
                      Upload receipt or parcel photo
                      <input
                        onChange={handleFileChange}
                        accept="image/*"
                        type="file"
                        className="hidden"
                      />
                    </label>
                  )}
              <p className="text-xs text-muted-foreground">
                JPEG/PNG/WebP, max 5MB.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={busy}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={busy} className="gap-1.5">
              {busy
                ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )
                : (
                    <Truck className="h-4 w-4" />
                  )}
              Confirm Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── BuyerReceiptActions ────────────────────────────────────────────────────────
function BuyerReceiptActions({
  orderId,
  orderItemId,
  onChanged,
}: {
  orderId: string;
  orderItemId: string;
  onChanged: () => void;
}) {
  const updateStatus = useUpdateOrderItemStatusMutation();

  const markReceived = () => {
    updateStatus.mutate(
      { orderId, orderItemId, payload: { status: 'DELIVERED' } },
      {
        onError: (error: any) =>
          toast.error(error.message ?? 'Failed to update status'),
        onSuccess: () => {
          toast.success('Order marked as received');
          onChanged();
        },
      },
    );
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        onClick={markReceived}
        disabled={updateStatus.isPending}
        size="sm"
        variant="outline"
        className="h-7 gap-1 text-xs"
      >
        <CheckCircle2 className="h-3 w-3" />
        Mark as received
      </Button>
    </div>
  );
}

// ── Returns Tab ────────────────────────────────────────────────────────────────
const RETURN_STATUS_LABEL: Record<string, string> = {
  RAISED: 'Complaint Raised',
  REFUNDED: 'Completed · Refunded',
  REJECTED: 'Completed · Rejected',
  RETURN_ADDRESS_PROVIDED: 'Return Address Provided',
  RETURN_APPROVED: 'Return Approved',
  RETURN_IN_TRANSIT: 'Return In Transit',
  RETURN_RECEIVED: 'Return Received',
  UNDER_REVIEW: 'Under Review',
};

function ReturnStatusBadge({ status }: { status: ComplaintStatus }) {
  const isCompleted = status === 'REFUNDED' || status === 'REJECTED';
  const isReturn = [
    'RETURN_IN_TRANSIT',
    'RETURN_RECEIVED',
    'RETURN_APPROVED',
    'RETURN_ADDRESS_PROVIDED',
  ].includes(status);
  const Icon = isCompleted
    ? CheckCircle2
    : (isReturn
        ? PackageCheck
        : AlertTriangle);
  return (
    <Badge className="
      gap-1 bg-amber-500/15 text-amber-700
      hover:bg-amber-500/20
    "
    >
      <Icon className="h-3 w-3" />
      {RETURN_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  return (
    <Card>
      <CardContent className="
        flex flex-col gap-3 p-4
        sm:flex-row
      "
      >
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-muted">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">
                {complaint.listingTitle}
              </p>
            </div>
            <ReturnStatusBadge status={complaint.status} />
          </div>
          {complaint.reason && (
            <p className="text-sm">
              <span className="font-medium">Reason:</span>
              {' '}
              {complaint.reason}
            </p>
          )}
          {(complaint.returnCarrier || complaint.returnTracking) && (
            <p className="text-xs text-muted-foreground">
              Return:
              {' '}
              {complaint.returnCarrier ?? '—'}
              {complaint.returnTracking ? ` · ${complaint.returnTracking}` : ''}
            </p>
          )}
          {complaint.adminNotes && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Admin note:</span>
              {' '}
              {complaint.adminNotes}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Opened
            {' '}
            {format(new Date(complaint.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReturnsTab() {
  const { data: myReturns = [], isLoading: loadingMine } = useQuery(getMyRefundComplaintsOptions());
  const { data: returnedToMe = [], isLoading: loadingSeller } = useQuery(getComplaintsAgainstMeOptions());

  if (loadingMine || loadingSeller) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="my-returns">
      <TabsList>
        <TabsTrigger value="my-returns">
          My Returns (
          {myReturns.length}
          )
        </TabsTrigger>
        <TabsTrigger value="returned-to-me">
          Returned to Me (
          {returnedToMe.length}
          )
        </TabsTrigger>
      </TabsList>
      <TabsContent value="my-returns" className="mt-4">
        {myReturns.length === 0
          ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Undo2 className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  You haven't filed any returns yet.
                </p>
              </div>
            )
          : (
              <div className="space-y-3">
                {myReturns.map(c => (
                  <ComplaintCard key={c.id} complaint={c} />
                ))}
              </div>
            )}
      </TabsContent>
      <TabsContent value="returned-to-me" className="mt-4">
        {returnedToMe.length === 0
          ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Undo2 className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No returns have been filed against your sales.
                </p>
              </div>
            )
          : (
              <div className="space-y-3">
                {returnedToMe.map(c => (
                  <ComplaintCard key={c.id} complaint={c} />
                ))}
              </div>
            )}
      </TabsContent>
    </Tabs>
  );
}

export default UserProfile;
