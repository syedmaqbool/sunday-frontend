import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ListingCard from "./ListingCard";
import { useUserPreferences, personalizeListings } from "@/hooks/useUserPreferences";
import { useBoostScoreMap, applyBoostRanking } from "@/hooks/useBoosts";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/constants";

interface FeaturedListingsProps {
  variant?: "fresh" | "personalized";
}

const FeaturedListings = ({ variant = "fresh" }: FeaturedListingsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: prefs } = useUserPreferences();
  const boostMap = useBoostScoreMap("for_you");

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

  const isPersonalized = variant === "personalized" && prefs?.onboarding_completed;

  const listings = useMemo(() => {
    if (variant === "personalized") {
      return applyBoostRanking(personalizeListings([...dbListings], prefs), boostMap);
    }
    return dbListings;
  }, [dbListings, prefs, boostMap, variant]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  const scrollBy = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth || 280;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2;
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  }, [checkScroll]);

  // Hide personalized section when user has no preferences (avoid duplicating Fresh Drops)
  if (variant === "personalized" && !isPersonalized) return null;
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            disabled={!canScrollLeft}
            onClick={() => scrollBy("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            disabled={!canScrollRight}
            onClick={() => scrollBy("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="mt-8 flex gap-4 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((listing, i) => (
          <div key={listing.id} className="w-[calc(50%-8px)] flex-shrink-0 snap-start sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(16.666%-14px)]">
            <ListingCard listing={listing} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedListings;
