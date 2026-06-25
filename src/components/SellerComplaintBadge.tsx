import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, PackageCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { supabase } from '@/integrations/supabase/client';
import { getComplaintDetailsOptions } from '@/queries/useComplaint';

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
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postal, setPostal] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const { data: complaint, refetch } = useQuery(
    getComplaintDetailsOptions(orderId, orderItemId),
  );

  // Prefill form when dialog opens with any existing address values
  useEffect(() => {
    if (!(addressOpen && complaint)) {
      return;
    }

    setName(complaint.returnAddressRecipient ?? '');
    setAddress(complaint.returnAddress ?? '');
    setCity('');
    setPostal('');
    setPhone(complaint.returnAddressPhone ?? '');
    setNotes(complaint.returnInstructions ?? '');
  }, [addressOpen, complaint]);

  if (!complaint)
    return null;

  const saveAddress = async () => {
    if (!address.trim() || !city.trim() || !name.trim()) {
      toast.error('Recipient name, address and city are required');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          return_address_provided_at: new Date().toISOString(),
          return_to_address: address.trim(),
          return_to_city: city.trim(),
          return_to_name: name.trim(),
          return_to_notes: notes.trim() || null,
          return_to_phone: phone.trim() || null,
          return_to_postal: postal.trim() || null,
          status: 'return_address_provided',
        })
        .eq('id', (complaint as any).id);
      if (error)
        throw error;
      toast.success('Return address shared with the buyer.');
      setAddressOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['sold-orders'] });
    }
    catch (error: any) {
      toast.error(error.message ?? 'Failed to save return address');
    }
    finally {
      setBusy(false);
    }
  };

  const markReturnReceived = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: 'return_received' })
        .eq('id', (complaint as any).id);
      if (error)
        throw error;
      toast.success(
        'Marked return as received. Admin will finalize the refund.',
      );
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['sold-orders'] });
    }
    catch (error: any) {
      toast.error(error.message ?? 'Failed to update status');
    }
    finally {
      setBusy(false);
    }
  };

  const status = complaint.status;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ComplaintDetailsView complaint={complaint as any} viewerRole="seller" />

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
          <div className="space-y-3">
            <div>
              <Label htmlFor="ret-name">Recipient name *</Label>
              <Input
                id="ret-name"
                onChange={event => setName(event.target.value)}
                value={name}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="ret-address">Street address *</Label>
              <Input
                id="ret-address"
                onChange={event => setAddress(event.target.value)}
                value={address}
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="ret-city">City *</Label>
                <Input
                  id="ret-city"
                  onChange={event => setCity(event.target.value)}
                  value={city}
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="ret-postal">Postal code</Label>
                <Input
                  id="ret-postal"
                  onChange={event => setPostal(event.target.value)}
                  value={postal}
                  maxLength={20}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ret-phone">Phone</Label>
              <Input
                id="ret-phone"
                onChange={event => setPhone(event.target.value)}
                value={phone}
                maxLength={30}
              />
            </div>
            <div>
              <Label htmlFor="ret-notes">
                Instructions for the buyer (optional)
              </Label>
              <Textarea
                id="ret-notes"
                onChange={event => setNotes(event.target.value)}
                value={notes}
                maxLength={300}
                placeholder="e.g. Please use a tracked courier and message me the tracking number."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setAddressOpen(false)}
              disabled={busy}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button onClick={saveAddress} disabled={busy}>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
