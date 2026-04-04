import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories, useSubcategories, type Category, type Subcategory } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

type ItemForm = { label: string; value: string; icon: string; sort_order: number };
const emptyForm: ItemForm = { label: "", value: "", icon: "📦", sort_order: 0 };

const CategoryManagement = () => {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: subcategories = [], isLoading: loadingSubs } = useSubcategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [catForm, setCatForm] = useState<ItemForm>(emptyForm);
  const [subForm, setSubForm] = useState<ItemForm>(emptyForm);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const autoSlug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSaveCategory = async () => {
    if (!catForm.label || !catForm.value) return;
    setBusy(true);
    try {
      if (editingCatId) {
        const { error } = await supabase.from("categories").update({
          label: catForm.label, value: catForm.value, icon: catForm.icon, sort_order: catForm.sort_order,
        }).eq("id", editingCatId);
        if (error) throw error;
        toast({ title: "Category updated" });
      } else {
        const { error } = await supabase.from("categories").insert({
          label: catForm.label, value: catForm.value, icon: catForm.icon, sort_order: catForm.sort_order,
        });
        if (error) throw error;
        toast({ title: "Category created" });
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCatDialogOpen(false);
      setCatForm(emptyForm);
      setEditingCatId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const handleSaveSubcategory = async () => {
    if (!subForm.label || !subForm.value) return;
    setBusy(true);
    try {
      if (editingSubId) {
        const { error } = await supabase.from("subcategories").update({
          label: subForm.label, value: subForm.value, icon: subForm.icon, sort_order: subForm.sort_order,
        }).eq("id", editingSubId);
        if (error) throw error;
        toast({ title: "Subcategory updated" });
      } else {
        const { error } = await supabase.from("subcategories").insert({
          label: subForm.label, value: subForm.value, icon: subForm.icon, sort_order: subForm.sort_order,
        });
        if (error) throw error;
        toast({ title: "Subcategory created" });
      }
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      setSubDialogOpen(false);
      setSubForm(emptyForm);
      setEditingSubId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Existing listings won't be affected.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Delete this subcategory? Existing listings won't be affected.")) return;
    const { error } = await supabase.from("subcategories").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Subcategory deleted" });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    }
  };

  const openEditCat = (cat: Category) => {
    setCatForm({ label: cat.label, value: cat.value, icon: cat.icon, sort_order: cat.sort_order });
    setEditingCatId(cat.id);
    setCatDialogOpen(true);
  };

  const openEditSub = (sub: Subcategory) => {
    setSubForm({ label: sub.label, value: sub.value, icon: sub.icon, sort_order: sub.sort_order });
    setEditingSubId(sub.id);
    setSubDialogOpen(true);
  };

  const formFields = (form: ItemForm, setForm: (f: ItemForm) => void) => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input value={form.label} onChange={e => {
            const label = e.target.value;
            setForm({ ...form, label, value: form.value || autoSlug(label) });
          }} placeholder="e.g. Women" />
        </div>
        <div className="space-y-2">
          <Label>Slug (value)</Label>
          <Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="e.g. women" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Icon (emoji)</Label>
          <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="📦" />
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
    </div>
  );

  if (loadingCats || loadingSubs) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">Category Management</h1>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <Dialog open={catDialogOpen} onOpenChange={o => { setCatDialogOpen(o); if (!o) { setCatForm(emptyForm); setEditingCatId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCatId ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
              {formFields(catForm, setCatForm)}
              <Button onClick={handleSaveCategory} disabled={busy} className="mt-4 w-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCatId ? "Save Changes" : "Create Category"}
              </Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.value} · order {cat.sort_order}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditCat(cat)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subcategories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subcategories</CardTitle>
          <Dialog open={subDialogOpen} onOpenChange={o => { setSubDialogOpen(o); if (!o) { setSubForm(emptyForm); setEditingSubId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Subcategory</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingSubId ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle></DialogHeader>
              {formFields(subForm, setSubForm)}
              <Button onClick={handleSaveSubcategory} disabled={busy} className="mt-4 w-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSubId ? "Save Changes" : "Create Subcategory"}
              </Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {subcategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subcategories yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {subcategories.map(sub => (
                <div key={sub.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sub.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{sub.label}</p>
                      <p className="text-xs text-muted-foreground">{sub.value} · order {sub.sort_order}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditSub(sub)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSubcategory(sub.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default CategoryManagement;
