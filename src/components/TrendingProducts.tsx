import { useMemo } from "react";
import { MOCK_LISTINGS } from "@/lib/constants";
import ListingCard from "./ListingCard";
import { TrendingUp } from "lucide-react";

const TrendingProducts = () => {
  const trending = useMemo(
    () =>
      [...MOCK_LISTINGS]
        .sort((a, b) => b.price - a.price)
        .slice(0, 6),
    []
  );

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
