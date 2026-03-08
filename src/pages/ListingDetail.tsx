import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MOCK_LISTINGS } from "@/lib/constants";
import { Heart, ShoppingBag, Shield, ArrowLeft, Loader2, Check, Pencil, Trash2, Weight } from "lucide-react";
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
  const mock = MOCK_LISTINGS.find(l => l.id === id);
  if (mock) return mock;

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
  };
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
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
          </div>

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
                Sold by <span className="font-medium text-foreground">{listing.seller_name}</span>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ListingDetail;
