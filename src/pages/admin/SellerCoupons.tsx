import type { AdminUser } from '@/types/adminUser.type';

import type { PaginatedResponse } from '@/types/response.type';
import type { CreateSellerCouponPayload, SellerCoupon, SellerCouponRedemption } from '@/types/sellerCoupon.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { getErrorToastOptions } from '@/lib/errorToast';
import {
  getAdminSellerListingsOptions,
  getAdminUsersListOptions,
  getSellerCouponsOptions,
  useCreateSellerCouponMutation,
  useDeleteSellerCouponMutation,
  useUpdateSellerCouponMutation,
} from '@/queries/adminSellerCoupons.query';
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
function adaptCoupon(c: SellerCoupon, sellerName?: string | null): SellerCouponDisplay {
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

function formToPayload(form: SellerCouponFormValues): CreateSellerCouponPayload {
  return {
    listingId: form.scope === 'item_based' ? form.listing_id || null : null,
    sellerId: form.seller_id,
    code: form.code.trim().toUpperCase(),
    discountType: form.discount_type === 'fixed' ? 'FIXED' : 'PERCENTAGE',
    discountValue: Number(form.discount_value),
    maxUses: form.max_uses ? Number(form.max_uses) : null,
    minOrderAmount: form.min_order_amount ? Number(form.min_order_amount) : 0,
    perUserLimit: form.per_user_limit ? Number(form.per_user_limit) : null,
    scope: form.scope === 'item_based' ? 'ITEM_BASED' : 'SELLER_WIDE',
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

const sellerCouponFormSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.'),
  discount_type: z.enum(['fixed', 'percentage']),
  discount_value: z.string().refine((value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0;
  }, 'Discount value must be greater than zero.'),
  expires_at: z.string(),
  listing_id: z.string(),
  max_uses: z.string().refine(value => value === '' || (Number.isSafeInteger(Number(value)) && Number(value) > 0), 'Max uses must be a positive whole number.'),
  min_order_amount: z.string().refine(value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), 'Minimum order must be zero or greater.'),
  per_user_limit: z.string().refine(value => value === '' || (Number.isSafeInteger(Number(value)) && Number(value) > 0), 'Per-user limit must be a positive whole number.'),
  scope: z.enum(['item_based', 'seller_wide']),
  seller_id: z.string().min(1, 'Choose a seller.'),
  starts_at: z.string(),
}).superRefine((values, context) => {
  const discountValue = Number(values.discount_value);
  if (values.discount_type === 'percentage' && discountValue > 100) {
    context.addIssue({ path: ['discount_value'], code: z.ZodIssueCode.custom, message: 'Percentage discount cannot exceed 100.' });
  }
  if (values.scope === 'item_based' && !values.listing_id)
    context.addIssue({ path: ['listing_id'], code: z.ZodIssueCode.custom, message: 'Choose a listing for an item-based coupon.' });
  if (values.starts_at && values.expires_at && new Date(values.expires_at) <= new Date(values.starts_at))
    context.addIssue({ path: ['expires_at'], code: z.ZodIssueCode.custom, message: 'Expiry must be after the start date.' });
});

type SellerCouponFormValues = z.infer<typeof sellerCouponFormSchema>;

// ── Component ─────────────────────────────────────────────────────────────────
function SellerCoupons() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useForm<SellerCouponFormValues>({
    defaultValues: emptyForm,
    resolver: zodResolver(sellerCouponFormSchema),
  });
  const formValues = form.watch();
  const [redemptionsFor, setRedemptionsFor]
    = useState<SellerCouponDisplay | null>(null);
  const [redemptions, setRedemptions] = useState<SellerCouponRedemption[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: couponsRaw = [], isLoading } = useQuery(getSellerCouponsOptions());

  const { data: sellersRaw } = useQuery(getAdminUsersListOptions());

  const sellers: SellerOption[] = useMemo(
    () =>
      (sellersRaw?.data ?? []).map((u: AdminUser) => ({
        id: u.id,
        full_name: `${u.firstName} ${u.lastName}`.trim() || null,
      })),
    [sellersRaw],
  );

  const sellerMap = useMemo(
    () => new Map(sellers.map(s => [s.id, s.full_name])),
    [sellers],
  );

  const coupons: SellerCouponDisplay[] = useMemo(
    () =>
      couponsRaw.map(c =>
        adaptCoupon(c, sellerMap.get(c.sellerId)),
      ),
    [couponsRaw, sellerMap],
  );

  // Listings for selected seller (item_based scope only)
  const { data: listingsRaw } = useQuery(getAdminSellerListingsOptions(
    formValues.seller_id,
    !!formValues.seller_id && formValues.scope === 'item_based',
  ));

  const listings: ListingOption[] = useMemo(
    () =>
      (listingsRaw?.data ?? []).map(l => ({ id: l.id, title: l.title })),
    [listingsRaw],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createCoupon = useCreateSellerCouponMutation();
  const updateCoupon = useUpdateSellerCouponMutation();
  const deleteCouponM = useDeleteSellerCouponMutation();

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    form.reset(emptyForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  // openEdit — no extra API call, listingId already in coupon
  const openEdit = (c: SellerCouponDisplay) => {
    setEditingId(c.id);
    form.reset({
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

  const handleSave = async (values: SellerCouponFormValues) => {
    setSaving(true);
    try {
      const payload = formToPayload(values);
      if (editingId) {
        await updateCoupon.mutateAsync({ id: editingId, payload });
        toast({ title: 'Coupon updated' });
      }
      else {
        await createCoupon.mutateAsync(payload);
        toast({ title: 'Coupon created' });
      }
      setDialogOpen(false);
      resetForm();
    }
    catch (error: any) {
      toast(getErrorToastOptions(error, 'Save failed'));
    }
    finally {
      setSaving(false);
    }
  };

  const toggleActive = (c: SellerCouponDisplay) =>
    updateCoupon.mutate({ id: c.id, payload: { active: !c.active } });

  const deleteCoupon = (id: string) => {
    deleteCouponM.mutate(id, {
      onError: (error: any) => toast(getErrorToastOptions(error)),
      onSuccess: () => toast({ title: 'Coupon deleted' }),
    });
  };

  const openRedemptions = async (c: SellerCouponDisplay) => {
    setRedemptionsFor(c);
    try {
      const response = await authInstance
        .get(`/api/v1/admin/seller-coupons/${c.id}/redemptions`)
        .json<PaginatedResponse<SellerCouponRedemption>>();
      setRedemptions(response.data ?? []);
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
          <form onSubmit={form.handleSubmit(handleSave, errors => toast({ description: Object.values(errors)[0]?.message, title: 'Check coupon fields', variant: 'destructive' }))} className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Controller name="code" control={form.control} render={({ field }) => <Input {...field} onChange={event => field.onChange(event.target.value.toUpperCase())} placeholder="SELLER10" className="uppercase" />} />
              </div>
              <div className="space-y-2">
                <Label>Assign to seller</Label>
                <Controller
                  name="seller_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue('listing_id', '');
                      }}
                      value={field.value}
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
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Controller
                  name="discount_type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed (Rs)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Controller
                  name="discount_value"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={
                        formValues.discount_type === 'percentage' ? '10' : '500'
                      }
                      type="number"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min order (Rs)</Label>
                <Controller name="min_order_amount" control={form.control} render={({ field }) => <Input {...field} placeholder="0" type="number" />} />
              </div>
              <div className="space-y-2">
                <Label>Max uses</Label>
                <Controller name="max_uses" control={form.control} render={({ field }) => <Input {...field} placeholder="∞" type="number" />} />
              </div>
              <div className="space-y-2">
                <Label>Per user limit</Label>
                <Controller name="per_user_limit" control={form.control} render={({ field }) => <Input {...field} placeholder="∞" type="number" />} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Controller name="starts_at" control={form.control} render={({ field }) => <Input {...field} type="datetime-local" />} />
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Controller name="expires_at" control={form.control} render={({ field }) => <Input {...field} type="datetime-local" />} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <Controller
                name="scope"
                control={form.control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('listing_id', '');
                    }}
                    value={field.value}
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
                )}
              />
            </div>

            {/* Single listing select — backend supports one listingId only */}
            {formValues.scope === 'item_based' && (
              <div className="space-y-2">
                <Label>Applicable listing</Label>
                {formValues.seller_id
                  ? (listings.length === 0
                      ? (
                          <p className="text-xs text-muted-foreground">
                            No approved listings for this seller.
                          </p>
                        )
                      : (
                          <Controller
                            name="listing_id"
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
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
                            )}
                          />
                        ))
                  : (
                      <p className="text-xs text-muted-foreground">
                        Pick a seller first.
                      </p>
                    )}
              </div>
            )}

            <Button disabled={saving} type="submit">
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
          </form>
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
