import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Percent } from "lucide-react";
import {
  useCommissionTiers,
  useCreateCommissionTier,
  useUpdateCommissionTier,
  useDeleteCommissionTier,
} from "@/queries/useAdminCommission";
import type { CommissionTier } from "@/services/commission.service";

const blankForm = {
  name: "",
  categories: "",
  min_price: "0",
  max_price: "",
  rate: "",
  active: true,
  sort_order: "0",
};

const CommissionManagement = () => {
  const { data: tiers, isLoading } = useCommissionTiers();
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
      name: t.name,
      categories: (t.categories ?? []).join(", "),
      min_price: String(t.minPrice ?? 0),
      max_price: t.maxPrice == null ? "" : String(t.maxPrice),
      rate: String(t.rate),
      active: t.active,
      sort_order: String(t.sortOrder ?? 0),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const rate = parseFloat(form.rate);
    const minP = parseFloat(form.min_price || "0");
    const maxP = form.max_price.trim() === "" ? null : parseFloat(form.max_price);
    if (!form.name.trim() || isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: "Invalid input", description: "Name and rate (0–100) required.", variant: "destructive" });
      return;
    }
    if (isNaN(minP) || (maxP !== null && (isNaN(maxP) || maxP < minP))) {
      toast({ title: "Invalid price range", description: "Max price must be ≥ min price.", variant: "destructive" });
      return;
    }
    const categories = form.categories
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      categories,
      minPrice: minP,
      maxPrice: maxP,
      rate,
      active: form.active,
      sortOrder: parseInt(form.sort_order || "0", 10) || 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateTier.mutateAsync({ commissionTierId: editing.id, payload });
        toast({ title: "Tier updated" });
      } else {
        await createTier.mutateAsync(payload);
        toast({ title: "Tier created" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this commission tier?")) return;
    try {
      await deleteTier.mutateAsync(id);
      toast({ title: "Tier deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleActive = async (t: CommissionTier) => {
    try {
      await updateTier.mutateAsync({ commissionTierId: t.id, payload: { active: !t.active } });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const fmtPrice = (n: number | null) =>
    n == null ? "∞" : `Rs ${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Commission Management</h1>
          <p className="text-sm text-muted-foreground">
            Platform fees applied to listings by category and price range.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Tier
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !tiers || tiers.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No commission tiers configured. Sales will be paid without platform fees.
          </div>
        ) : (
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
              {tiers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    {t.categories.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Any category</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {t.categories.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {fmtPrice(t.minPrice)} – {fmtPrice(t.maxPrice)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-medium">
                      {Number(t.rate).toFixed(2)}
                      <Percent className="h-3 w-3" />
                    </span>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(t)}>
                      <Badge variant={t.active ? "default" : "secondary"}>
                        {t.active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit commission tier" : "Add commission tier"}</DialogTitle>
            <DialogDescription>
              Match listings by category tag and price range, then charge the configured percentage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tier name</Label>
              <Input
                id="name"
                placeholder="Tier 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">Categories (comma separated, blank = any)</Label>
              <Input
                id="categories"
                placeholder="formals, eastern, luxury"
                value={form.categories}
                onChange={(e) => setForm({ ...form, categories: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Matched against listing category tokens (lowercase). Leave empty to apply to every category.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="min_price">Min price (PKR)</Label>
                <Input
                  id="min_price"
                  type="number"
                  min="0"
                  value={form.min_price}
                  onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_price">Max price (blank = no cap)</Label>
                <Input
                  id="max_price"
                  type="number"
                  min="0"
                  value={form.max_price}
                  onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rate">Platform fee (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionManagement;