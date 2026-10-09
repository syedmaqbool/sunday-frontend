import type { AdminUser } from '@/types/adminUser.type';
import type { CreateSellerCouponPayload, SellerCoupon } from '@/types/sellerCoupon.type';
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

type Scope = 'item_based' | 'seller_wide';

interface SellerOption {
  id: string;
  full_name: string | null;
}

interface ListingOption {
  id: string;
  title: string;
}

const emptyForm = {
  expires_at: '',
  listing_id: '',
  max_eligible_units: '',
  min_order_amount: '',
  percentage: '',
  scope: 'seller_wide' as Scope,
  seller_id: '',
  starts_at: '',
};

const sellerIncentiveFormSchema = z.object({
  expires_at: z.string(),
  listing_id: z.string(),
  max_eligible_units: z.string().refine(value => value === '' || (Number.isSafeInteger(Number(value)) && Number(value) > 0), 'Eligible unit cap must be a positive whole number.'),
  min_order_amount: z.string().refine(value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), 'Minimum order must be zero or greater.'),
  percentage: z.string().refine((value) => {
    const percentage = Number(value);
    return value.trim() !== '' && Number.isSafeInteger(percentage) && percentage >= 1 && percentage <= 100;
  }, 'Percentage must be a whole number from 1 to 100.'),
  scope: z.enum(['item_based', 'seller_wide']),
  seller_id: z.string().min(1, 'Choose a seller.'),
  starts_at: z.string(),
}).superRefine((values, context) => {
  if (values.scope === 'item_based' && !values.listing_id) {
    context.addIssue({ path: ['listing_id'], code: z.ZodIssueCode.custom, message: 'Choose a listing for an item-based incentive.' });
  }
  if (values.starts_at && values.expires_at && new Date(values.expires_at) <= new Date(values.starts_at)) {
    context.addIssue({ path: ['expires_at'], code: z.ZodIssueCode.custom, message: 'Expiry must be after the start date.' });
  }
});

type SellerIncentiveFormValues = z.infer<typeof sellerIncentiveFormSchema>;

function formToPayload(form: SellerIncentiveFormValues): CreateSellerCouponPayload {
  return {
    listingId: form.scope === 'item_based' ? form.listing_id || null : null,
    sellerId: form.seller_id,
    maxEligibleUnits: form.max_eligible_units ? Number(form.max_eligible_units) : null,
    minOrderAmount: form.min_order_amount ? Number(form.min_order_amount) : 0,
    percentage: Number(form.percentage),
    scope: form.scope === 'item_based' ? 'ITEM_BASED' : 'SELLER_WIDE',
    expiresAt: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    startsAt: form.starts_at ? new Date(form.starts_at).toISOString() : null,
  };
}

function SellerCoupons() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [usageFor, setUsageFor] = useState<SellerCoupon | null>(null);
  const form = useForm<SellerIncentiveFormValues>({
    defaultValues: emptyForm,
    resolver: zodResolver(sellerIncentiveFormSchema),
  });
  const formValues = form.watch();

  const { data: incentives = [], isLoading } = useQuery(getSellerCouponsOptions());
  const { data: sellersRaw } = useQuery(getAdminUsersListOptions());
  const sellers: SellerOption[] = useMemo(
    () => (sellersRaw?.data ?? []).map((user: AdminUser) => ({
      id: user.id,
      full_name: `${user.firstName} ${user.lastName}`.trim() || null,
    })),
    [sellersRaw],
  );
  const sellerMap = useMemo(
    () => new Map(sellers.map(seller => [seller.id, seller.full_name])),
    [sellers],
  );

  const { data: listingsRaw } = useQuery(getAdminSellerListingsOptions(
    formValues.seller_id,
    !!formValues.seller_id && formValues.scope === 'item_based',
  ));
  const listings: ListingOption[] = useMemo(
    () => (listingsRaw?.data ?? []).map(listing => ({ id: listing.id, title: listing.title })),
    [listingsRaw],
  );

  const createIncentive = useCreateSellerCouponMutation();
  const updateIncentive = useUpdateSellerCouponMutation();
  const deleteIncentive = useDeleteSellerCouponMutation();

  const resetForm = () => {
    form.reset(emptyForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (incentive: SellerCoupon) => {
    setEditingId(incentive.id);
    form.reset({
      expires_at: incentive.expiresAt ? incentive.expiresAt.slice(0, 16) : '',
      listing_id: incentive.listingId ?? '',
      max_eligible_units: incentive.maxEligibleUnits === null ? '' : String(incentive.maxEligibleUnits),
      min_order_amount: incentive.minOrderAmount ? String(incentive.minOrderAmount) : '',
      percentage: String(incentive.percentage),
      scope: incentive.scope === 'ITEM_BASED' ? 'item_based' : 'seller_wide',
      seller_id: incentive.sellerId,
      starts_at: incentive.startsAt ? incentive.startsAt.slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async (values: SellerIncentiveFormValues) => {
    setSaving(true);
    try {
      const payload = formToPayload(values);
      if (editingId) {
        await updateIncentive.mutateAsync({ id: editingId, payload });
        toast({ title: 'Seller incentive updated' });
      }
      else {
        await createIncentive.mutateAsync(payload);
        toast({ title: 'Seller incentive created' });
      }
      setDialogOpen(false);
      resetForm();
    }
    catch (error: unknown) {
      toast(getErrorToastOptions(error, 'Save failed'));
    }
    finally {
      setSaving(false);
    }
  };

  const toggleActive = (incentive: SellerCoupon) =>
    updateIncentive.mutate({ id: incentive.id, payload: { active: !incentive.active } });

  const deleteSellerIncentive = (id: string) => {
    deleteIncentive.mutate(id, {
      onError: (error: unknown) => toast(getErrorToastOptions(error)),
      onSuccess: () => toast({ title: 'Seller incentive deleted' }),
    });
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Seller Incentives</h1>
          <p className="text-sm text-muted-foreground">
            {incentives.length}
            {' '}
            automatic seller incentives
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {' '}
          New Seller Incentive
        </Button>
      </div>

      {incentives.length === 0
        ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Tag className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No seller incentives yet</p>
            </div>
          )
        : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Seller bonus</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Eligible units</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incentives.map(incentive => (
                    <TableRow key={incentive.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {sellerMap.get(incentive.sellerId) ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {incentive.percentage}
                          %
                        </Badge>
                        {incentive.minOrderAmount > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            min Rs
                            {' '}
                            {incentive.minOrderAmount.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {incentive.scope === 'SELLER_WIDE' ? 'All seller items' : 'Specific item'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {incentive.startsAt ? new Date(incentive.startsAt).toLocaleDateString() : '—'}
                        {' → '}
                        {incentive.expiresAt ? new Date(incentive.expiresAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {`${incentive.usedEligibleUnits} used + ${incentive.reservedEligibleUnits} reserved / `}
                        {incentive.maxEligibleUnits === null ? 'unlimited units' : `${incentive.maxEligibleUnits} units`}
                      </TableCell>
                      <TableCell>
                        <Switch
                          onCheckedChange={() => toggleActive(incentive)}
                          checked={incentive.active}
                        />
                      </TableCell>
                      <TableCell className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => setUsageFor(incentive)}
                          aria-label="Seller incentive usage"
                          size="icon"
                          title="Seller incentive usage"
                          variant="ghost"
                          className="h-7 w-7"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => openEdit(incentive)}
                          aria-label="Edit seller incentive"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => deleteSellerIncentive(incentive.id)}
                          size="icon"
                          aria-label="Delete seller incentive"
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

      <Dialog
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open)
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
            <DialogTitle>{editingId ? 'Edit Seller Incentive' : 'Create Seller Incentive'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSave, (errors) => {
              const firstError = Object.values(errors)[0];
              toast({ description: firstError?.message, title: 'Check seller incentive fields', variant: 'destructive' });
            })}
            className="grid gap-4 py-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign to seller</Label>
                <Controller
                  name="seller_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('listing_id', '');
                      }}
                      value={field.value}
                    >
                      <SelectTrigger><SelectValue placeholder="Choose seller" /></SelectTrigger>
                      <SelectContent>
                        {sellers.map(seller => (
                          <SelectItem key={seller.id} value={seller.id}>{seller.full_name || seller.id.slice(0, 8)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-incentive-percentage">Percentage</Label>
                <Controller
                  name="percentage"
                  control={form.control}
                  render={({ field }) => (
                    <Input {...field} id="seller-incentive-percentage" max="100" min="1" placeholder="10" step="1" type="number" />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller-incentive-minimum-order">Minimum order (Rs)</Label>
                <Controller name="min_order_amount" control={form.control} render={({ field }) => <Input {...field} id="seller-incentive-minimum-order" placeholder="0" type="number" />} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-incentive-unit-cap">Eligible unit cap</Label>
                <Controller name="max_eligible_units" control={form.control} render={({ field }) => <Input {...field} id="seller-incentive-unit-cap" min="1" placeholder="Unlimited" step="1" type="number" />} />
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('listing_id', '');
                    }}
                    value={field.value}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller_wide">All items from this seller</SelectItem>
                      <SelectItem value="item_based">One specific listing</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {formValues.scope === 'item_based' && (
              <div className="space-y-2">
                <Label>Applicable listing</Label>
                {formValues.seller_id
                  ? (listings.length === 0
                      ? <p className="text-xs text-muted-foreground">No approved listings for this seller.</p>
                      : (
                          <Controller
                            name="listing_id"
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Choose a listing" /></SelectTrigger>
                                <SelectContent>
                                  {listings.map(listing => <SelectItem key={listing.id} value={listing.id}>{listing.title}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        ))
                  : <p className="text-xs text-muted-foreground">Pick a seller first.</p>}
              </div>
            )}

            <Button disabled={saving} type="submit">
              {saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : editingId ? 'Save Changes' : 'Create Seller Incentive'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={open => !open && setUsageFor(null)} open={!!usageFor}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Seller incentive usage</DialogTitle></DialogHeader>
          {usageFor && (
            <div className="grid gap-3 py-4 text-sm">
              <p className="font-medium">
                {usageFor.percentage}
                % seller bonus per eligible item
              </p>
              <p>
                {usageFor.usedEligibleUnits}
                {' '}
                used units
              </p>
              <p>
                {usageFor.reservedEligibleUnits}
                {' '}
                reserved units
              </p>
              <p>Total seller bonus generated</p>
              <p>
                Rs
                {' '}
                {usageFor.sellerIncentiveBonusAmount.toLocaleString('en-PK', { maximumFractionDigits: 2 })}
              </p>
              <p>
                Unit cap:
                {' '}
                {usageFor.maxEligibleUnits === null ? 'Unlimited' : usageFor.maxEligibleUnits}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SellerCoupons;
