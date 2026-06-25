import type { BoostableListingItem, ListingBoost } from '@/types/boost';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Package,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BoostDialog from '@/components/BoostDialog';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getBoostableListingsOptions,
  getMyBoostsOptions,
} from '@/queries/useClientBoost';

// ─── Constants ────────────────────────────────────────────────────────────────

const placementIcon: Record<string, any> = {
  FOR_YOU: Sparkles,
  SEARCH: Search,
  TRENDING: TrendingUp,
};

const placementLabel: Record<string, string> = {
  FOR_YOU: 'Picked for You',
  SEARCH: 'Search & Browse',
  TRENDING: 'Trending Now',
};

// ─── Component ────────────────────────────────────────────────────────────────

function Boost() {
  const navigate = useNavigate();

  const { data: boostsResponse, isLoading: boostsLoading }
    = useQuery(getMyBoostsOptions());
  const { data: listingsResponse, isLoading: listingsLoading } = useQuery(
    getBoostableListingsOptions(),
  );

  const allBoosts: ListingBoost[] = boostsResponse?.data ?? [];
  const listings: BoostableListingItem[] = listingsResponse?.data ?? [];

  const now = useMemo(() => Date.now(), []);
  const activeBoosts = allBoosts.filter(
    b => new Date(b.endsAt).getTime() > now,
  );
  const expiredBoosts = allBoosts.filter(
    b => new Date(b.endsAt).getTime() <= now,
  );

  // group active boosts by listingId for the listings section
  const boostsByListing = new Map<string, ListingBoost[]>();
  for (const b of activeBoosts) {
    const array = boostsByListing.get(b.listingId) ?? [];
    array.push(b);
    boostsByListing.set(b.listingId, array);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Boost Listings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Promote your products in Trending, Picked for You, and Search
              results.
            </p>
          </div>
        </div>

        {/* Active boosts summary */}
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Active Boosts (
            {activeBoosts.length}
            )
          </h2>
          {boostsLoading
            ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (activeBoosts.length === 0
                ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No active boosts. Pick a listing below to start promoting.
                    </p>
                  )
                : (
                    <div className="mt-3 space-y-2">
                      {activeBoosts.map((b) => {
                        const Icon = placementIcon[b.placement] ?? Rocket;
                        const listing = listings.find(l => l.id === b.listingId);
                        return (
                          <Card key={b.id}>
                            <CardContent className="flex items-center gap-3 p-3">
                              <Icon className="h-4 w-4 shrink-0 text-primary" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {listing?.title ?? 'Listing'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {placementLabel[b.placement] ?? b.placement}
                                  {' '}
                                  · ends
                                  {' '}
                                  {new Date(b.endsAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                Rs
                                {' '}
                                {Number(b.pricePaid).toFixed(2)}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
        </section>

        {/* Choose a listing to boost */}
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Your Approved Listings
          </h2>
          {listingsLoading
            ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (listings.length === 0
                ? (
                    <div className="mt-6 flex flex-col items-center py-12 text-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 font-heading text-base font-semibold text-foreground">
                        No approved listings to boost
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Once a listing is approved, you can promote it here.
                      </p>
                      <Button
                        onClick={() => navigate('/create-listing')}
                        className="mt-4"
                      >
                        Create Listing
                      </Button>
                    </div>
                  )
                : (
                    <div className="mt-3 space-y-2">
                      {listings.map((l) => {
                        const active = boostsByListing.get(l.id) ?? [];
                        return (
                          <Card key={l.id}>
                            <CardContent className="flex items-center gap-3 p-3">
                              <img
                                src={l.images?.[0] || '/placeholder.svg'}
                                alt={l.title}
                                className="h-14 w-14 rounded-md object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-foreground">
                                  {l.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Rs
                                  {' '}
                                  {Number(l.price).toLocaleString()}
                                  {active.length > 0 && (
                                    <span className="ml-2 text-primary">
                                      ·
                                      {' '}
                                      {active.length}
                                      {' '}
                                      active boost
                                      {active.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <BoostDialog listingId={l.id} listingTitle={l.title} />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
        </section>

        {/* Boost history */}
        {expiredBoosts.length > 0 && (
          <section className="mt-10">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Boost History
            </h2>
            <div className="mt-3 space-y-2">
              {expiredBoosts.slice(0, 10).map((b) => {
                const listing = listings.find(l => l.id === b.listingId);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        {listing?.title ?? 'Listing'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {placementLabel[b.placement] ?? b.placement}
                        {' '}
                        · ended
                        {' '}
                        {new Date(b.endsAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Rs
                      {' '}
                      {Number(b.pricePaid).toFixed(2)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Boost;
