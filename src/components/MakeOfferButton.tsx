import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Offer {
  id: string;
  amount: number;
  counter_amount: number | null;
  status: string;
  message: string;
  seller_message: string;
  created_at: string;
  updated_at: string;
}

interface MakeOfferProps {
  listingId: string;
  sellerId: string;
  listingPrice: number;
  listingTitle: string;
}

export const MakeOfferButton = ({ listingId, sellerId, listingPrice, listingTitle }: MakeOfferProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // Fetch existing offers from this buyer on this listing
  const { data: existingOffers = [] } = useQuery({
    queryKey: ["my-offers", listingId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("listing_id", listingId)
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Offer[];
    },
    enabled: !!user,
  });

  const submitOffer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("offers").insert({
        listing_id: listingId,
        buyer_id: user!.id,
        seller_id: sellerId,
        amount: parseFloat(amount),
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offer sent!");
      queryClient.invalidateQueries({ queryKey: ["my-offers", listingId] });
      setAmount("");
      setMessage("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const acceptCounter = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from("offers")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Counter-offer accepted!");
      queryClient.invalidateQueries({ queryKey: ["my-offers", listingId] });
    },
  });

  const withdrawOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from("offers")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offer withdrawn");
      queryClient.invalidateQueries({ queryKey: ["my-offers", listingId] });
    },
  });

  if (!user) return null;

  const activeOffer = existingOffers.find((o) => o.status === "pending" || o.status === "countered");

  const statusBadge = (s: string) => {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      countered: "secondary",
      withdrawn: "destructive",
    };
    return map[s] ?? "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <MessageSquare className="h-4 w-4" /> Make Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {activeOffer ? "Your Offer" : "Make an Offer"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {listingTitle} · Listed at R {listingPrice.toLocaleString()}
          </p>
        </DialogHeader>

        {/* Show existing offers */}
        {existingOffers.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {existingOffers.map((offer) => (
              <div key={offer.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      R {offer.amount.toLocaleString()}
                    </span>
                    <Badge variant={statusBadge(offer.status)}>{offer.status}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(offer.created_at), "MMM d")}
                  </span>
                </div>
                {offer.message && (
                  <p className="mt-1 text-xs text-muted-foreground">{offer.message}</p>
                )}
                {offer.status === "countered" && offer.counter_amount && (
                  <div className="mt-2 rounded-md bg-muted p-2">
                    <p className="text-xs font-medium text-foreground">
                      Counter: R {offer.counter_amount.toLocaleString()}
                    </p>
                    {offer.seller_message && (
                      <p className="text-xs text-muted-foreground">{offer.seller_message}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptCounter.mutate(offer.id)}
                        disabled={acceptCounter.isPending}
                      >
                        Accept R {offer.counter_amount.toLocaleString()}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => withdrawOffer.mutate(offer.id)}
                        disabled={withdrawOffer.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
                {offer.status === "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 text-xs text-destructive"
                    onClick={() => withdrawOffer.mutate(offer.id)}
                    disabled={withdrawOffer.isPending}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New offer form - show if no active offer */}
        {!activeOffer && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-amount">Your offer (ZAR)</Label>
              <Input
                id="offer-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder={`e.g. ${Math.round(listingPrice * 0.8)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-message">Message (optional)</Label>
              <Textarea
                id="offer-message"
                placeholder="e.g. Would you consider this? I can pay immediately."
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
              />
            </div>
            <Button
              className="w-full"
              disabled={!amount || parseFloat(amount) <= 0 || submitOffer.isPending}
              onClick={() => submitOffer.mutate()}
            >
              {submitOffer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Offer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
