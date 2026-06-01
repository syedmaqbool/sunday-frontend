import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { ComplaintDetailsView } from "@/components/ComplaintDetailsView";

export function SellerComplaintBadge({
  orderId,
  listingId,
}: {
  orderId: string;
  listingId: string;
}) {
  const queryClient = useQueryClient();
  const [addressOpen, setAddressOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const { data: complaint, refetch } = useQuery({
    queryKey: ["complaint", orderId, listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select(
          "id, status, reason, evidence_urls, return_proof_urls, return_carrier, return_tracking, admin_notes, created_at, return_to_name, return_to_address, return_to_city, return_to_postal, return_to_phone, return_to_notes",
        )
        .eq("order_id", orderId)
        .eq("listing_id", listingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Prefill form when dialog opens with any existing address values
  useEffect(() => {
    if (addressOpen && complaint) {
      setName((complaint as any).return_to_name ?? "");
      setAddress((complaint as any).return_to_address ?? "");
      setCity((complaint as any).return_to_city ?? "");
      setPostal((complaint as any).return_to_postal ?? "");
      setPhone((complaint as any).return_to_phone ?? "");
      setNotes((complaint as any).return_to_notes ?? "");
    }
  }, [addressOpen, complaint]);

  if (!complaint) return null;

  const saveAddress = async () => {
    if (!address.trim() || !city.trim() || !name.trim()) {
      toast.error("Recipient name, address and city are required");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          return_to_name: name.trim(),
          return_to_address: address.trim(),
          return_to_city: city.trim(),
          return_to_postal: postal.trim() || null,
          return_to_phone: phone.trim() || null,
          return_to_notes: notes.trim() || null,
          return_address_provided_at: new Date().toISOString(),
          status: "return_address_provided",
        })
        .eq("id", (complaint as any).id);
      if (error) throw error;
      toast.success("Return address shared with the buyer.");
      setAddressOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["sold-orders"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save return address");
    } finally {
      setBusy(false);
    }
  };

  const markReturnReceived = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: "return_received" })
        .eq("id", (complaint as any).id);
      if (error) throw error;
      toast.success("Marked return as received. Admin will finalize the refund.");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["sold-orders"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const status = (complaint as any).status as string;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ComplaintDetailsView complaint={complaint as any} viewerRole="seller" />

      {status === "return_approved" && (
        <Button
          size="sm"
          variant="default"
          className="h-7 gap-1 text-xs"
          onClick={() => setAddressOpen(true)}
        >
          <MapPin className="h-3 w-3" />
          Provide return address
        </Button>
      )}

      {status === "return_address_provided" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => setAddressOpen(true)}
        >
          <MapPin className="h-3 w-3" />
          Edit return address
        </Button>
      )}

      {status === "return_in_transit" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          disabled={busy}
          onClick={markReturnReceived}
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
          Mark return received
        </Button>
      )}

      <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <MapPin className="h-5 w-5" /> Return shipping address
            </DialogTitle>
            <DialogDescription>
              Provide the address where the buyer should ship the return. The buyer will see this immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ret-name">Recipient name *</Label>
              <Input id="ret-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="ret-address">Street address *</Label>
              <Input id="ret-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="ret-city">City *</Label>
                <Input id="ret-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
              </div>
              <div>
                <Label htmlFor="ret-postal">Postal code</Label>
                <Input id="ret-postal" value={postal} onChange={(e) => setPostal(e.target.value)} maxLength={20} />
              </div>
            </div>
            <div>
              <Label htmlFor="ret-phone">Phone</Label>
              <Input id="ret-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
            <div>
              <Label htmlFor="ret-notes">Instructions for the buyer (optional)</Label>
              <Textarea
                id="ret-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
                placeholder="e.g. Please use a tracked courier and message me the tracking number."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddressOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={saveAddress} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Share with buyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
