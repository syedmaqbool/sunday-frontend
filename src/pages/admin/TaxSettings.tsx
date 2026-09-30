import type { TaxSetting } from '@/types/taxSetting.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
  getTaxSettingsOptions,
  taxSettingsQueryKey,
  useCreateTaxSettingMutation,
  useDeleteTaxSettingMutation,
  useUpdateTaxSettingMutation,
} from '@/queries/adminTaxSettings.query';

const taxFormSchema = z.object({
  active: z.boolean(),
  name: z.string().trim().min(1, 'Provide a name.'),
  rate: z.string().trim().min(1, 'Provide a rate.').refine((value) => {
    const rate = Number(value);
    return Number.isFinite(rate) && rate >= 0 && rate <= 100;
  }, 'Rate must be between 0 and 100.'),
});

type TaxFormValues = z.infer<typeof taxFormSchema>;

const emptyTaxForm: TaxFormValues = { active: true, name: '', rate: '' };

function TaxSettings() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useForm<TaxFormValues>({
    defaultValues: emptyTaxForm,
    resolver: zodResolver(taxFormSchema),
  });

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { data: taxes = [], isLoading } = useQuery(getTaxSettingsOptions());
  const createTax = useCreateTaxSettingMutation();
  const updateTax = useUpdateTaxSettingMutation();
  const deleteTax = useDeleteTaxSettingMutation();

  // ── "Only one active" helper ───────────────────────────────────────────────
  const deactivateAll = async (exceptId?: string) => {
    const activeOnes = taxes.filter(t => t.active && t.id !== exceptId);
    await Promise.all(
      activeOnes.map(t =>
        updateTax.mutateAsync({ resourceId: t.id, payload: { active: false } }),
      ),
    );
  };

  // ── Dialog helpers ─────────────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    form.reset(emptyTaxForm);
    setOpen(true);
  };

  const openEdit = (t: TaxSetting) => {
    setEditing(t);
    form.reset({ active: t.active, name: t.name, rate: String(t.rate) });
    setOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (values: TaxFormValues) => {
    const rate = Number(values.rate);
    setSaving(true);
    try {
      if (values.active)
        await deactivateAll(editing?.id);

      if (editing) {
        await updateTax.mutateAsync({
          resourceId: editing.id,
          payload: { active: values.active, name: values.name, rate },
        });
        toast({ title: 'Tax updated' });
      }
      else {
        await createTax.mutateAsync({
          active: values.active,
          name: values.name,
          rate,
        });
        toast({ title: 'Tax created' });
      }

      setOpen(false);
      qc.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
    finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteTax.mutateAsync(id);
      toast({ title: 'Tax deleted' });
      qc.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (t: TaxSetting) => {
    try {
      if (!t.active)
        await deactivateAll(t.id);
      await updateTax.mutateAsync({
        resourceId: t.id,
        payload: { active: !t.active },
      });
      qc.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Tax Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage tax rates applied to all orders at checkout.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          {' '}
          Add Tax
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading
          ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )
          : (taxes.length === 0
              ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No tax rates configured yet.
                  </div>
                )
              : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxes.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>
                            {Number(t.rate).toFixed(2)}
                            %
                          </TableCell>
                          <TableCell>
                            <button onClick={() => handleToggleActive(t)}>
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
              {editing ? 'Edit Tax Rate' : 'Add Tax Rate'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave, errors => toast({ description: Object.values(errors)[0]?.message, title: 'Invalid input', variant: 'destructive' }))} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Controller name="name" control={form.control} render={({ field }) => <Input {...field} placeholder="VAT" />} />
            </div>
            <div className="space-y-2">
              <Label>Rate (%)</Label>
              <Controller name="rate" control={form.control} render={({ field }) => <Input {...field} type="number" />} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Controller name="active" control={form.control} render={({ field }) => <Switch onCheckedChange={field.onChange} checked={field.value} />} />
            </div>
            <p className="text-xs text-muted-foreground">
              Only one tax rate can be active at a time.
            </p>
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

export default TaxSettings;
