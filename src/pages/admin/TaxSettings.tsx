import type { TaxSetting } from '@/types/taxSetting.type';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import {
  getTaxSettingsOptions,
  useCreateTaxSettingMutation,
  useDeleteTaxSettingMutation,
  useUpdateTaxSettingMutation,
} from '@/queries/adminTaxSettings.query';

function TaxSettings() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxSetting | null>(null);
  const [form, setForm] = useState({ active: true, name: '', rate: '' });
  const [saving, setSaving] = useState(false);

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
    setForm({ active: true, name: '', rate: '' });
    setOpen(true);
  };

  const openEdit = (t: TaxSetting) => {
    setEditing(t);
    setForm({ active: t.active, name: t.name, rate: String(t.rate) });
    setOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const rate = Number(form.rate);
    if (!form.name.trim() || Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        description: 'Provide a name and rate between 0 and 100.',
        title: 'Invalid input',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (form.active)
        await deactivateAll(editing?.id);

      if (editing) {
        await updateTax.mutateAsync({
          resourceId: editing.id,
          payload: { active: form.active, name: form.name.trim(), rate },
        });
        toast({ title: 'Tax updated' });
      }
      else {
        await createTax.mutateAsync({
          active: form.active,
          name: form.name.trim(),
          rate,
        });
        toast({ title: 'Tax created' });
      }

      setOpen(false);
      qc.invalidateQueries({ queryKey: ['tax-settings'] });
    }
    catch (error: any) {
      toast({ description: error.message, title: 'Error', variant: 'destructive' });
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
      qc.invalidateQueries({ queryKey: ['tax-settings'] });
    }
    catch (error: any) {
      toast({ description: error.message, title: 'Error', variant: 'destructive' });
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
      qc.invalidateQueries({ queryKey: ['tax-settings'] });
    }
    catch (error: any) {
      toast({ description: error.message, title: 'Error', variant: 'destructive' });
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                onChange={event => setForm({ ...form, name: event.target.value })}
                value={form.name}
                placeholder="VAT"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate (%)</Label>
              <Input
                onChange={event => setForm({ ...form, rate: event.target.value })}
                value={form.rate}
                type="number"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                onCheckedChange={v => setForm({ ...form, active: v })}
                checked={form.active}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only one tax rate can be active at a time.
            </p>
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

export default TaxSettings;
