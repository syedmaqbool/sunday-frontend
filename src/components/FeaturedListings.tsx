import { useQuery } from '@tanstack/react-query';

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { applyBoostRanking, useBoostScoreMap } from '@/hooks/useBoosts';
import {
  getUserPreferencesOptions,
  personalizeListings,
} from '@/hooks/useUserPreferences';
import { getFeaturedListingsOptions } from '@/queries/marketplace.query';
import ListingCard from './ListingCard';

interface FeaturedListingsProps {
  variant?: 'fresh' | 'personalized';
}

function FeaturedListings({ variant = 'fresh' }: FeaturedListingsProps) {
  const scrollReference = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: preferences } = useQuery(getUserPreferencesOptions());
  const boostMap = useBoostScoreMap('FOR_YOU');

  const { data: databaseListings = [] } = useQuery(getFeaturedListingsOptions());

  const isPersonalized
    = variant === 'personalized' && preferences?.onboardingCompleted;

  const listings = useMemo(() => {
    if (variant === 'personalized') {
      return applyBoostRanking(
        personalizeListings([...databaseListings], preferences, item => item.categoryValue),
        boostMap,
      );
    }
    return databaseListings;
  }, [databaseListings, preferences, boostMap, variant]);

  const checkScroll = useCallback(() => {
    const element = scrollReference.current;
    if (!element)
      return;
    setCanScrollLeft(element.scrollLeft > 0);
    setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 1);
  }, []);

  const scrollBy = useCallback(
    (direction: 'left' | 'right') => {
      const element = scrollReference.current;
      if (!element)
        return;
      const cardWidth = element.firstElementChild?.clientWidth || 280;
      const gap = 16;
      const scrollAmount = (cardWidth + gap) * 2;
      element.scrollBy({
        behavior: 'smooth',
        left: direction === 'left' ? -scrollAmount : scrollAmount,
      });
      setTimeout(checkScroll, 300);
    },
    [checkScroll],
  );

  // Hide personalized section when user has no preferences (avoid duplicating Fresh Drops)
  if (variant === 'personalized' && !isPersonalized)
    return null;
  if (listings.length === 0)
    return null;

  return (
    <section className="container py-16">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="
            font-heading text-3xl font-bold text-foreground
            md:text-4xl
          "
          >
            {isPersonalized ? 'Picked for You' : 'Fresh Drops'}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            {isPersonalized && <Sparkles className="h-4 w-4 text-primary" />}
            {isPersonalized
              ? 'Based on your style preferences'
              : 'Just listed by our community'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => scrollBy('left')}
            disabled={!canScrollLeft}
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => scrollBy('right')}
            disabled={!canScrollRight}
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        onScroll={checkScroll}
        ref={scrollReference}
        className="
          mt-8 flex gap-4 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className="
              w-[calc(50%-8px)] flex-shrink-0 snap-start
              sm:w-[calc(33.333%-11px)]
              lg:w-[calc(25%-12px)]
              xl:w-[calc(16.666%-14px)]
            "
          >
            <ListingCard index={index} listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturedListings;
