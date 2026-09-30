import type { CommissionTier } from '@/types/commission.type';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  getCommissionTiersOptions,
  useCreateCommissionTierMutation,
  useDeleteCommissionTierMutation,
  useUpdateCommissionTierMutation,
} from '@/queries/adminCommission.query';

const commissionFormSchema = z.object({
  active: z.boolean(),
  categories: z.string(),
  max_price: z.string(),
  min_price: z.string().refine(value => Number.isFinite(Number(value)) && Number(value) >= 0, 'Minimum price must be zero or greater.'),
  name: z.string().trim().min(1, 'Name is required.'),
  rate: z.string().refine(value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100, 'Rate must be between 0 and 100.'),
  sort_order: z.string().refine(value => value.trim() === '' || (Number.isSafeInteger(Number(value)) && Number(value) >= 0), 'Sort order must be a non-negative whole number.'),
}).superRefine((values, context) => {
  if (values.max_price.trim() === '')
    return;
  const minimum = Number(values.min_price);
  const maximum = Number(values.max_price);
  if (!Number.isFinite(maximum) || maximum < minimum) {
    context.addIssue({ path: ['max_price'], code: z.ZodIssueCode.custom, message: 'Max price must be greater than or equal to min price.' });
  }
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

const blankForm: CommissionFormValues = {
  active: true,
  categories: '',
  max_price: '',
  min_price: '0',
  name: '',
  rate: '',
  sort_order: '0',
};

function fmtPrice(n: number | null) {
  return n == null ? '∞' : `Rs ${Number(n).toLocaleString()}`;
}

function CommissionManagement() {
  const { data: tiers, isLoading } = useQuery(getCommissionTiersOptions());
  const createTier = useCreateCommissionTierMutation();
  const updateTier = useUpdateCommissionTierMutation();
  const deleteTier = useDeleteCommissionTierMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionTier | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useForm<CommissionFormValues>({
    defaultValues: blankForm,
    resolver: zodResolver(commissionFormSchema),
  });

  const openNew = () => {
    setEditing(null);
    form.reset(blankForm);
    setOpen(true);
  };

  const openEdit = (t: CommissionTier) => {
    setEditing(t);
    form.reset({
      active: t.active,
      categories: (t.categories ?? []).join(', '),
      max_price: t.maxPrice == null ? '' : String(t.maxPrice),
      min_price: String(t.minPrice ?? 0),
      name: t.name,
      rate: String(t.rate),
      sort_order: String(t.sortOrder ?? 0),
    });
    setOpen(true);
  };

  const handleSave = async (values: CommissionFormValues) => {
    const rate = Number(values.rate);
    const minP = Number(values.min_price || '0');
    const maxP
      = values.max_price.trim() === '' ? null : Number(values.max_price);
    const categories = values.categories
      .split(',')
      .map(c => c.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      active: values.active,
      categories,
      maxPrice: maxP,
      minPrice: minP,
      name: values.name,
      rate,
      sortOrder: Number.parseInt(values.sort_order || '0') || 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateTier.mutateAsync({ commissionTierId: editing.id, payload });
        toast({ title: 'Tier updated' });
      }
      else {
        await createTier.mutateAsync(payload);
        toast({ title: 'Tier created' });
      }
      setOpen(false);
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
    finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTier.mutateAsync(id);
      toast({ title: 'Tier deleted' });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
  };

  const toggleActive = async (t: CommissionTier) => {
    try {
      await updateTier.mutateAsync({
        commissionTierId: t.id,
        payload: { active: !t.active },
      });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Commission Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform fees applied to listings by category and price range.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          {' '}
          Add Tier
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading
          ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )
          : (!tiers || tiers.length === 0
              ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No commission tiers configured. Sales will be paid without platform
                    fees.
                  </div>
                )
              : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead>Price range</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>
                            {t.categories.length === 0
                              ? (
                                  <span className="text-xs text-muted-foreground">
                                    Any category
                                  </span>
                                )
                              : (
                                  <div className="flex flex-wrap gap-1">
                                    {t.categories.map(c => (
                                      <Badge
                                        key={c}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {c}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {fmtPrice(t.minPrice)}
                            {' '}
                            –
                            {fmtPrice(t.maxPrice)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 font-medium">
                              {Number(t.rate).toFixed(2)}
                              <Percent className="h-3 w-3" />
                            </span>
                          </TableCell>
                          <TableCell>
                            <button onClick={() => toggleActive(t)}>
                              <Badge variant={t.active ? 'default' : 'secondary'}>
                                {t.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => openEdit(t)}
                              size="icon"
                              variant="ghost"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(t.id)}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ))}
      </div>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit commission tier' : 'Add commission tier'}
            </DialogTitle>
            <DialogDescription>
              Match listings by category tag and price range, then charge the
              configured percentage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave, errors => toast({ description: Object.values(errors)[0]?.message, title: 'Invalid input', variant: 'destructive' }))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tier name</Label>
              <Controller name="name" control={form.control} render={({ field }) => <Input {...field} id="name" placeholder="Tier 1" />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">
                Categories (comma separated, blank = any)
              </Label>
              <Controller name="categories" control={form.control} render={({ field }) => <Input {...field} id="categories" placeholder="formals, eastern, luxury" />} />
              <p className="text-xs text-muted-foreground">
                Matched against listing category tokens (lowercase). Leave empty
                to apply to every category.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="min_price">Min price (PKR)</Label>
                <Controller
                  name="min_price"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="min_price"
                      min="0"
                      type="number"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_price">Max price (blank = no cap)</Label>
                <Controller
                  name="max_price"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="max_price"
                      min="0"
                      type="number"
                    />
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rate">Platform fee (%)</Label>
                <Controller
                  name="rate"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="rate"
                      max="100"
                      min="0"
                      step="0.01"
                      type="number"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort order</Label>
                <Controller
                  name="sort_order"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="sort_order"
                      type="number"
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Controller name="active" control={form.control} render={({ field }) => <Switch id="active" onCheckedChange={field.onChange} checked={field.value} />} />
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommissionManagement;
