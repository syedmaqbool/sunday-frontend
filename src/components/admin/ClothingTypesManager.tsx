import type { ClothingType } from '@/types/adminCategory.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastOptions } from '@/lib/errorToast';
import {
  getAdminClothingTypesOptions,
  useCreateClothingTypeMutation,
  useDeleteClothingTypeMutation,
  useUpdateClothingTypeMutation,
} from '@/queries/categoryManagement.query';

const createClothingTypeSchema = z.object({
  label: z.string().trim().min(1, 'Label is required.'),
});
const editClothingTypeSchema = createClothingTypeSchema.extend({
  sortOrder: z.number().int().min(0),
});

type CreateClothingTypeForm = z.infer<typeof createClothingTypeSchema>;
type EditClothingTypeForm = z.infer<typeof editClothingTypeSchema>;

async function getDeleteErrorToastOptions(error: unknown) {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.clone().json() as { message?: unknown };
      if (typeof body.message === 'string' && body.message.trim()) {
        return {
          description: body.message,
          title: `Error ${error.response.status}`,
          variant: 'destructive' as const,
        };
      }
    }
    catch {
      // Fall through to the standard error message when the response is not JSON.
    }
  }

  return getErrorToastOptions(error, 'This clothing type is still used by a listing.');
}

function ClothingTypeRow({
  clothingType,
  isDeleting,
  isSaving,
  onDelete,
  onSave,
}: {
  clothingType: ClothingType;
  isDeleting: boolean;
  isSaving: boolean;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, values: EditClothingTypeForm) => Promise<void>;
}) {
  const form = useForm<EditClothingTypeForm>({
    defaultValues: {
      label: clothingType.label,
      sortOrder: clothingType.sortOrder,
    },
    resolver: zodResolver(editClothingTypeSchema),
  });

  const save = form.handleSubmit(async (values) => {
    try {
      await onSave(clothingType.id, values);
      form.reset(values);
    }
    catch {
      // Keep the row draft available for retry or cancel after an API error.
    }
  });

  return (
    <form onSubmit={save} className="flex items-center gap-2 rounded-md border border-border p-2">
      <Controller
        name="sortOrder"
        control={form.control}
        render={({ field }) => (
          <Input
            name={field.name}
            onBlur={field.onBlur}
            onChange={event => field.onChange(Number(event.target.value))}
            ref={field.ref}
            value={field.value}
            aria-label={`Sort order for ${clothingType.label}`}
            disabled={isSaving}
            type="number"
            className="w-20"
          />
        )}
      />
      <Controller
        name="label"
        control={form.control}
        render={({ field }) => (
          <Input
            {...field}
            aria-label={`Clothing type label ${clothingType.label}`}
            disabled={isSaving}
          />
        )}
      />
      <Button
        aria-label={`Save ${clothingType.label}`}
        disabled={!form.formState.isDirty || isSaving}
        size="icon"
        type="submit"
        variant="ghost"
      >
        <Save className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => void onDelete(clothingType.id)}
        aria-label={`Delete ${clothingType.label}`}
        disabled={isDeleting}
        size="icon"
        type="button"
        variant="ghost"
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}

export default function ClothingTypesManager() {
  const { toast } = useToast();
  const { data: clothingTypePages = [] } = useQuery(getAdminClothingTypesOptions());
  const createClothingType = useCreateClothingTypeMutation();
  const updateClothingType = useUpdateClothingTypeMutation();
  const deleteClothingType = useDeleteClothingTypeMutation();
  const createForm = useForm<CreateClothingTypeForm>({
    defaultValues: { label: '' },
    resolver: zodResolver(createClothingTypeSchema),
  });
  const clothingTypes = clothingTypePages
    .flatMap(page => page.data)
    .toSorted((first, second) => first.sortOrder - second.sortOrder);

  const addClothingType = createForm.handleSubmit(async ({ label }) => {
    try {
      await createClothingType.mutateAsync({ label });
      createForm.reset({ label: '' });
      toast({ title: 'Clothing type created' });
    }
    catch (error) {
      toast(getErrorToastOptions(error));
    }
  });

  const saveClothingType = async (id: string, values: EditClothingTypeForm) => {
    try {
      await updateClothingType.mutateAsync({
        id,
        payload: { label: values.label.trim(), sortOrder: values.sortOrder },
      });
      toast({ title: 'Clothing type updated' });
    }
    catch (error) {
      toast(getErrorToastOptions(error));
      throw error;
    }
  };

  const removeClothingType = async (id: string) => {
    try {
      await deleteClothingType.mutateAsync(id);
      toast({ title: 'Clothing type deleted' });
    }
    catch (error) {
      toast(await getDeleteErrorToastOptions(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clothing types (shown when type is Clothes)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={addClothingType} className="flex gap-2">
          <Controller
            name="label"
            control={createForm.control}
            render={({ field }) => (
              <Input
                {...field}
                aria-label="New clothing type"
                disabled={createClothingType.isPending}
                placeholder="e.g. Tops"
              />
            )}
          />
          <Button
            disabled={!createForm.watch('label').trim() || createClothingType.isPending}
            type="submit"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {' '}
            Add
          </Button>
        </form>
        {clothingTypes.map(clothingType => (
          <ClothingTypeRow
            key={clothingType.id}
            onDelete={removeClothingType}
            onSave={saveClothingType}
            clothingType={clothingType}
            isDeleting={deleteClothingType.isPending}
            isSaving={updateClothingType.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
}
