import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminCategoriesOptions,
  getAdminSubcategoriesOptions,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from "@/queries/useCategoryManagement";
import type { Category, Subcategory } from "@/types/admin/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

// ── Form types ────────────────────────────────────────────────────────────────
interface CatForm {
  label: string;
  value: string; // immutable after create — disabled in edit mode
  icon: string;
  sortOrder: number;
}
interface SubForm {
  categoryId: string;
  label: string;
  value: string; // immutable after create — disabled in edit mode
  icon: string;
  sortOrder: number;
}

const emptyCat: CatForm = { label: "", value: "", icon: "📦", sortOrder: 0 };
const emptySub: SubForm = {
  categoryId: "",
  label: "",
  value: "",
  icon: "📦",
  sortOrder: 0,
};

const autoSlug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ── Component ─────────────────────────────────────────────────────────────────
const CategoryManagement = () => {
  const { toast } = useToast();

  const { data: categories = [], isLoading: loadingCats } = useQuery(
    getAdminCategoriesOptions(),
  );
  const { data: subcategories = [], isLoading: loadingSubs } = useQuery(
    getAdminSubcategoriesOptions(),
  );

  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const createSub = useCreateSubcategory();
  const updateSub = useUpdateSubcategory();
  const deleteSub = useDeleteSubcategory();

  // ── Category dialog state ──────────────────────────────────────────────────
  const [catOpen, setCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<CatForm>(emptyCat);

  const openNewCat = () => {
    setEditingCat(null);
    setCatForm(emptyCat);
    setCatOpen(true);
  };
  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({
      label: cat.label,
      value: cat.value,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
    });
    setCatOpen(true);
  };

  const handleSaveCat = () => {
    if (!catForm.label.trim() || !catForm.value.trim()) {
      toast({ title: "Label and value are required", variant: "destructive" });
      return;
    }
    if (editingCat) {
      // value is immutable — never send it in update
      updateCat.mutate(
        {
          id: editingCat.id,
          payload: {
            label: catForm.label.trim(),
            icon: catForm.icon,
            sortOrder: catForm.sortOrder,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Category updated" });
            setCatOpen(false);
          },
          onError: (e: any) =>
            toast({
              title: "Error",
              description: e.message,
              variant: "destructive",
            }),
        },
      );
    } else {
      createCat.mutate(
        {
          label: catForm.label.trim(),
          value: catForm.value.trim(),
          icon: catForm.icon,
          sortOrder: catForm.sortOrder,
        },
        {
          onSuccess: () => {
            toast({ title: "Category created" });
            setCatOpen(false);
          },
          onError: (e: any) =>
            toast({
              title: "Error",
              description: e.message,
              variant: "destructive",
            }),
        },
      );
    }
  };

  const handleDeleteCat = (id: string) => {
    if (!confirm("Delete this category? Existing listings won't be affected."))
      return;
    deleteCat.mutate(id, {
      onSuccess: () => toast({ title: "Category deleted" }),
      onError: (e: any) =>
        toast({
          title: "Error",
          description: e.message,
          variant: "destructive",
        }),
    });
  };

  // ── Subcategory dialog state ───────────────────────────────────────────────
  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subForm, setSubForm] = useState<SubForm>(emptySub);

  const openNewSub = () => {
    setEditingSub(null);
    setSubForm({ ...emptySub, categoryId: categories[0]?.id ?? "" });
    setSubOpen(true);
  };
  const openEditSub = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubForm({
      categoryId: sub.categoryId,
      label: sub.label,
      value: sub.value,
      icon: sub.icon,
      sortOrder: sub.sortOrder,
    });
    setSubOpen(true);
  };

  const handleSaveSub = () => {
    if (!subForm.label.trim() || !subForm.value.trim() || !subForm.categoryId) {
      toast({
        title: "Category, label and value are required",
        variant: "destructive",
      });
      return;
    }
    if (editingSub) {
      // value is immutable — never send it in update
      updateSub.mutate(
        {
          id: editingSub.id,
          payload: {
            label: subForm.label.trim(),
            icon: subForm.icon,
            sortOrder: subForm.sortOrder,
            categoryId: subForm.categoryId,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Subcategory updated" });
            setSubOpen(false);
          },
          onError: (e: any) =>
            toast({
              title: "Error",
              description: e.message,
              variant: "destructive",
            }),
        },
      );
    } else {
      createSub.mutate(
        {
          categoryId: subForm.categoryId,
          label: subForm.label.trim(),
          value: subForm.value.trim(),
          icon: subForm.icon,
          sortOrder: subForm.sortOrder,
        },
        {
          onSuccess: () => {
            toast({ title: "Subcategory created" });
            setSubOpen(false);
          },
          onError: (e: any) =>
            toast({
              title: "Error",
              description: e.message,
              variant: "destructive",
            }),
        },
      );
    }
  };

  const handleDeleteSub = (id: string) => {
    if (
      !confirm("Delete this subcategory? Existing listings won't be affected.")
    )
      return;
    deleteSub.mutate(id, {
      onSuccess: () => toast({ title: "Subcategory deleted" }),
      onError: (e: any) =>
        toast({
          title: "Error",
          description: e.message,
          variant: "destructive",
        }),
    });
  };

  const busy =
    createCat.isPending ||
    updateCat.isPending ||
    createSub.isPending ||
    updateSub.isPending;

  if (loadingCats || loadingSubs) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Category Management
      </h1>

      {/* ── Categories ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <Button size="sm" className="gap-1" onClick={openNewCat}>
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.value} · order {cat.sortOrder}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditCat(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCat(cat.id)}
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

      {/* ── Subcategories ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subcategories</CardTitle>
          <Button
            size="sm"
            className="gap-1"
            onClick={openNewSub}
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4" /> Add Subcategory
          </Button>
        </CardHeader>
        <CardContent>
          {subcategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subcategories yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {subcategories.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sub.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{sub.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.value} · {sub.categoryLabel} · order{" "}
                        {sub.sortOrder}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditSub(sub)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSub(sub.id)}
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

      {/* ── Category Dialog ── */}
      <Dialog
        open={catOpen}
        onOpenChange={(o) => {
          setCatOpen(o);
          if (!o) {
            setCatForm(emptyCat);
            setEditingCat(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={catForm.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setCatForm((f) => ({
                      ...f,
                      label,
                      value: f.value || autoSlug(label),
                    }));
                  }}
                  placeholder="e.g. Women"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Slug (value)
                  {editingCat && (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      (immutable)
                    </span>
                  )}
                </Label>
                <Input
                  value={catForm.value}
                  onChange={(e) =>
                    setCatForm((f) => ({
                      ...f,
                      value: e.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="e.g. women"
                  disabled={!!editingCat}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <Input
                  value={catForm.icon}
                  onChange={(e) =>
                    setCatForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="📦"
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={catForm.sortOrder}
                  onChange={(e) =>
                    setCatForm((f) => ({
                      ...f,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveCat}
            disabled={busy}
            className="mt-4 w-full"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingCat ? "Save Changes" : "Create Category"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Subcategory Dialog ── */}
      <Dialog
        open={subOpen}
        onOpenChange={(o) => {
          setSubOpen(o);
          if (!o) {
            setSubForm(emptySub);
            setEditingSub(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSub ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={subForm.categoryId}
                onValueChange={(v) =>
                  setSubForm((f) => ({ ...f, categoryId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={subForm.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setSubForm((f) => ({
                      ...f,
                      label,
                      value: f.value || autoSlug(label),
                    }));
                  }}
                  placeholder="e.g. Shoes"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Slug (value)
                  {editingSub && (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      (immutable)
                    </span>
                  )}
                </Label>
                <Input
                  value={subForm.value}
                  onChange={(e) =>
                    setSubForm((f) => ({
                      ...f,
                      value: e.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="e.g. shoes"
                  disabled={!!editingSub}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <Input
                  value={subForm.icon}
                  onChange={(e) =>
                    setSubForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="📦"
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={subForm.sortOrder}
                  onChange={(e) =>
                    setSubForm((f) => ({
                      ...f,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveSub}
            disabled={busy}
            className="mt-4 w-full"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingSub ? "Save Changes" : "Create Subcategory"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
