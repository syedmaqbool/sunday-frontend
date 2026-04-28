import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ListingCard from "./ListingCard";
import { TrendingUp } from "lucide-react";
import { useBoostScoreMap, applyBoostRanking } from "@/hooks/useBoosts";
import type { Listing } from "@/lib/constants";

const TrendingProducts = () => {
  const boostMap = useBoostScoreMap("trending");
  const { data: dbTrending = [] } = useQuery({
    queryKey: ["trending-listings"],
    queryFn: async (): Promise<Listing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "approved")
        .order("price", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        images: row.images?.length ? row.images : ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"],
        seller_name: "Seller",
      }));
    },
  });

  const trending = useMemo(() => applyBoostRanking(dbTrending, boostMap), [dbTrending, boostMap]);

  if (trending.length === 0) return null;

  return (
    <section className="container py-16">
      <div>
        <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          Trending Now
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          Most popular picks this week
        </p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {trending.map((listing, i) => (
          <ListingCard key={listing.id} listing={listing} index={i} />
        ))}
      </div>
    </section>
  );
};

export default TrendingProducts;
