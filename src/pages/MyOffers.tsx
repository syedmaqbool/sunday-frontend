import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
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

const MyOffers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewingOffer, setReviewingOffer] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

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
      .channel("offers-sent-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["offers-sent"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-3xl flex-1 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">My Offers</h1>
        <p className="mt-1 text-muted-foreground">
          Offers you've made on other sellers' listings. Offers received on your own listings appear under{" "}
          <button className="underline" onClick={() => navigate("/my-listings")}>
            My Listings
          </button>
          .
        </p>

        <div className="mt-6">
          {loadingSent ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sent.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-heading text-base font-semibold text-foreground">
                You haven't made any offers yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse listings and make an offer to get started.
              </p>
            </div>
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
                        Listed R {offer.listings?.price?.toLocaleString()} ·{" "}
                        {format(new Date(offer.created_at), "MMM d")}
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
                            <p className="text-xs text-muted-foreground">
                              "{offer.seller_message}"
                            </p>
                          )}
                        </div>
                      )}
                      {offer.status === "accepted" &&
                        !myReviews.includes(offer.id) &&
                        (reviewingOffer === offer.id ? (
                          <div className="mt-3 w-full border-t border-border pt-3">
                            <p className="mb-2 text-xs font-medium text-foreground">
                              Rate this seller
                            </p>
                            <ReviewForm
                              offerId={offer.id}
                              listingId={offer.listing_id}
                              reviewedId={offer.seller_id}
                              role="buyer"
                              onSuccess={() => setReviewingOffer(null)}
                            />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 gap-1.5"
                            onClick={() => setReviewingOffer(offer.id)}
                          >
                            <Star className="h-3.5 w-3.5" /> Leave Review
                          </Button>
                        ))}
                      {offer.status === "accepted" && myReviews.includes(offer.id) && (
                        <span className="mt-1 inline-block text-xs italic text-muted-foreground">
                          ✓ Reviewed
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyOffers;
