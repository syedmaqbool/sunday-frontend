import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  getDiscountCodesOptions,
  useCreateDiscountCodeMutation,
  useDeleteDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
} from '@/queries/adminDiscountCodes.query';

const discountCodeFormSchema = z.object({
  code: z.string().trim().min(1, 'Enter a code.'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.string()
    .min(1, 'Enter a discount value.')
    .transform(Number)
    .pipe(z.number().positive('Enter a value greater than zero.'))
    .transform(String),
  maxUses: z.union([
    z.literal(''),
    z.string()
      .min(1, 'Enter a positive whole number.')
      .transform(Number)
      .pipe(z.number().int().min(1, 'Enter a positive whole number.'))
      .transform(String),
  ]),
  maxUsesPerUser: z.union([
    z.literal(''),
    z.string()
      .min(1, 'Enter a positive whole number.')
      .transform(Number)
      .pipe(z.number().int().min(1, 'Enter a positive whole number.'))
      .transform(String),
  ]),
  minOrder: z.union([
    z.literal(''),
    z.string()
      .min(1, 'Enter zero or more.')
      .transform(Number)
      .pipe(z.number().min(0, 'Enter zero or more.'))
      .transform(String),
  ]),
  expiresAt: z.union([
    z.literal(''),
    z.string().datetime({ local: true }),
  ]),
});

type DiscountCodeFormValues = z.infer<typeof discountCodeFormSchema>;

const emptyDiscountCodeForm: DiscountCodeFormValues = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maxUses: '',
  maxUsesPerUser: '',
  minOrder: '',
  expiresAt: '',
};

function DiscountCodes() {
  const { data: codes = [], isLoading } = useQuery(getDiscountCodesOptions());

  const createMutation = useCreateDiscountCodeMutation();
  const updateMutation = useUpdateDiscountCodeMutation();
  const deleteMutation = useDeleteDiscountCodeMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<DiscountCodeFormValues>({
    defaultValues: emptyDiscountCodeForm,
    resolver: zodResolver(discountCodeFormSchema),
  });

  const resetForm = () => {
    form.reset(emptyDiscountCodeForm);
  };

  const handleCreate = async (values: DiscountCodeFormValues) => {
    try {
      await createMutation.mutateAsync({
        code: values.code.toUpperCase(),
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxUses: values.maxUses ? Number(values.maxUses) : null,
        maxUsesPerUser: values.maxUsesPerUser ? Number(values.maxUsesPerUser) : null,
        minOrderAmount: values.minOrder ? Number(values.minOrder) : 0,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      });

      toast({
        title: 'Code created',
      });

      setDialogOpen(false);
      resetForm();
    }
    catch (error) {
      toast(getErrorToastOptions(error));
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({
        discountCodeId: id,
        payload: {
          active: !active,
        },
      });

      toast({
        title: 'Status updated',
      });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);

      toast({
        title: 'Code deleted',
      });
    }
    catch (error: any) {
      toast(getErrorToastOptions(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Discount Codes
          </h1>

          <p className="text-sm text-muted-foreground">
            {codes.length}
            {' '}
            total codes
          </p>
        </div>

        <Dialog
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o)
              resetForm();
          }}
          open={dialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Code
            </Button>
          </DialogTrigger>

          <DialogContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="grid gap-4 py-2">
                <DialogHeader>
                  <DialogTitle>Create Discount Code</DialogTitle>
                </DialogHeader>

                <FormField
                  name="code"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SUMMER20" className="uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="discountType"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                            <SelectItem value="FIXED">Fixed (Rs)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="discountValue"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="20" type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="maxUsesPerUser"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max uses per buyer</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Unlimited" type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="minOrder"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min order (Rs)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0" type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="maxUses"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max uses</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Unlimited" type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="expiresAt"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires at</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={createMutation.isPending} type="submit">
                  {createMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : 'Create Code'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0
        ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Tag className="mb-3 h-10 w-10 text-muted-foreground/40" />

              <p className="text-sm text-muted-foreground">No discount codes yet</p>
            </div>
          )
        : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {codes.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-semibold text-foreground">
                        {c.code}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          {c.discountType === 'PERCENTAGE'
                            ? `${c.discountValue}%`
                            : `Rs ${c.discountValue.toLocaleString()}`}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {c.minOrderAmount > 0
                          ? `Rs ${c.minOrderAmount.toLocaleString()}`
                          : '—'}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {c.currentUses}
                        {c.maxUses === null ? '' : ` / ${c.maxUses}`}
                        <div className="text-xs">
                          Per buyer:
                          {' '}
                          {c.maxUsesPerUser ?? 'Unlimited'}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>

                      <TableCell>
                        <Switch
                          onCheckedChange={() => toggleActive(c.id, c.active)}
                          checked={c.active}
                        />
                      </TableCell>

                      <TableCell>
                        <Button
                          onClick={() => deleteCode(c.id)}
                          size="icon"
                          variant="ghost"
                          className="
                            h-7 w-7 text-muted-foreground
                            hover:text-destructive
                          "
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
    </div>
  );
}

export default DiscountCodes;
