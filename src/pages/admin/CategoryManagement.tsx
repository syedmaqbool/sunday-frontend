import type { Category, Subcategory } from '@/types/adminCategory.type';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { getErrorToastOptions } from '@/lib/errorToast';
import {
  getAdminCategoriesOptions,
  getAdminSubcategoriesOptions,
  useCreateCategoryMutation,
  useCreateSubcategoryMutation,
  useDeleteCategoryMutation,
  useDeleteSubcategoryMutation,
  useUpdateCategoryMutation,
  useUpdateSubcategoryMutation,
} from '@/queries/categoryManagement.query';

// ── Form types ────────────────────────────────────────────────────────────────
const categoryFormSchema = z.object({
  icon: z.string(),
  label: z.string().trim().min(1, 'Label is required.'),
  sortOrder: z.number().int().min(0),
  value: z.string().trim().min(1, 'Value is required.'),
});
const subcategoryFormSchema = categoryFormSchema.extend({
  categoryId: z.string().min(1, 'Choose a parent category.'),
});

type CatForm = z.infer<typeof categoryFormSchema>;
type SubForm = z.infer<typeof subcategoryFormSchema>;

const emptyCat: CatForm = { icon: '📦', label: '', sortOrder: 0, value: '' };
const emptySub: SubForm = {
  categoryId: '',
  icon: '📦',
  label: '',
  sortOrder: 0,
  value: '',
};

function autoSlug(label: string) {
  return label
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');
}

// ── Component ─────────────────────────────────────────────────────────────────
function CategoryManagement() {
  const { toast } = useToast();

  const { data: categories = [], isLoading: loadingCats } = useQuery(getAdminCategoriesOptions());
  const { data: subcategories = [], isLoading: loadingSubs } = useQuery(getAdminSubcategoriesOptions());

  const createCat = useCreateCategoryMutation();
  const updateCat = useUpdateCategoryMutation();
  const deleteCat = useDeleteCategoryMutation();
  const createSub = useCreateSubcategoryMutation();
  const updateSub = useUpdateSubcategoryMutation();
  const deleteSub = useDeleteSubcategoryMutation();

  // ── Category dialog state ──────────────────────────────────────────────────
  const [catOpen, setCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const catForm = useForm<CatForm>({ defaultValues: emptyCat, resolver: zodResolver(categoryFormSchema) });

  const openNewCat = () => {
    setEditingCat(null);
    catForm.reset(emptyCat);
    setCatOpen(true);
  };
  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    catForm.reset({
      icon: cat.icon,
      label: cat.label,
      sortOrder: cat.sortOrder,
      value: cat.value,
    });
    setCatOpen(true);
  };

  const handleSaveCat = (values: CatForm) => {
    if (editingCat) {
      // value is immutable — never send it in update
      updateCat.mutate(
        {
          id: editingCat.id,
          payload: {
            icon: values.icon,
            label: values.label,
            sortOrder: values.sortOrder,
          },
        },
        {
          onError: (error: any) => toast(getErrorToastOptions(error)),
          onSuccess: () => {
            toast({ title: 'Category updated' });
            setCatOpen(false);
          },
        },
      );
    }
    else {
      createCat.mutate(
        {
          icon: values.icon,
          label: values.label,
          sortOrder: values.sortOrder,
          value: values.value,
        },
        {
          onError: (error: any) => toast(getErrorToastOptions(error)),
          onSuccess: () => {
            toast({ title: 'Category created' });
            setCatOpen(false);
          },
        },
      );
    }
  };

  const handleDeleteCat = (id: string) => {
    deleteCat.mutate(id, {
      onError: (error: any) => toast(getErrorToastOptions(error)),
      onSuccess: () => toast({ title: 'Category deleted' }),
    });
  };

  // ── Subcategory dialog state ───────────────────────────────────────────────
  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const subForm = useForm<SubForm>({ defaultValues: emptySub, resolver: zodResolver(subcategoryFormSchema) });

  const openNewSub = () => {
    setEditingSub(null);
    subForm.reset({ ...emptySub, categoryId: categories[0]?.id ?? '' });
    setSubOpen(true);
  };
  const openEditSub = (sub: Subcategory) => {
    setEditingSub(sub);
    subForm.reset({
      categoryId: sub.categoryId,
      icon: sub.icon,
      label: sub.label,
      sortOrder: sub.sortOrder,
      value: sub.value,
    });
    setSubOpen(true);
  };

  const handleSaveSub = (values: SubForm) => {
    if (editingSub) {
      // value is immutable — never send it in update
      updateSub.mutate(
        {
          id: editingSub.id,
          payload: {
            categoryId: values.categoryId,
            icon: values.icon,
            label: values.label,
            sortOrder: values.sortOrder,
          },
        },
        {
          onError: (error: any) => toast(getErrorToastOptions(error)),
          onSuccess: () => {
            toast({ title: 'Subcategory updated' });
            setSubOpen(false);
          },
        },
      );
    }
    else {
      createSub.mutate(
        {
          categoryId: values.categoryId,
          icon: values.icon,
          label: values.label,
          sortOrder: values.sortOrder,
          value: values.value,
        },
        {
          onError: (error: any) => toast(getErrorToastOptions(error)),
          onSuccess: () => {
            toast({ title: 'Subcategory created' });
            setSubOpen(false);
          },
        },
      );
    }
  };

  const handleDeleteSub = (id: string) => {
    deleteSub.mutate(id, {
      onError: (error: any) => toast(getErrorToastOptions(error)),
      onSuccess: () => toast({ title: 'Subcategory deleted' }),
    });
  };

  const busy
    = createCat.isPending
      || updateCat.isPending
      || createSub.isPending
      || updateSub.isPending;

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
        <CardHeader className="
          flex flex-col items-start justify-between gap-3
          sm:flex-row sm:items-center
        "
        >
          <CardTitle>Categories</CardTitle>
          <Button onClick={openNewCat} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            {' '}
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0
            ? (
                <p className="text-sm text-muted-foreground">No categories yet.</p>
              )
            : (
                <div className="divide-y divide-border">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{cat.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.value}
                            {' '}
                            · order
                            {cat.sortOrder}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => openEditCat(cat)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteCat(cat.id)}
                          size="icon"
                          variant="ghost"
                          className="
                            text-destructive
                            hover:text-destructive
                          "
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
        <CardHeader className="
          flex flex-col items-start justify-between gap-3
          sm:flex-row sm:items-center
        "
        >
          <CardTitle>Subcategories</CardTitle>
          <Button
            onClick={openNewSub}
            disabled={categories.length === 0}
            size="sm"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {' '}
            Add Subcategory
          </Button>
        </CardHeader>
        <CardContent>
          {subcategories.length === 0
            ? (
                <p className="text-sm text-muted-foreground">
                  No subcategories yet.
                </p>
              )
            : (
                <div className="divide-y divide-border">
                  {subcategories.map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{sub.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.value}
                            {' '}
                            ·
                            {sub.categoryLabel}
                            {' '}
                            · order
                            {' '}
                            {sub.sortOrder}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => openEditSub(sub)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteSub(sub.id)}
                          size="icon"
                          variant="ghost"
                          className="
                            text-destructive
                            hover:text-destructive
                          "
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
        onOpenChange={(o) => {
          setCatOpen(o);
          if (!o) {
            catForm.reset(emptyCat);
            setEditingCat(null);
          }
        }}
        open={catOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCat ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={catForm.handleSubmit(handleSaveCat)} className="space-y-4">
            <div className="
              grid gap-4
              sm:grid-cols-2
            "
            >
              <div className="space-y-2">
                <Label>Label</Label>
                <Controller
                  name="label"
                  control={catForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        const value = catForm.getValues('value');
                        if (!editingCat && !value)
                          catForm.setValue('value', autoSlug(event.target.value));
                      }}
                      placeholder="e.g. Women"
                    />
                  )}
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
                <Controller
                  name="value"
                  control={catForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={event => field.onChange(event.target.value.toLowerCase())}
                      disabled={!!editingCat}
                      placeholder="e.g. women"
                    />
                  )}
                />
              </div>
            </div>
            <div className="
              grid gap-4
              sm:grid-cols-2
            "
            >
              <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <Controller name="icon" control={catForm.control} render={({ field }) => <Input {...field} placeholder="📦" />} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Controller name="sortOrder" control={catForm.control} render={({ field }) => <Input name={field.name} onBlur={field.onBlur} onChange={event => field.onChange(Math.trunc(Number(event.target.value) || 0))} ref={field.ref} value={field.value} type="number" />} />
              </div>
            </div>
            <Button
              disabled={busy}
              type="submit"
              className="mt-4 w-full"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCat ? 'Save Changes' : 'Create Category'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Subcategory Dialog ── */}
      <Dialog
        onOpenChange={(o) => {
          setSubOpen(o);
          if (!o) {
            subForm.reset(emptySub);
            setEditingSub(null);
          }
        }}
        open={subOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSub ? 'Edit Subcategory' : 'Add Subcategory'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={subForm.handleSubmit(handleSaveSub)} className="space-y-4">
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Controller
                name="categoryId"
                control={subForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="
              grid gap-4
              sm:grid-cols-2
            "
            >
              <div className="space-y-2">
                <Label>Label</Label>
                <Controller
                  name="label"
                  control={subForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        const value = subForm.getValues('value');
                        if (!editingSub && !value)
                          subForm.setValue('value', autoSlug(event.target.value));
                      }}
                      placeholder="e.g. Shoes"
                    />
                  )}
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
                <Controller
                  name="value"
                  control={subForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={event => field.onChange(event.target.value.toLowerCase())}
                      disabled={!!editingSub}
                      placeholder="e.g. shoes"
                    />
                  )}
                />
              </div>
            </div>
            <div className="
              grid gap-4
              sm:grid-cols-2
            "
            >
              <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <Controller name="icon" control={subForm.control} render={({ field }) => <Input {...field} placeholder="📦" />} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Controller name="sortOrder" control={subForm.control} render={({ field }) => <Input name={field.name} onBlur={field.onBlur} onChange={event => field.onChange(Math.trunc(Number(event.target.value) || 0))} ref={field.ref} value={field.value} type="number" />} />
              </div>
            </div>
            <Button
              disabled={busy}
              type="submit"
              className="mt-4 w-full"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSub ? 'Save Changes' : 'Create Subcategory'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CategoryManagement;
