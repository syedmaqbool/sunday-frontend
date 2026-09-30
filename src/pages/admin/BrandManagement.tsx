import type { Brand } from '@/types/brand.type';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastOptions } from '@/lib/errorToast';
import {
  getBrandsQueryOptions,
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from '@/queries/adminBrands.query';

const brandFormSchema = z.object({
  active: z.boolean(),
  name: z.string().trim().min(1, 'Name is required'),
  sort_order: z.number().int().min(0),
});

type BrandForm = z.infer<typeof brandFormSchema>;

const emptyForm: BrandForm = {
  active: true,
  name: '',
  sort_order: 0,
};

function BrandManagement() {
  const { data: brands = [], isLoading } = useQuery(getBrandsQueryOptions());

  const createBrand = useCreateBrandMutation();
  const updateBrand = useUpdateBrandMutation();
  const deleteBrand = useDeleteBrandMutation();

  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const form = useForm<BrandForm>({
    defaultValues: emptyForm,
    resolver: zodResolver(brandFormSchema),
  });

  const filtered = useMemo(
    () =>
      brands.filter((b: Brand) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [brands, search],
  );

  const handleSave = async (values: BrandForm) => {
    setBusy(true);

    try {
      if (editingId) {
        await updateBrand.mutateAsync({
          brandId: editingId,
          payload: {
            active: values.active,
            name: values.name,
            sortOrder: values.sort_order,
          },
        });

        toast({
          title: 'Brand updated',
        });
      }
      else {
        await createBrand.mutateAsync({
          active: values.active,
          name: values.name,
          sortOrder: values.sort_order,
        });

        toast({
          title: 'Brand created',
        });
      }

      setDialogOpen(false);
      form.reset(emptyForm);
      setEditingId(null);
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }

    setBusy(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBrand.mutateAsync(id);

      toast({
        title: 'Brand deleted',
      });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
  };

  const openEdit = (b: Brand) => {
    form.reset({
      active: b.active,
      name: b.name,
      sort_order: b.sortOrder,
    });

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
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Brand Management
      </h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Brands</CardTitle>

          <Dialog
            onOpenChange={(o) => {
              setDialogOpen(o);

              if (!o) {
                form.reset(emptyForm);
                setEditingId(null);
              }
            }}
            open={dialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Brand
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Brand' : 'Add Brand'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Controller name="name" control={form.control} render={({ field }) => <Input {...field} placeholder="e.g. Nike" />} />
                  {form.formState.errors.name?.message && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Controller
                    name="sort_order"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={event => field.onChange(Math.trunc(Number(event.target.value) || 0))}
                        ref={field.ref}
                        value={field.value}
                        type="number"
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Controller
                    name="active"
                    control={form.control}
                    render={({ field }) => <Switch onCheckedChange={field.onChange} checked={field.value} />}
                  />
                </div>

                <Button
                  disabled={busy}
                  type="submit"
                  className="mt-4 w-full"
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                  {editingId ? 'Save Changes' : 'Create Brand'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              onChange={event => setSearch(event.target.value)}
              value={search}
              placeholder="Search brands..."
              className="pl-9"
            />
          </div>

          {filtered.length === 0
            ? (
                <p className="text-sm text-muted-foreground">No brands found.</p>
              )
            : (
                <div className="divide-y divide-border">
                  {filtered.map(b => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{b.name}</p>

                        <p className="text-xs text-muted-foreground">
                          order
                          {' '}
                          {b.sortOrder}
                          {' '}
                          ·
                          {' '}
                          {b.active ? 'active' : 'inactive'}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          onClick={() => openEdit(b)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          onClick={() => handleDelete(b.id)}
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
    </div>
  );
}

export default BrandManagement;
