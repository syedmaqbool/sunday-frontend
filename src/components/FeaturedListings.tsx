import { useMemo } from "react";
import { MOCK_LISTINGS } from "@/lib/constants";
import ListingCard from "./ListingCard";
import { useUserPreferences, personalizeListings } from "@/hooks/useUserPreferences";
import { Sparkles } from "lucide-react";

const FeaturedListings = () => {
  const { data: prefs } = useUserPreferences();

  const listings = useMemo(
    () => personalizeListings([...MOCK_LISTINGS], prefs),
    [prefs]
  );

  const isPersonalized = prefs?.onboarding_completed;

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
