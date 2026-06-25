import type { CommissionTier } from '@/types/commission';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import {
  getCommissionTiersOptions,
  useCreateCommissionTier,
  useDeleteCommissionTier,
  useUpdateCommissionTier,
} from '@/queries/useAdminCommission';

const blankForm = {
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
  const createTier = useCreateCommissionTier();
  const updateTier = useUpdateCommissionTier();
  const deleteTier = useDeleteCommissionTier();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionTier | null>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(blankForm);
    setOpen(true);
  };

  const openEdit = (t: CommissionTier) => {
    setEditing(t);
    setForm({
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

  const handleSave = async () => {
    const rate = Number(form.rate);
    const minP = Number(form.min_price || '0');
    const maxP
      = form.max_price.trim() === '' ? null : Number(form.max_price);
    if (!form.name.trim() || Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        description: 'Name and rate (0-100) required.',
        title: 'Invalid input',
        variant: 'destructive',
      });
      return;
    }
    if (Number.isNaN(minP) || (maxP !== null && (Number.isNaN(maxP) || maxP < minP))) {
      toast({
        description: 'Max price must be ≥ min price.',
        title: 'Invalid price range',
        variant: 'destructive',
      });
      return;
    }
    const categories = form.categories
      .split(',')
      .map(c => c.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      active: form.active,
      categories,
      maxPrice: maxP,
      minPrice: minP,
      name: form.name.trim(),
      rate,
      sortOrder: Number.parseInt(form.sort_order || '0') || 0,
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
      toast({ description: error.message, title: 'Error', variant: 'destructive' });
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
      toast({ description: error.message, title: 'Error', variant: 'destructive' });
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
      toast({ description: error.message, title: 'Error', variant: 'destructive' });
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tier name</Label>
              <Input
                id="name"
                onChange={event => setForm({ ...form, name: event.target.value })}
                value={form.name}
                placeholder="Tier 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">
                Categories (comma separated, blank = any)
              </Label>
              <Input
                id="categories"
                onChange={event =>
                  setForm({ ...form, categories: event.target.value })}
                value={form.categories}
                placeholder="formals, eastern, luxury"
              />
              <p className="text-xs text-muted-foreground">
                Matched against listing category tokens (lowercase). Leave empty
                to apply to every category.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="min_price">Min price (PKR)</Label>
                <Input
                  id="min_price"
                  onChange={event =>
                    setForm({ ...form, min_price: event.target.value })}
                  value={form.min_price}
                  min="0"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_price">Max price (blank = no cap)</Label>
                <Input
                  id="max_price"
                  onChange={event =>
                    setForm({ ...form, max_price: event.target.value })}
                  value={form.max_price}
                  min="0"
                  type="number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rate">Platform fee (%)</Label>
                <Input
                  id="rate"
                  onChange={event => setForm({ ...form, rate: event.target.value })}
                  value={form.rate}
                  max="100"
                  min="0"
                  step="0.01"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order"
                  onChange={event =>
                    setForm({ ...form, sort_order: event.target.value })}
                  value={form.sort_order}
                  type="number"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                onCheckedChange={v => setForm({ ...form, active: v })}
                checked={form.active}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommissionManagement;
