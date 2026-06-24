import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { ReviewsList } from "@/components/ReviewsList";
import { useSellerRating } from "@/hooks/useSellerRating";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Star, ArrowLeft, Package, MapPin, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Listing } from "@/lib/constants";
// 👇 Mock switcher config  import karein
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

const SellerProfile = () => {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["seller-profile", id],
    queryFn: async () => {
      // 👇 Mock Data Interception
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return {
          id: id || "mock-seller-id",
          full_name: "Premium Seller Pro",
          avatar_url:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          bio: "Specializing in premium perfumes, authentic streetwear, and high-end tech accessories. Fast shipping across Pakistan!",
          location: "Karachi, Pakistan",
          phone: "+92 300 1234567",
          created_at: "2024-01-15T00:00:00.000Z",
        };
      }

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
      // 👇 Mock Listings Interception
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return [
          {
            id: "mock-list-1",
            title: "Bleu de Chanel Eau de Parfum",
            description:
              "Partially used premium scent. 90ml remaining out of 100ml. Authentic box included.",
            price: 28500,
            images: [
              "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600",
            ],
            category: "perfumes",
            condition: "Like New",
            size: "90ml",
            brand: "Chanel",
            seller_id: id || "mock-seller-id",
            seller_name: "Premium Seller Pro",
            created_at: new Date().toISOString(),
            status: "approved",
            weight: 0.3,
          },
          {
            id: "mock-list-2",
            title: "Mechanical Gaming Keyboard",
            description:
              "RGB backlit mechanical keyboard with red switches. Perfect condition.",
            price: 8500,
            images: [
              "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
            ],
            category: "electronics",
            condition: "Good",
            size: "Standard",
            brand: "Redragon",
            seller_id: id || "mock-seller-id",
            seller_name: "Premium Seller Pro",
            created_at: new Date().toISOString(),
            status: "approved",
            weight: 0.9,
          },
          {
            id: "mock-list-3",
            title: "Oversized Vintage Graphic Tee",
            description:
              "Comfortable drop-shoulder cotton t-shirt. Worn only twice.",
            price: 2400,
            images: [
              "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600",
            ],
            category: "clothing",
            condition: "Good",
            size: "XL",
            brand: "Outfitters",
            seller_id: id || "mock-seller-id",
            seller_name: "Premium Seller Pro",
            created_at: new Date().toISOString(),
            status: "sold", // Ek product ko sold state me rakha hai verification ke liye
            weight: 0.25,
          },
        ];
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", id!)
        .in("status", ["approved", "sold"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        images: row.images?.length
          ? row.images
          : [
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600",
            ],
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

  // 👇 Reviews UI safety fix for mock environment
  const mockRating = NEXT_PUBLIC_USE_MOCK_DATA
    ? { avgRating: 4.8, totalReviews: 12 }
    : rating;

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
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Seller not found
          </h1>
          <Link to="/listings" className="mt-4 text-primary hover:underline">
            Back to browse
          </Link>
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
        <Link
          to="/listings"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        {/* Seller header */}
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-bold text-card-foreground">
              {profile.full_name || "Seller"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {format(new Date(profile.created_at), "MMMM yyyy")}
            </p>
            <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
              {mockRating && mockRating.totalReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= Math.round(mockRating.avgRating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {mockRating.avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({mockRating.totalReviews} review
                    {mockRating.totalReviews !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                {listings.length} listing{listings.length !== 1 ? "s" : ""}
              </div>
            </div>
            {(profile.bio || profile.location || profile.phone) && (
              <div className="mt-3 space-y-1 text-sm">
                {profile.bio && (
                  <p className="text-card-foreground">{profile.bio}</p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3 text-muted-foreground sm:justify-start">
                  {profile.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.location}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="mt-6">
          <TabsList>
            <TabsTrigger value="listings">
              Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({mockRating?.totalReviews ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-4">
            {listings.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No active listings
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {listings.map((l, i) => (
                  <ListingCard key={l.id} listing={l} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            {/* Mock condition blocks subcomponents crashing if needed */}
            {NEXT_PUBLIC_USE_MOCK_DATA ? (
              <div className="text-center py-8 text-muted-foreground bg-card border rounded-lg">
                <p className="font-medium text-foreground mb-1">
                  Reviews Panel (Mock Enabled)
                </p>
                <p className="text-sm">
                  Sample reviews are hidden or loaded as static layout items.
                </p>
              </div>
            ) : (
              <ReviewsList userId={id!} limit={20} />
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SellerProfile;
