import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

import { ShoppingBag, Shield, ArrowLeft, Loader2, Check, Pencil, Trash2, Weight, ChevronLeft, ChevronRight } from "lucide-react";
import { ListingFeedbackSection } from "@/components/ListingFeedbackWidgets";
import { ReportDialog } from "@/components/ReportDialog";
import { ReviewsList } from "@/components/ReviewsList";
import { MakeOfferButton } from "@/components/MakeOfferButton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Listing } from "@/lib/constants";
import { getWeightLabel } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fetchListing = async (id: string): Promise<Listing | null> => {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    price: data.price,
    images: (data.images as string[])?.length ? (data.images as string[]) : ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"],
    category: data.category,
    condition: data.condition,
    size: data.size,
    brand: data.brand,
    seller_id: data.seller_id,
    seller_name: "Seller",
    created_at: data.created_at,
    status: data.status as Listing["status"],
    weight: data.weight,
    admin_feedback: (data as any).admin_feedback,
    reserved_for: (data as any).reserved_for,
    reserved_until: (data as any).reserved_until,
    reserved_offer_id: (data as any).reserved_offer_id,
  };
};

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);

const ImageGallery = ({ images, title, status }: { images: string[]; title: string; status?: string }) => {
  const [selected, setSelected] = useState(0);
  const current = images[selected];
  const currentIsVideo = isVideoUrl(current);

  const isUnavailable = status === "sold" || status === "reserved";
  const unavailableClass = isUnavailable ? "grayscale opacity-60" : "";

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {currentIsVideo ? (
          <video
            key={current}
            src={current}
            controls
            playsInline
            className={`h-full w-full bg-black object-contain ${unavailableClass}`}
          />
        ) : (
          <img
            src={current}
            alt={`${title} - photo ${selected + 1}`}
            className={`h-full w-full object-cover transition-opacity duration-300 ${unavailableClass}`}
          />
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelected((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSelected((p) => (p + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`h-2 w-2 rounded-full transition ${i === selected ? "bg-primary scale-125" : "bg-background/70"}`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => {
            const vid = isVideoUrl(img);
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${i === selected ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                {vid ? (
                  <>
                    <video src={img} className="h-full w-full bg-black object-cover" muted preload="metadata" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">▶</span>
                  </>
                ) : (
                  <img src={img} alt={`${title} thumbnail ${i + 1}`} className={`h-full w-full object-cover ${isUnavailable ? "grayscale opacity-60" : ""}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, addItem } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inCart = items.some((i) => i.listing.id === id);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (listing) {
      trackEvent("view_item", {
        currency: "PKR",
        value: listing.price,
        items: [{ item_id: listing.id, item_name: listing.title, item_category: listing.category, item_brand: listing.brand, price: listing.price }],
      });
    }
  }, [listing?.id]);

  const isOwner = listing && user && listing.seller_id === user.id;
  const isReserved = listing?.status === "reserved";
  const isReservedForMe = isReserved && !!user && listing?.reserved_for === user.id;
  const isReservedForOther = isReserved && !isReservedForMe && !isOwner;
  const countdown = useCountdown(isReserved ? listing?.reserved_until : null);

  const { data: reservedOfferAmount } = useQuery({
    queryKey: ["reserved-offer-amount", listing?.reserved_offer_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("amount")
        .eq("id", listing!.reserved_offer_id!)
        .maybeSingle();
      if (error || !data) return null;
      return Number(data.amount);
    },
    enabled: !!(isReservedForMe && listing?.reserved_offer_id),
  });

  const effectivePrice = isReservedForMe && reservedOfferAmount ? reservedOfferAmount : listing?.price ?? 0;

  const cancelReservation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("expire_listing_reservation", {
        _listing_id: listing!.id,
        _force: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservation cancelled");
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to cancel"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("listings").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing deleted");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      navigate("/my-listings");
    },
    onError: () => toast.error("Failed to delete"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20">
          <h1 className="font-heading text-3xl font-bold text-foreground">Listing not found</h1>
          <Link to="/listings" className="mt-4 text-primary hover:underline">Back to browse</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <Link to="/listings" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <ImageGallery images={listing.images} title={listing.title} status={listing.status} />

          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{listing.brand}</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-foreground md:text-4xl">{listing.title}</h1>
            {isReservedForMe && reservedOfferAmount && reservedOfferAmount !== listing.price ? (
              <div className="mt-4 flex items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">Rs {reservedOfferAmount.toLocaleString()}</p>
                <p className="text-lg text-muted-foreground line-through">Rs {listing.price.toLocaleString()}</p>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Your accepted offer</span>
              </div>
            ) : (
              <p className="mt-4 text-3xl font-bold text-foreground">Rs {listing.price.toLocaleString()}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Size {listing.size}</span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">{listing.condition.replace("_", " ")}</span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">{listing.category}</span>
              {listing.weight && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Weight className="h-3 w-3" /> {getWeightLabel(listing.weight)}
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">{listing.description}</p>

            {isOwner && <ListingFeedbackSection listingId={listing.id} />}

            {listing.status === "sold" && !isOwner && (
              <div className="mt-8 rounded-lg border border-border bg-muted px-4 py-6 text-center">
                <p className="font-heading text-lg font-semibold text-foreground">Sold</p>
                <p className="mt-1 text-sm text-muted-foreground">This item has already been purchased and is no longer available.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/listings")}>Browse other listings</Button>
              </div>
            )}

            {isReserved && (
              <div className={`mt-6 rounded-lg border px-4 py-3 text-sm ${isReservedForMe ? "border-primary/40 bg-primary/5 text-foreground" : "border-border bg-muted text-muted-foreground"}`}>
                {isReservedForMe ? (
                  <p>
                    <span className="font-semibold text-primary">Reserved for you.</span>{" "}
                    Complete your purchase within{" "}
                    <span className="font-mono font-semibold text-foreground">{countdown}</span>.
                  </p>
                ) : isOwner ? (
                  <p>
                    Reserved for an approved buyer · expires in{" "}
                    <span className="font-mono font-semibold text-foreground">{countdown}</span>.
                  </p>
                ) : (
                  <p>
                    Currently reserved for another buyer · available again in{" "}
                    <span className="font-mono font-semibold text-foreground">{countdown}</span>.
                  </p>
                )}
              </div>
            )}

            {isOwner ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/edit-listing/${listing.id}`)}>
                  <Pencil className="h-4 w-4" /> Edit Listing
                </Button>
                {isReserved && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => cancelReservation.mutate()}
                    disabled={cancelReservation.isPending}
                  >
                    Cancel reservation
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="lg" variant="outline" className="gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove "{listing.title}" and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : listing.status !== "sold" ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="min-w-0 flex-1 gap-2"
                  disabled={inCart || isReservedForOther}
                  onClick={() => addItem(listing, isReservedForMe ? effectivePrice : undefined)}
                >
                  {inCart ? (
                    <><Check className="h-4 w-4" /> In Cart</>
                  ) : isReservedForOther ? (
                    <>Currently Reserved</>
                  ) : (
                    <><ShoppingBag className="h-4 w-4" /> {isReservedForMe ? "Complete Purchase" : "Add to Cart"}</>
                  )}
                </Button>
                {!isReserved && (
                  <MakeOfferButton
                    listingId={listing.id}
                    sellerId={listing.seller_id}
                    listingPrice={listing.price}
                    listingTitle={listing.title}
                  />
                )}
                <Button variant="outline" size="lg" className="flex-shrink-0">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {!isOwner && (
              <div className="mt-3 flex justify-end gap-2">
                <ReportDialog targetType="listing" targetId={listing.id} label="Report listing" />
                {listing.seller_id && (
                  <ReportDialog targetType="user" targetId={listing.seller_id} label="Report seller" />
                )}
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-secondary p-4">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Buyer Protection</p>
                <p className="text-xs text-muted-foreground">Money-back guarantee if item isn't as described</p>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Sold by{" "}
                {listing.seller_id ? (
                  <Link to={`/seller/${listing.seller_id}`} className="font-medium text-primary hover:underline">
                    {listing.seller_name}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{listing.seller_name}</span>
                )}
              </p>
              {listing.seller_id && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Seller Reviews</p>
                  <ReviewsList userId={listing.seller_id} limit={5} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ListingDetail;
