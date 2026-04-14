
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Pencil, Trash2, Plus, Package, RotateCcw } from "lucide-react";
import { ListingFeedbackInline } from "@/components/ListingFeedbackWidgets";
import { toast } from "sonner";
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

const MyListings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing deleted");
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: () => toast.error("Failed to delete listing"),
  });

  const resubmitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("listings")
        .update({ status: "pending", admin_feedback: null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing resubmitted for review");
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: () => toast.error("Failed to resubmit"),
  });

  if (authLoading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const statusColor = (s: string) => {
    if (s === "approved") return "default";
    if (s === "rejected") return "destructive";
    return "secondary";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-3xl flex-1 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">My Listings</h1>
            <p className="mt-1 text-muted-foreground">{listings.length} items listed</p>
          </div>
          <Button className="gap-1" onClick={() => navigate("/create-listing")}>
            <Plus className="h-4 w-4" /> New Listing
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <Package className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-heading text-xl font-semibold text-foreground">No listings yet</p>
            <p className="mt-1 text-muted-foreground">Start selling by creating your first listing</p>
            <Button className="mt-4 gap-1" onClick={() => navigate("/create-listing")}>
              <Plus className="h-4 w-4" /> Create Listing
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <img
                    src={listing.images?.[0] || "/placeholder.svg"}
                    alt={listing.title}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-foreground">{listing.title}</h3>
                      <Badge variant={statusColor(listing.status)}>{listing.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.brand} · R {listing.price.toLocaleString()}
                      {listing.weight ? ` · ${listing.weight}kg` : ""}
                    </p>
                    <ListingFeedbackInline listingId={listing.id} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => navigate(`/edit-listing/${listing.id}`)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {listing.status === "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-primary"
                        onClick={() => resubmitMutation.mutate(listing.id)}
                        disabled={resubmitMutation.isPending}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Resubmit
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
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
                            onClick={() => deleteMutation.mutate(listing.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyListings;
