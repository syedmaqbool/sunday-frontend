import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { ReviewsList } from "@/components/ReviewsList";
import { useSellerRating } from "@/hooks/useSellerRating";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Star, ArrowLeft, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Listing } from "@/lib/constants";

const SellerProfile = () => {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["seller-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["seller-listings", id],
    queryFn: async (): Promise<Listing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", id!)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        images: row.images?.length ? row.images : ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"],
        category: row.category,
        condition: row.condition,
        size: row.size,
        brand: row.brand,
        seller_id: row.seller_id,
        seller_name: profile?.full_name || "Seller",
        created_at: row.created_at,
        status: row.status,
        weight: row.weight,
      }));
    },
    enabled: !!id && !!profile,
  });

  const { data: rating } = useSellerRating(id);

  const isLoading = profileLoading || listingsLoading;

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

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20">
          <h1 className="font-heading text-3xl font-bold text-foreground">Seller not found</h1>
          <Link to="/listings" className="mt-4 text-primary hover:underline">Back to browse</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (profile.full_name || "S")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <Link to="/listings" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        {/* Seller header */}
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-bold text-card-foreground">{profile.full_name || "Seller"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {format(new Date(profile.created_at), "MMMM yyyy")}
            </p>
            <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
              {rating && rating.totalReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= Math.round(rating.avgRating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{rating.avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({rating.totalReviews} review{rating.totalReviews !== 1 ? "s" : ""})</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                {listings.length} listing{listings.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="mt-6">
          <TabsList>
            <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({rating?.totalReviews ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-4">
            {listings.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No active listings</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {listings.map((l, i) => (
                  <ListingCard key={l.id} listing={l} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <ReviewsList userId={id!} limit={20} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SellerProfile;
