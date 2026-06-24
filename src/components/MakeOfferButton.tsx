import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { trackEvent } from "@/lib/analytics";
//  Mock config  import
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

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

export const MakeOfferButton = ({
  listingId,
  sellerId,
  listingPrice,
  listingTitle,
}: MakeOfferProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  //  Local State to manage live session mock offers mock lifecycle
  const [localMockOffers, setLocalMockOffers] = useState<Offer[]>([
    {
      id: "mock-offer-init-1",
      amount: Math.round(listingPrice * 0.75),
      counter_amount: Math.round(listingPrice * 0.9),
      status: "countered",
      message: "Is this price negotiable?",
      seller_message: "Can do slightly lower but not that much. Let me know!",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  // Fetch existing offers from this buyer on this listing
  const { data: existingOffers = [] } = useQuery({
    queryKey: ["my-offers", listingId, user?.id],
    queryFn: async () => {
      //  Mock Data Interception
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return localMockOffers;
      }

      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("listing_id", listingId)
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Offer[];
    },
    enabled: !!user || NEXT_PUBLIC_USE_MOCK_DATA,
  });

  const submitOffer = useMutation({
    mutationFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        // Mocking mutation delay
        await new Promise((resolve) => setTimeout(resolve, 600));
        const newOffer: Offer = {
          id: `mock-offer-${Date.now()}`,
          amount: parseFloat(amount),
          counter_amount: null,
          status: "pending",
          message,
          seller_message: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setLocalMockOffers((prev) => [newOffer, ...prev]);
        return;
      }

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
      trackEvent("make_offer", {
        listing_id: listingId,
        listing_title: listingTitle,
        offer_amount: parseFloat(amount),
        listing_price: listingPrice,
      });
      toast.success("Offer sent!");
      queryClient.invalidateQueries({ queryKey: ["my-offers", listingId] });
      setAmount("");
      setMessage("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const acceptCounter = useMutation({
    mutationFn: async (offerId: string) => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLocalMockOffers((prev) =>
          prev.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  status: "accepted",
                  updated_at: new Date().toISOString(),
                }
              : o,
          ),
        );
        return;
      }

      const { error } = await supabase
        .from("offers")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", offerId);
      if (error) throw error;

      await supabase.from("conversations").insert({
        offer_id: offerId,
        listing_id: listingId,
        buyer_id: user!.id,
        seller_id: sellerId,
      });
    },
    onSuccess: () => {
      toast.success(
        "Counter-offer accepted! Check your Messages to chat with the seller.",
      );
      queryClient.invalidateQueries({ queryKey: ["my-offers", listingId] });
    },
  });

  const withdrawOffer = useMutation({
    mutationFn: async (offerId: string) => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setLocalMockOffers((prev) =>
          prev.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  status: "withdrawn",
                  updated_at: new Date().toISOString(),
                }
              : o,
          ),
        );
        return;
      }

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

  // Agar mock data active ho toh auth check bypass ho jaye
  if (!user && !NEXT_PUBLIC_USE_MOCK_DATA) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full sm:w-auto gap-2"
        onClick={() => navigate("/auth")}
      >
        <MessageSquare className="h-4 w-4" /> Make Offer
      </Button>
    );
  }

  const activeOffer = existingOffers.find(
    (o) => o.status === "pending" || o.status === "countered",
  );

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
        <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
          <MessageSquare className="h-4 w-4" /> Make Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {activeOffer ? "Your Offer" : "Make an Offer"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {listingTitle} · Listed at Rs {listingPrice.toLocaleString()}
          </p>
        </DialogHeader>

        {existingOffers.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-y-auto my-2 pr-1">
            {existingOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-lg border border-border p-3 bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Rs {offer.amount.toLocaleString()}
                    </span>
                    <Badge variant={statusBadge(offer.status)}>
                      {offer.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(offer.created_at), "MMM d")}
                  </span>
                </div>
                {offer.message && (
                  <p className="mt-1 text-xs text-muted-foreground bg-muted/40 p-1.5 rounded">
                    {offer.message}
                  </p>
                )}
                {offer.status === "countered" && offer.counter_amount && (
                  <div className="mt-2 rounded-md bg-muted p-2 border border-border/60">
                    <p className="text-xs font-semibold text-foreground">
                      Counter: Rs {offer.counter_amount.toLocaleString()}
                    </p>
                    {offer.seller_message && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        "{offer.seller_message}"
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => acceptCounter.mutate(offer.id)}
                        disabled={acceptCounter.isPending}
                      >
                        Accept Rs {offer.counter_amount.toLocaleString()}
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
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
                    className="mt-2 h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
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

        {!activeOffer && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="offer-amount">Your offer (PKR)</Label>
              <Input
                id="offer-amount"
                type="number"
                min="1"
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
              disabled={
                !amount || parseFloat(amount) <= 0 || submitOffer.isPending
              }
              onClick={() => submitOffer.mutate()}
            >
              {submitOffer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Offer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
