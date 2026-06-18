import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBrands, type Brand } from "@/hooks/useBrands";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

type BrandForm = { name: string; sort_order: number; active: boolean };
const emptyForm: BrandForm = { name: "", sort_order: 0, active: true };

const BrandManagement = () => {
  const { data: brands = [], isLoading } = useBrands(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
    [brands, search]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["brands"] });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        queryClient.setQueryData<Brand[]>(["brands", true], (old = []) => {
          if (editingId) {
            return old.map((b) => (b.id === editingId ? { ...b, ...form } : b));
          }
          return [...old, { id: `mock-brand-${Date.now()}`, ...form }];
        });
        queryClient.invalidateQueries({ queryKey: ["brands", false] });
        toast({ title: editingId ? "Brand updated" : "Brand created" });
        setDialogOpen(false);
        setForm(emptyForm);
        setEditingId(null);
        setBusy(false);
        return;
      }

      if (editingId) {
        const { error } = await supabase.from("brands").update(form).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Brand updated" });
      } else {
        const { error } = await supabase.from("brands").insert(form);
        if (error) throw error;
        toast({ title: "Brand created" });
      }
      invalidate();
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand?")) return;

    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      queryClient.setQueryData<Brand[]>(["brands", true], (old = []) => old.filter((b) => b.id !== id));
      queryClient.invalidateQueries({ queryKey: ["brands", false] });
      toast({ title: "Brand deleted" });
      return;
    }

    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Brand deleted" });
      invalidate();
    }
  };

  const openEdit = (b: Brand) => {
    setForm({ name: b.name, sort_order: b.sort_order, active: b.active });
    setEditingId(b.id);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">Brand Management</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Brands</CardTitle>
          <Dialog
            open={dialogOpen}
            onOpenChange={(o) => {
              setDialogOpen(o);
              if (!o) {
                setForm(emptyForm);
                setEditingId(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Brand" : "Add Brand"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Nike"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={busy} className="mt-4 w-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Brand"}
              </Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No brands found.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      order {b.sort_order} · {b.active ? "active" : "inactive"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandManagement;