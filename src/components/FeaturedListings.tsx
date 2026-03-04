import { MOCK_LISTINGS } from "@/lib/constants";
import ListingCard from "./ListingCard";

const FeaturedListings = () => (
  <section className="container py-16">
    <div className="flex items-end justify-between">
      <div>
        <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          Fresh Drops
        </h2>
        <p className="mt-2 text-muted-foreground">Just listed by our community</p>
      </div>
    </div>
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {MOCK_LISTINGS.map((listing, i) => (
        <ListingCard key={listing.id} listing={listing} index={i} />
      ))}
    </div>
  </section>
);

export default FeaturedListings;
