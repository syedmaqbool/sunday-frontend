import type { Listing } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MapPin, Package, Phone, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import Navbar from '@/components/Navbar';
import { ReviewsList } from '@/components/ReviewsList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSellerRating } from '@/hooks/useSellerRating';
// 👇 Mock switcher config  import karein
import { isMockDataEnabled } from '@/lib/mockConfig';
import {
  getSellerListingsOptions,
  getSellerProfileOptions,
} from '@/queries/useMarketplace';

function SellerProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery(
    getSellerProfileOptions(id),
  );

  const { data: listings = [], isLoading: listingsLoading } = useQuery(
    getSellerListingsOptions(id, profile?.full_name, !!id && !!profile),
  );

  const { data: rating } = useSellerRating(id);

  // 👇 Reviews UI safety fix for mock environment
  const mockRating = isMockDataEnabled
    ? { avgRating: 4.8, totalReviews: 12 }
    : rating;

  const isLoading = profileLoading || listingsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Seller not found
          </h1>
          <Link
            to="/listings"
            className="
              mt-4 text-primary
              hover:underline
            "
          >
            Back to browse
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (profile.full_name || 'S')
    .split(' ')
    .map((n: string) => n.at(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <Link
          to="/listings"
          className="
            mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          <ArrowLeft className="h-4 w-4" />
          {' '}
          Back to listings
        </Link>

        {/* Seller header */}
        <div className="
          flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6
          sm:flex-row sm:items-start
        "
        >
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="
            flex-1 text-center
            sm:text-left
          "
          >
            <h1 className="font-heading text-2xl font-bold text-card-foreground">
              {profile.full_name || 'Seller'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since
              {' '}
              {format(new Date(profile.created_at), 'MMMM yyyy')}
            </p>
            <div className="
              mt-2 flex items-center justify-center gap-3
              sm:justify-start
            "
            >
              {mockRating && mockRating.totalReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`
                          h-4 w-4
                          ${
                      s <= Math.round(mockRating.avgRating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground/30'
                      }
                        `}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {mockRating.avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (
                    {mockRating.totalReviews}
                    {' '}
                    review
                    {mockRating.totalReviews === 1 ? '' : 's'}
                    )
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                {listings.length}
                {' '}
                listing
                {listings.length === 1 ? '' : 's'}
              </div>
            </div>
            {(profile.bio || profile.location || profile.phone) && (
              <div className="mt-3 space-y-1 text-sm">
                {profile.bio && (
                  <p className="text-card-foreground">{profile.bio}</p>
                )}
                <div className="
                  flex flex-wrap items-center justify-center gap-3 text-muted-foreground
                  sm:justify-start
                "
                >
                  {profile.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {' '}
                      {profile.location}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {' '}
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="mt-6">
          <TabsList>
            <TabsTrigger value="listings">
              Listings (
              {listings.length}
              )
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews (
              {mockRating?.totalReviews ?? 0}
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-4">
            {listings.length === 0
              ? (
                  <p className="py-12 text-center text-muted-foreground">
                    No active listings
                  </p>
                )
              : (
                  <div className="
                    grid grid-cols-2 gap-4
                    sm:grid-cols-3
                    lg:grid-cols-4
                  "
                  >
                    {listings.map((l, index) => (
                      <ListingCard key={l.id} index={index} listing={l} />
                    ))}
                  </div>
                )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            {/* Mock condition blocks subcomponents crashing if needed */}
            {isMockDataEnabled
              ? (
                  <div className="rounded-lg border bg-card py-8 text-center text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">
                      Reviews Panel (Mock Enabled)
                    </p>
                    <p className="text-sm">
                      Sample reviews are hidden or loaded as static layout items.
                    </p>
                  </div>
                )
              : (
                  <ReviewsList userId={id!} limit={20} />
                )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default SellerProfile;
