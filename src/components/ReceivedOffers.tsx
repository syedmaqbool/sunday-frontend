import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, ArrowRightLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { ReviewForm } from "@/components/ReviewForm";

interface OfferWithListing {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  counter_amount: number | null;
  status: string;
  message: string;
  seller_message: string;
  created_at: string;
  updated_at: string;
  listings: { title: string; price: number; images: string[]; brand: string } | null;
  buyer_profile?: { full_name: string | null } | null;
}

const statusBadge = (s: string) => {
  const map: Record<string, "default" | "secondary" | "destructive"> = {
    pending: "secondary",
    accepted: "default",
    rejected: "destructive",
    countered: "secondary",
    withdrawn: "destructive",
    expired: "destructive",
  };
  return map[s] ?? "secondary";
};

interface ReceivedOffersProps {
  listingId?: string;
}

export const ReceivedOffers = ({ listingId }: ReceivedOffersProps = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [counterDialog, setCounterDialog] = useState<OfferWithListing | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [reviewingOffer, setReviewingOffer] = useState<string | null>(null);

  const { data: received = [], isLoading } = useQuery({
    queryKey: ["offers-received", user?.id, listingId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("offers")
        .select("*, listings(title, price, images, brand)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (listingId) query = query.eq("listing_id", listingId);
      const { data, error } = await query;
      if (error) throw error;
      const buyerIds = [...new Set((data ?? []).map((o: any) => o.buyer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", buyerIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((o: any) => ({
        ...o,
        buyer_profile: profileMap.get(o.buyer_id) ?? null,
      })) as OfferWithListing[];
    },
    enabled: !!user,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ["reviews", "mine", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("offer_id")
        .eq("reviewer_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.offer_id as string);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("offers-received-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["offers-received"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const respondToOffer = useMutation({
    mutationFn: async ({
      id,
      status,
      counter_amount,
      seller_message,
    }: {
      id: string;
      status: string;
      counter_amount?: number;
      seller_message?: string;
    }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (counter_amount) update.counter_amount = counter_amount;
      if (seller_message) update.seller_message = seller_message;
      const { error } = await supabase.from("offers").update(update).eq("id", id);
      if (error) throw error;

      if (status === "accepted") {
        const offer = received.find((o) => o.id === id);
        if (offer) {
          await supabase.from("conversations").insert({
            offer_id: offer.id,
            listing_id: offer.listing_id,
            buyer_id: offer.buyer_id,
            seller_id: offer.seller_id,
          });
          await supabase.from("listings").update({ status: "sold" }).eq("id", offer.listing_id);
        }
      }
    },
    onSuccess: (_, { status }) => {
      toast.success(`Offer ${status}`);
      if (status === "accepted") {
        toast.info("Listing reserved for the buyer for 6 hours. They have until then to complete the purchase.");
      }
      queryClient.invalidateQueries({ queryKey: ["offers-received"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setCounterDialog(null);
      setCounterAmount("");
      setCounterMessage("");
    },
    onError: () => toast.error("Failed to update offer"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (received.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">No offers received yet</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {received.map((offer) => (
          <Card key={offer.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <img
                src={offer.listings?.images?.[0] || "/placeholder.svg"}
                alt=""
                className="h-16 w-16 rounded-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {offer.listings?.title ?? "Listing"}
                  </h3>
                  <Badge variant={statusBadge(offer.status)}>{offer.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  From {offer.buyer_profile?.full_name || "Buyer"} · Listed R{" "}
                  {offer.listings?.price?.toLocaleString()}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  Offer: R {offer.amount.toLocaleString()}
                </p>
                {offer.message && (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">"{offer.message}"</p>
                )}
                {offer.counter_amount && (
                  <p className="text-xs text-muted-foreground">
                    Your counter: R {offer.counter_amount.toLocaleString()}
                  </p>
                )}
              </div>
              {offer.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => respondToOffer.mutate({ id: offer.id, status: "accepted" })}
                    disabled={respondToOffer.isPending}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setCounterDialog(offer)}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Counter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive"
                    onClick={() => respondToOffer.mutate({ id: offer.id, status: "rejected" })}
                    disabled={respondToOffer.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
              {offer.status === "accepted" &&
                !myReviews.includes(offer.id) &&
                (reviewingOffer === offer.id ? (
                  <div className="mt-3 w-full border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium text-foreground">Rate this buyer</p>
                    <ReviewForm
                      offerId={offer.id}
                      listingId={offer.listing_id}
                      reviewedId={offer.buyer_id}
                      role="seller"
                      onSuccess={() => setReviewingOffer(null)}
                    />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={() => setReviewingOffer(offer.id)}
                  >
                    <Star className="h-3.5 w-3.5" /> Leave Review
                  </Button>
                ))}
              {offer.status === "accepted" && myReviews.includes(offer.id) && (
                <span className="text-xs text-muted-foreground italic">✓ Reviewed</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!counterDialog} onOpenChange={(open) => !open && setCounterDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Counter Offer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {counterDialog?.listings?.title} · Offered R{" "}
              {counterDialog?.amount.toLocaleString()}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your counter price (ZAR)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder={`e.g. ${counterDialog?.listings?.price}`}
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="e.g. I can do this price if you're still interested"
                rows={2}
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                maxLength={500}
              />
            </div>
            <Button
              className="w-full"
              disabled={
                !counterAmount || parseFloat(counterAmount) <= 0 || respondToOffer.isPending
              }
              onClick={() =>
                counterDialog &&
                respondToOffer.mutate({
                  id: counterDialog.id,
                  status: "countered",
                  counter_amount: parseFloat(counterAmount),
                  seller_message: counterMessage,
                })
              }
            >
              {respondToOffer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Counter Offer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReceivedOffers;
