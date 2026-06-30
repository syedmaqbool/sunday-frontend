import type { Brand } from '@/types/brand.type';
import { useQuery } from '@tanstack/react-query';

import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import {
  getBrandsQueryOptions,
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from '@/queries/adminBrands.query';

interface BrandForm {
  active: boolean;
  name: string;
  sort_order: number;
}

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

  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      brands.filter((b: Brand) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [brands, search],
  );

  const handleSave = async () => {
    if (!form.name.trim())
      return;

    setBusy(true);

    try {
      if (editingId) {
        await updateBrand.mutateAsync({
          brandId: editingId,
          payload: {
            active: form.active,
            name: form.name,
            sortOrder: form.sort_order,
          },
        });

        toast({
          title: 'Brand updated',
        });
      }
      else {
        await createBrand.mutateAsync({
          active: form.active,
          name: form.name,
          sortOrder: form.sort_order,
        });

        toast({
          title: 'Brand created',
        });
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    }
    catch (error: any) {
      toast({
        description: error.message,
        title: 'Error',
        variant: 'destructive',
      });
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
      toast({
        description: error.message,
        title: 'Error',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (b: Brand) => {
    setForm({
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
                setForm(emptyForm);
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    onChange={event =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })}
                    value={form.name}
                    placeholder="e.g. Nike"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    onChange={event =>
                      setForm({
                        ...form,
                        sort_order: parseInt(event.target.value) || 0,
                      })}
                    value={form.sort_order}
                    type="number"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    onCheckedChange={v =>
                      setForm({
                        ...form,
                        active: v,
                      })}
                    checked={form.active}
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={busy}
                className="mt-4 w-full"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                {editingId ? 'Save Changes' : 'Create Brand'}
              </Button>
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
