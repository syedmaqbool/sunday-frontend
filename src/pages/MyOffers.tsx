import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, MessageSquare, Loader2, ArrowRightLeft, Inbox } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
  listings: {
    title: string;
    price: number;
    images: string[];
    brand: string;
  } | null;
  // buyer profile
  buyer_profile?: { full_name: string | null } | null;
}

const MyOffers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [counterDialog, setCounterDialog] = useState<OfferWithListing | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Offers received (as seller)
  const { data: received = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["offers-received", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, listings(title, price, images, brand)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // fetch buyer profiles
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

  // Offers sent (as buyer)
  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ["offers-sent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, listings(title, price, images, brand)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OfferWithListing[];
    },
    enabled: !!user,
  });

  // Realtime subscription for offers
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("offers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["offers-received"] });
        queryClient.invalidateQueries({ queryKey: ["offers-sent"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const respondToOffer = useMutation({
    mutationFn: async ({ id, status, counter_amount, seller_message }: { id: string; status: string; counter_amount?: number; seller_message?: string }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (counter_amount) update.counter_amount = counter_amount;
      if (seller_message) update.seller_message = seller_message;
      const { error } = await supabase.from("offers").update(update).eq("id", id);
      if (error) throw error;

      // Create conversation on acceptance
      if (status === "accepted") {
        const offer = received.find((o) => o.id === id);
        if (offer) {
          await supabase.from("conversations").insert({
            offer_id: offer.id,
            listing_id: offer.listing_id,
            buyer_id: offer.buyer_id,
            seller_id: offer.seller_id,
          });
        }
      }
    },
    onSuccess: (_, { status }) => {
      toast.success(`Offer ${status}`);
      if (status === "accepted") {
        toast.info("A conversation has been started — check your Messages!");
      }
      queryClient.invalidateQueries({ queryKey: ["offers-received"] });
      setCounterDialog(null);
      setCounterAmount("");
      setCounterMessage("");
    },
    onError: () => toast.error("Failed to update offer"),
  });

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

  if (authLoading) return null;

  const pendingReceived = received.filter((o) => o.status === "pending").length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-3xl flex-1 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Offers</h1>
        <p className="mt-1 text-muted-foreground">Manage your offers and negotiations</p>

        <Tabs defaultValue="received" className="mt-6">
          <TabsList>
            <TabsTrigger value="received" className="gap-1.5">
              <Inbox className="h-4 w-4" /> Received
              {pendingReceived > 0 && (
                <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                  {pendingReceived}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            {loadingReceived ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : received.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No offers received yet</div>
            ) : (
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
                          From {offer.buyer_profile?.full_name || "Buyer"} · Listed R {offer.listings?.price?.toLocaleString()}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {loadingSent ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sent.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">You haven't made any offers yet</div>
            ) : (
              <div className="space-y-3">
                {sent.map((offer) => (
                  <Card key={offer.id}>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <img
                        src={offer.listings?.images?.[0] || "/placeholder.svg"}
                        alt=""
                        className="h-16 w-16 rounded-md object-cover cursor-pointer"
                        onClick={() => navigate(`/listing/${offer.listing_id}`)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className="truncate text-sm font-semibold text-foreground cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/listing/${offer.listing_id}`)}
                          >
                            {offer.listings?.title ?? "Listing"}
                          </h3>
                          <Badge variant={statusBadge(offer.status)}>{offer.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Listed R {offer.listings?.price?.toLocaleString()} · {format(new Date(offer.created_at), "MMM d")}
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          Your offer: R {offer.amount.toLocaleString()}
                        </p>
                        {offer.status === "countered" && offer.counter_amount && (
                          <div className="mt-1 rounded bg-muted px-2 py-1">
                            <p className="text-xs font-medium text-foreground">
                              Counter: R {offer.counter_amount.toLocaleString()}
                            </p>
                            {offer.seller_message && (
                              <p className="text-xs text-muted-foreground">"{offer.seller_message}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Counter-offer dialog */}
      <Dialog open={!!counterDialog} onOpenChange={(open) => !open && setCounterDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Counter Offer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {counterDialog?.listings?.title} · Offered R {counterDialog?.amount.toLocaleString()}
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
              disabled={!counterAmount || parseFloat(counterAmount) <= 0 || respondToOffer.isPending}
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
    </div>
  );
};

export default MyOffers;
