import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { applyBoostRanking, useBoostScoreMap } from '@/hooks/useBoosts';
import { getTrendingListingsOptions } from '@/queries/useMarketplace';
import ListingCard from './ListingCard';

export default function TrendingProducts() {
  const boostMap = useBoostScoreMap('TRENDING');
  const { data: databaseTrending = [] } = useQuery(getTrendingListingsOptions());

  const trending = useMemo(
    () => applyBoostRanking(databaseTrending, boostMap),
    [databaseTrending, boostMap],
  );

  if (trending.length === 0)
    return null;

  return (
    <section className="container py-16">
      <div>
        <h2 className="
          font-heading text-3xl font-bold text-foreground
          md:text-4xl
        "
        >
          Trending Now
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          Most popular picks this week
        </p>
      </div>
      <div className="
        mt-8 grid grid-cols-2 gap-4
        sm:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-6
      "
      >
        {trending.map((listing, index) => (
          <ListingCard key={listing.id} index={index} listing={listing} />
        ))}
      </div>
    </section>
  );
}
