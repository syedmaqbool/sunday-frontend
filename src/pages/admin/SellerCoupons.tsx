import { useQuery } from '@tanstack/react-query';
import { BarChart3, Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  getAdminSellerListingsOptions,
  getAdminUsersListOptions,
  getSellerCouponsOptions,
  useCreateSellerCoupon,
  useDeleteSellerCoupon,
  useUpdateSellerCoupon,
} from '@/queries/useAdminSellerCoupons';
import { authInstance } from '@/services/ky.instance';

// ── Types ────────────────────────────────────────────────────────────────────
type DiscountType = 'fixed' | 'percentage';
type Scope = 'item_based' | 'seller_wide';

interface SellerCouponDisplay {
  id: string;
  active: boolean;
  code: string;
  created_at: string;
  current_uses: number;
  discount_type: DiscountType;
  discount_value: number;
  expires_at: string | null;
  listing_id?: string | null; // ← single listing (not array)
  max_uses: number | null;
  min_order_amount: number;
  per_user_limit: number | null;
  scope: Scope;
  seller_id: string;
  seller_name?: string | null;
  starts_at: string | null;
}

interface SellerOption {
  id: string;
  full_name: string | null;
}
interface ListingOption {
  id: string;
  title: string;
}

// ── Adapters ─────────────────────────────────────────────────────────────────
function adaptCoupon(c: any, sellerName?: string | null): SellerCouponDisplay {
  return {
    id: c.id,
    active: c.active,
    code: c.code,
    created_at: c.createdAt,
    current_uses: c.currentUses ?? 0,
    discount_type: (c.discountType as string).toLowerCase() as DiscountType,
    discount_value: Number(c.discountValue),
    expires_at: c.expiresAt ?? null,
    listing_id: c.listingId ?? null,
    max_uses: c.maxUses ?? null,
    min_order_amount: Number(c.minOrderAmount ?? 0),
    per_user_limit: c.perUserLimit ?? null,
    scope: (c.scope as string).toLowerCase() as Scope,
    seller_id: c.sellerId,
    seller_name: sellerName ?? null,
    starts_at: c.startsAt ?? null,
  };
}

function formToPayload(form: typeof emptyForm) {
  return {
    listingId: form.scope === 'item_based' ? form.listing_id || null : null,
    sellerId: form.seller_id,
    code: form.code.trim().toUpperCase(),
    discountType: form.discount_type.toUpperCase(),
    discountValue: Number(form.discount_value),
    maxUses: form.max_uses ? Number(form.max_uses) : null,
    minOrderAmount: form.min_order_amount ? Number(form.min_order_amount) : 0,
    perUserLimit: form.per_user_limit ? Number(form.per_user_limit) : null,
    scope: form.scope.toUpperCase(),
    expiresAt: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    startsAt: form.starts_at ? new Date(form.starts_at).toISOString() : null,
  };
}

const emptyForm = {
  code: '',
  discount_type: 'percentage' as DiscountType,
  discount_value: '',
  expires_at: '',
  listing_id: '', // ← single listing ID
  max_uses: '',
  min_order_amount: '',
  per_user_limit: '',
  scope: 'seller_wide' as Scope,
  seller_id: '',
  starts_at: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
function SellerCoupons() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [redemptionsFor, setRedemptionsFor]
    = useState<SellerCouponDisplay | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: couponsRaw = [], isLoading } = useQuery(
    getSellerCouponsOptions(),
  );

  const { data: sellersRaw } = useQuery(getAdminUsersListOptions());

  const sellers: SellerOption[] = useMemo(
    () =>
      (sellersRaw?.data ?? []).map((u: any) => ({
        id: u.id,
        full_name:
          (u.fullName
            ?? u.profile?.fullName
            ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim())
          || undefined,
      })),
    [sellersRaw],
  );

  const sellerMap = useMemo(
    () => new Map(sellers.map(s => [s.id, s.full_name])),
    [sellers],
  );

  const coupons: SellerCouponDisplay[] = useMemo(
    () =>
      (couponsRaw as any[]).map(c =>
        adaptCoupon(c, sellerMap.get(c.sellerId)),
      ),
    [couponsRaw, sellerMap],
  );

  // Listings for selected seller (item_based scope only)
  const { data: listingsRaw } = useQuery(
    getAdminSellerListingsOptions(
      form.seller_id,
      !!form.seller_id && form.scope === 'item_based',
    ),
  );

  const listings: ListingOption[] = useMemo(
    () =>
      (listingsRaw?.data ?? []).map((l: any) => ({ id: l.id, title: l.title })),
    [listingsRaw],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createCoupon = useCreateSellerCoupon();
  const updateCoupon = useUpdateSellerCoupon();
  const deleteCouponM = useDeleteSellerCoupon();

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  // openEdit — no extra API call, listingId already in coupon
  const openEdit = (c: SellerCouponDisplay) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
      listing_id: c.listing_id ?? '',
      max_uses: c.max_uses === null ? '' : String(c.max_uses),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : '',
      per_user_limit: c.per_user_limit === null ? '' : String(c.per_user_limit),
      scope: c.scope,
      seller_id: c.seller_id,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.seller_id || !form.discount_value) {
      toast({
        description: 'Code, seller and discount value are required.',
        title: 'Missing fields',
        variant: 'destructive',
      });
      return;
    }
    if (form.scope === 'item_based' && !form.listing_id) {
      toast({
        description: 'Item-based coupons need one listing.',
        title: 'Select a listing',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editingId) {
        await updateCoupon.mutateAsync({ id: editingId, payload });
        toast({ title: 'Coupon updated' });
      }
      else {
        await createCoupon.mutateAsync(payload as any);
        toast({ title: 'Coupon created' });
      }
      setDialogOpen(false);
      resetForm();
    }
    catch (error: any) {
      toast({
        description: error?.message,
        title: 'Save failed',
        variant: 'destructive',
      });
    }
    finally {
      setSaving(false);
    }
  };

  const toggleActive = (c: SellerCouponDisplay) =>
    updateCoupon.mutate({ id: c.id, payload: { active: !c.active } });

  const deleteCoupon = (id: string) => {
    deleteCouponM.mutate(id, {
      onError: (error: any) =>
        toast({
          description: error?.message,
          title: 'Delete failed',
          variant: 'destructive',
        }),
      onSuccess: () => toast({ title: 'Coupon deleted' }),
    });
  };

  const openRedemptions = async (c: SellerCouponDisplay) => {
    setRedemptionsFor(c);
    try {
      const response = await authInstance
        .get(`/api/v1/admin/seller-coupons/${c.id}/redemptions`)
        .json<{ data: any[] }>();
      setRedemptions(response.data ?? []); // ← { data: [...] } shape
    }
    catch {
      setRedemptions([]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Seller Coupons
          </h1>
          <p className="text-sm text-muted-foreground">
            {coupons.length}
            {' '}
            coupons assigned to sellers
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {' '}
          New Coupon
        </Button>
      </div>

      {coupons.length === 0
        ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Tag className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No seller coupons yet</p>
            </div>
          )
        : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-semibold text-foreground">
                        {c.code}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.seller_name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {c.discount_type === 'percentage'
                            ? `${c.discount_value}%`
                            : `Rs ${c.discount_value.toLocaleString()}`}
                        </Badge>
                        {c.min_order_amount > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            min Rs
                            {' '}
                            {c.min_order_amount.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.scope === 'seller_wide'
                          ? 'All seller items'
                          : 'Specific item'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.starts_at
                          ? new Date(c.starts_at).toLocaleDateString()
                          : '—'}
                        {' → '}
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.current_uses}
                        {c.max_uses === null ? '' : ` / ${c.max_uses}`}
                        {c.per_user_limit ? ` · ${c.per_user_limit}/user` : ''}
                      </TableCell>
                      <TableCell>
                        <Switch
                          onCheckedChange={() => toggleActive(c)}
                          checked={c.active}
                        />
                      </TableCell>
                      <TableCell className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => openRedemptions(c)}
                          size="icon"
                          title="Usage"
                          variant="ghost"
                          className="h-7 w-7"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => openEdit(c)}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => deleteCoupon(c.id)}
                          size="icon"
                          variant="ghost"
                          className="
                            h-7 w-7 text-muted-foreground
                            hover:text-destructive
                          "
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

      {/* Create / Edit dialog */}
      <Dialog
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o)
            resetForm();
        }}
        open={dialogOpen}
      >
        <DialogContent className="
          max-h-[90vh] overflow-y-auto
          sm:max-w-xl
        "
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Coupon' : 'Create Seller Coupon'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  onChange={event =>
                    setForm({ ...form, code: event.target.value.toUpperCase() })}
                  value={form.code}
                  placeholder="SELLER10"
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to seller</Label>
                <Select
                  onValueChange={v =>
                    setForm({ ...form, listing_id: '', seller_id: v })}
                  value={form.seller_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose seller" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name || s.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select
                  onValueChange={v =>
                    setForm({ ...form, discount_type: v as DiscountType })}
                  value={form.discount_type}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  onChange={event =>
                    setForm({ ...form, discount_value: event.target.value })}
                  value={form.discount_value}
                  placeholder={
                    form.discount_type === 'percentage' ? '10' : '500'
                  }
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min order (Rs)</Label>
                <Input
                  onChange={event =>
                    setForm({ ...form, min_order_amount: event.target.value })}
                  value={form.min_order_amount}
                  placeholder="0"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label>Max uses</Label>
                <Input
                  onChange={event =>
                    setForm({ ...form, max_uses: event.target.value })}
                  value={form.max_uses}
                  placeholder="∞"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label>Per user limit</Label>
                <Input
                  onChange={event =>
                    setForm({ ...form, per_user_limit: event.target.value })}
                  value={form.per_user_limit}
                  placeholder="∞"
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Input
                  onChange={event =>
                    setForm({ ...form, starts_at: event.target.value })}
                  value={form.starts_at}
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Input
                  onChange={event =>
                    setForm({ ...form, expires_at: event.target.value })}
                  value={form.expires_at}
                  type="datetime-local"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                onValueChange={v =>
                  setForm({ ...form, listing_id: '', scope: v as Scope })}
                value={form.scope}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller_wide">
                    All items from this seller
                  </SelectItem>
                  <SelectItem value="item_based">
                    One specific listing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Single listing select — backend supports one listingId only */}
            {form.scope === 'item_based' && (
              <div className="space-y-2">
                <Label>Applicable listing</Label>
                {form.seller_id
                  ? (listings.length === 0
                      ? (
                          <p className="text-xs text-muted-foreground">
                            No approved listings for this seller.
                          </p>
                        )
                      : (
                          <Select
                            onValueChange={v => setForm({ ...form, listing_id: v })}
                            value={form.listing_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a listing" />
                            </SelectTrigger>
                            <SelectContent>
                              {listings.map(l => (
                                <SelectItem key={l.id} value={l.id}>
                                  {l.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ))
                  : (
                      <p className="text-xs text-muted-foreground">
                        Pick a seller first.
                      </p>
                    )}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )
                : (editingId
                    ? (
                        'Save Changes'
                      )
                    : (
                        'Create Coupon'
                      ))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemptions dialog */}
      <Dialog
        onOpenChange={(o) => {
          if (o) {
            return;
          }

          setRedemptionsFor(null);
          setRedemptions([]);
        }}
        open={!!redemptionsFor}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Usage ·
              {' '}
              <span className="font-mono">{redemptionsFor?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {redemptions.length === 0
            ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No redemptions yet.
                </p>
              )
            : (
                <div className="max-h-[60vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.buyerId?.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.orderId?.slice(0, 8) ?? '—'}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            Rs
                            {' '}
                            {Number(r.discountAmount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SellerCoupons;
