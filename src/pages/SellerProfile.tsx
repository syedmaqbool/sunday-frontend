import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { format } from 'date-fns';
import { ArrowLeft, Loader2, MapPin, Package, Star } from 'lucide-react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { MessageSellerButton } from '@/components/MessageSellerButton';
import Navbar from '@/components/Navbar';
import { ReviewsList } from '@/components/ReviewsList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerRatingOptions } from '@/hooks/useSellerRating';
import {
  getSellerListingsOptions,
  getSellerProfileOptions,
  getSellerSoldListingsOptions,
} from '@/queries/marketplace.query';

function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParameters, setSearchParameters] = useSearchParams();
  const { user } = useAuth();
  const focusedReviewId = searchParameters.get('review');
  const selectedTab = focusedReviewId
    ? 'reviews'
    : searchParameters.get('tab') === 'reviews'
      ? 'reviews'
      : searchParameters.get('tab') === 'sold'
        ? 'sold'
        : 'listings';

  const { data: profile, isLoading: profileLoading } = useQuery(getSellerProfileOptions(id));

  const { data: listings = [], isLoading: listingsLoading } = useQuery(
    getSellerListingsOptions(id, profile?.fullName, !!id && !!profile),
  );

  const {
    data: soldListingPageData,
    fetchNextPage: fetchNextSoldListingPage,
    hasNextPage: hasMoreSoldListings,
    isError: soldListingsFailed,
    isFetchNextPageError: soldListingsFetchNextPageFailed,
    isFetchingNextPage: soldListingsFetchingNextPage,
    isLoading: soldListingsLoading,
    refetch: refetchSoldListings,
  } = useInfiniteQuery(getSellerSoldListingsOptions(id, !!id && !!profile));

  const soldListingPages = soldListingPageData?.pages ?? [];
  const soldListings = soldListingPages.flatMap(page => page.data);
  const soldListingCount = soldListingPages[0]?.pagination.total ?? 0;
  const isLoadingAllSoldListings =
    soldListingsLoading || Boolean(hasMoreSoldListings) || soldListingsFetchingNextPage;

  useEffect(() => {
    if (hasMoreSoldListings && !soldListingsFetchingNextPage && !soldListingsFetchNextPageFailed) {
      void fetchNextSoldListingPage();
    }
  }, [
    fetchNextSoldListingPage,
    hasMoreSoldListings,
    soldListingsFetchNextPageFailed,
    soldListingsFetchingNextPage,
  ]);
  const { data: rating } = useQuery(getSellerRatingOptions(id));

  const isLoading = profileLoading || listingsLoading || soldListingsLoading;

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
    return <Navigate replace to="/listings" />;
  }

  const selectTab = (tab: string) => {
    const nextParameters = new URLSearchParams(searchParameters);
    nextParameters.set('tab', tab);
    if (tab !== 'reviews') nextParameters.delete('review');
    setSearchParameters(nextParameters);
  };

  const clearMissingReview = () => {
    const nextParameters = new URLSearchParams(searchParameters);
    nextParameters.delete('review');
    setSearchParameters(nextParameters, { replace: true });
  };

  const initials = (profile.fullName || 'S')
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
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        {/* Seller header */}
        <div
          className="
            flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6
            sm:flex-row sm:items-start
          "
        >
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div
            className="
              flex-1 text-center
              sm:text-left
            "
          >
            <h1 className="font-heading text-2xl font-bold text-card-foreground">
              {profile.fullName || 'Seller'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {format(new Date(profile.createdAt), 'MMMM yyyy')}
            </p>
            <div
              className="
                mt-2 flex items-center justify-center gap-3
                sm:justify-start
              "
            >
              {rating && rating.totalReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`
                          h-4 w-4
                          ${
                            s <= Math.round(rating.avgRating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/30'
                          }
                        `}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {rating.avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({rating.totalReviews} review
                    {rating.totalReviews === 1 ? '' : 's'})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                {listings.length} listing
                {listings.length === 1 ? '' : 's'}
              </div>
            </div>
            {(profile.bio || profile.location || profile.phone) && (
              <div className="mt-3 space-y-1 text-sm">
                {profile.bio && <p className="text-card-foreground">{profile.bio}</p>}
                <div
                  className="
                    flex flex-wrap items-center justify-center gap-3 text-muted-foreground
                    sm:justify-start
                  "
                >
                  {profile.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.location}
                    </span>
                  )}
                  {/* {profile.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {' '}
                      {profile.phone}
                    </span>
                  )} */}
                </div>
              </div>
            )}
          </div>
          {profile.canReceiveMessages && user?.id !== profile.userId && (
            <div
              className="
                w-full
                sm:w-auto
              "
            >
              <MessageSellerButton recipientUserId={profile.userId} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs onValueChange={selectTab} value={selectedTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({rating?.totalReviews ?? 0})</TabsTrigger>
            <TabsTrigger value="sold">Sold ({soldListingCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-4">
            {listings.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No active listings</p>
            ) : (
              <div
                className="
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
            <ReviewsList
              focusedReviewId={focusedReviewId}
              userId={id!}
              onFocusedReviewMissing={clearMissingReview}
              limit={20}
            />
          </TabsContent>

          <TabsContent value="sold" className="mt-4">
            {soldListingsFailed ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>Could not load sold items.</p>
                <button
                  className="
                    mt-3 underline underline-offset-4
                    hover:text-foreground
                  "
                  onClick={() =>
                    void (hasMoreSoldListings ? fetchNextSoldListingPage() : refetchSoldListings())
                  }
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : isLoadingAllSoldListings ? (
              <div className="flex justify-center py-12">
                <Loader2 aria-label="Loading sold items" className="h-6 w-6 animate-spin" />
              </div>
            ) : soldListings.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No sold items yet.</p>
            ) : (
              <div
                className="
                  grid grid-cols-2 gap-4
                  sm:grid-cols-3
                  lg:grid-cols-4
                "
              >
                {soldListings.map((listing, index) => (
                  <ListingCard key={listing.id} index={index} listing={listing} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default SellerProfile;
