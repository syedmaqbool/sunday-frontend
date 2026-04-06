import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerRating } from "@/hooks/useSellerRating";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Package, ShoppingBag, Settings } from "lucide-react";
import { format } from "date-fns";

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Items bought: accepted offers where user is buyer, joined with listing
  const { data: boughtItems = [], isLoading: boughtLoading } = useQuery({
    queryKey: ["bought-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, amount, status, created_at, updated_at, listing_id, listings(id, title, images, brand, category, condition, size, price)")
        .eq("buyer_id", user!.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Items sold: accepted offers where user is seller, joined with listing
  const { data: soldItems = [], isLoading: soldLoading } = useQuery({
    queryKey: ["sold-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, amount, status, created_at, updated_at, listing_id, listings(id, title, images, brand, category, condition, size, price)")
        .eq("seller_id", user!.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: rating } = useSellerRating(user?.id);

  if (authLoading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const isLoading = profileLoading || boughtLoading || soldLoading;

  const initials = (profile?.full_name || user.email || "U")
    .split(/[\s@]/)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-heading text-2xl font-bold text-card-foreground">
                  {profile?.full_name || user.email}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Member since {format(new Date(profile?.created_at || user.created_at), "MMMM yyyy")}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
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
                      <span className="text-sm font-medium text-card-foreground">
                        {rating.avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({rating.totalReviews} review{rating.totalReviews !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                    {boughtItems.length} bought
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    {soldItems.length} sold
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => navigate("/preferences")}
              >
                <Settings className="h-4 w-4" /> Settings
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="bought" className="mt-6">
              <TabsList>
                <TabsTrigger value="bought">Bought ({boughtItems.length})</TabsTrigger>
                <TabsTrigger value="sold">Sold ({soldItems.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="bought" className="mt-4">
                {boughtItems.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-heading text-lg font-semibold text-foreground">No purchases yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Items you buy will appear here</p>
                    <Button className="mt-4" onClick={() => navigate("/listings")}>
                      Browse Listings
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {boughtItems.map((item: any) => (
                      <TransactionCard
                        key={item.id}
                        item={item}
                        label="Purchased"
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sold" className="mt-4">
                {soldItems.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-heading text-lg font-semibold text-foreground">No sales yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Items you sell will appear here</p>
                    <Button className="mt-4" onClick={() => navigate("/create-listing")}>
                      Create Listing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {soldItems.map((item: any) => (
                      <TransactionCard
                        key={item.id}
                        item={item}
                        label="Sold"
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

function TransactionCard({ item, label }: { item: any; label: string }) {
  const listing = item.listings;
  if (!listing) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <Link to={`/listing/${listing.id}`}>
          <img
            src={listing.images?.[0] || "/placeholder.svg"}
            alt={listing.title}
            className="h-20 w-20 rounded-md object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/listing/${listing.id}`}
              className="truncate font-semibold text-foreground hover:underline"
            >
              {listing.title}
            </Link>
            <Badge variant="secondary">{label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {listing.brand} · R {Number(item.amount).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.updated_at), "dd MMM yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserProfile;
