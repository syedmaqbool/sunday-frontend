import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, PackageCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ComplaintDetailsView } from '@/components/ComplaintDetailsView';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showErrorToast } from '@/lib/errorToast';
import { getComplaintDetailsOptions } from '@/queries/complaint.query';
import { myOrdersQueryKey } from '@/queries/myOrders.query';
import {
  markComplaintReturnReceived,
  provideReturnAddress,
} from '@/services/complaints.service';

const returnAddressSchema = z.object({
  address: z.string().trim().min(1, 'Street address is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  name: z.string().trim().min(1, 'Recipient name is required.'),
  notes: z.string(),
  phone: z.string(),
  postal: z.string(),
});

type ReturnAddressFormValues = z.infer<typeof returnAddressSchema>;

const emptyReturnAddressForm: ReturnAddressFormValues = { address: '', city: '', name: '', notes: '', phone: '', postal: '' };

export function SellerComplaintBadge({
  orderId,
  orderItemId,
}: {
  orderId: string;
  orderItemId: string;
}) {
  const queryClient = useQueryClient();
  const [addressOpen, setAddressOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const form = useForm<ReturnAddressFormValues>({ defaultValues: emptyReturnAddressForm, resolver: zodResolver(returnAddressSchema) });

  const { data: complaint, refetch } = useQuery(getComplaintDetailsOptions(orderId, orderItemId));

  // Prefill form when dialog opens with any existing address values
  useEffect(() => {
    if (!(addressOpen && complaint)) {
      return;
    }

    form.reset({
      address: complaint.returnAddress ?? '',
      city: complaint.returnAddressCity ?? '',
      name: complaint.returnAddressRecipient ?? '',
      notes: complaint.returnInstructions ?? '',
      phone: complaint.returnAddressPhone ?? '',
      postal: complaint.returnAddressPostal ?? '',
    });
  }, [addressOpen, complaint, form]);

  if (!complaint)
    return null;

  const saveAddress = async (values: ReturnAddressFormValues) => {
    setBusy(true);
    try {
      await provideReturnAddress(complaint.id, {
        returnAddress: values.address,
        returnAddressCity: values.city || undefined,
        returnAddressPhone: values.phone.trim() || undefined,
        returnAddressPostal: values.postal.trim() || undefined,
        returnAddressRecipient: values.name,
        returnInstructions: values.notes.trim() || undefined,
      });
      toast.success('Return address shared with the buyer.');
      setAddressOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.sales() });
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to save return address');
    }
    finally {
      setBusy(false);
    }
  };

  const markReturnReceived = async () => {
    setBusy(true);
    try {
      await markComplaintReturnReceived(complaint.id);
      toast.success(
        'Marked return as received. Admin will finalize the refund.',
      );
      await refetch();
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.sales() });
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to update status');
    }
    finally {
      setBusy(false);
    }
  };

  const status = complaint.status;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ComplaintDetailsView complaint={complaint} viewerRole="seller" />

      {status === 'RETURN_APPROVED' && (
        <Button
          onClick={() => setAddressOpen(true)}
          size="sm"
          variant="default"
          className="h-7 gap-1 text-xs"
        >
          <MapPin className="h-3 w-3" />
          Provide return address
        </Button>
      )}

      {status === 'RETURN_ADDRESS_PROVIDED' && (
        <Button
          onClick={() => setAddressOpen(true)}
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
        >
          <MapPin className="h-3 w-3" />
          Edit return address
        </Button>
      )}

      {status === 'RETURN_IN_TRANSIT' && (
        <Button
          onClick={markReturnReceived}
          disabled={busy}
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
        >
          {busy
            ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              )
            : (
                <PackageCheck className="h-3 w-3" />
              )}
          Mark return received
        </Button>
      )}

      <Dialog onOpenChange={setAddressOpen} open={addressOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <MapPin className="h-5 w-5" />
              {' '}
              Return shipping address
            </DialogTitle>
            <DialogDescription>
              Provide the address where the buyer should ship the return. The
              buyer will see this immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(saveAddress, errors => toast.error(Object.values(errors)[0]?.message ?? 'Check the return address.'))} className="space-y-3">
            <div>
              <Label htmlFor="ret-name">Recipient name *</Label>
              <Controller name="name" control={form.control} render={({ field }) => <Input {...field} id="ret-name" maxLength={100} />} />
            </div>
            <div>
              <Label htmlFor="ret-address">Street address *</Label>
              <Controller name="address" control={form.control} render={({ field }) => <Input {...field} id="ret-address" maxLength={200} />} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="ret-city">City *</Label>
                <Controller name="city" control={form.control} render={({ field }) => <Input {...field} id="ret-city" maxLength={80} />} />
              </div>
              <div>
                <Label htmlFor="ret-postal">Postal code</Label>
                <Controller name="postal" control={form.control} render={({ field }) => <Input {...field} id="ret-postal" maxLength={20} />} />
              </div>
            </div>
            <div>
              <Label htmlFor="ret-phone">Phone</Label>
              <Controller name="phone" control={form.control} render={({ field }) => <Input {...field} id="ret-phone" maxLength={30} />} />
            </div>
            <div>
              <Label htmlFor="ret-notes">
                Instructions for the buyer (optional)
              </Label>
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="ret-notes"
                    maxLength={300}
                    placeholder="e.g. Please use a tracked courier and message me the tracking number."
                    rows={2}
                  />
                )}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => setAddressOpen(false)}
                disabled={busy}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={busy} type="submit">
                {busy
                  ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )
                  : (
                      <MapPin className="mr-2 h-4 w-4" />
                    )}
                Share with buyer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
