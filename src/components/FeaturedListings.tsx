import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ListingCard from "./ListingCard";
import { useUserPreferences, personalizeListings } from "@/hooks/useUserPreferences";
import { Sparkles } from "lucide-react";
import type { Listing } from "@/lib/constants";

const FeaturedListings = () => {
  const { data: prefs } = useUserPreferences();

  const { data: dbListings = [] } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: async (): Promise<Listing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        images: row.images?.length ? row.images : ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"],
        seller_name: "Seller",
      }));
    },
  });

  const listings = useMemo(
    () => personalizeListings([...dbListings], prefs),
    [dbListings, prefs]
  );

  const isPersonalized = prefs?.onboarding_completed;

  if (listings.length === 0) return null;

  return (
    <section className="container py-16">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            {isPersonalized ? "Picked for You" : "Fresh Drops"}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            {isPersonalized && <Sparkles className="h-4 w-4 text-primary" />}
            {isPersonalized
              ? "Based on your style preferences"
              : "Just listed by our community"}
          </p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {listings.map((listing, i) => (
          <ListingCard key={listing.id} listing={listing} index={i} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedListings;
