import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

import { Heart, ShoppingBag, Shield, ArrowLeft, Loader2, Check, Pencil, Trash2, Weight, ChevronLeft, ChevronRight } from "lucide-react";
import { ListingFeedbackSection } from "@/components/ListingFeedbackWidgets";
import { ReviewsList } from "@/components/ReviewsList";
import { MakeOfferButton } from "@/components/MakeOfferButton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Listing } from "@/lib/constants";
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
  };
};

const ImageGallery = ({ images, title }: { images: string[]; title: string }) => {
  const [selected, setSelected] = useState(0);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        <img
          src={images[selected]}
          alt={`${title} - photo ${selected + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
        />
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
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${i === selected ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img src={img} alt={`${title} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
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

  const isOwner = listing && user && listing.seller_id === user.id;

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
          <ImageGallery images={listing.images} title={listing.title} />

          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{listing.brand}</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-foreground md:text-4xl">{listing.title}</h1>
            <p className="mt-4 text-3xl font-bold text-foreground">R {listing.price.toLocaleString()}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Size {listing.size}</span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">{listing.condition.replace("_", " ")}</span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">{listing.category}</span>
              {listing.weight && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Weight className="h-3 w-3" /> {listing.weight}kg
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">{listing.description}</p>

            {isOwner && <ListingFeedbackSection listingId={listing.id} />}

            {isOwner ? (
              <div className="mt-8 flex gap-3">
                <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/edit-listing/${listing.id}`)}>
                  <Pencil className="h-4 w-4" /> Edit Listing
                </Button>
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
            ) : (
              <div className="mt-8 flex gap-3">
                <Button size="lg" className="flex-1 gap-2" disabled={inCart} onClick={() => addItem(listing)}>
                  {inCart ? <><Check className="h-4 w-4" /> In Cart</> : <><ShoppingBag className="h-4 w-4" /> Add to Cart</>}
                </Button>
                <MakeOfferButton
                  listingId={listing.id}
                  sellerId={listing.seller_id}
                  listingPrice={listing.price}
                  listingTitle={listing.title}
                />
                <Button variant="outline" size="lg">
                  <Heart className="h-4 w-4" />
                </Button>
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
