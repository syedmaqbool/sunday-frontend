import { useQuery } from '@tanstack/react-query';

import { format } from 'date-fns';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { ReviewForm } from '@/components/ReviewForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { formatEnumLabel } from '@/lib/utilities';
import {
  getMyReviewedOfferIdsOptions,
  getSentOffersOptions,
} from '@/queries/offers.query';

function statusBadge(s: string) {
  const map: Record<string, 'default' | 'destructive' | 'secondary'> = {
    ACCEPTED: 'default',
    COUNTERED: 'secondary',
    EXPIRED: 'destructive',
    PENDING: 'secondary',
    REJECTED: 'destructive',
    WITHDRAWN: 'destructive',
  };
  return map[s] ?? 'secondary';
}

function MyOffers() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [reviewingOffer, setReviewingOffer] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user)
      navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  const { data: sentResponse, isLoading: loadingSent } = useQuery(getSentOffersOptions(user?.id));
  const sent = sentResponse?.data ?? [];

  const { data: myReviewsResponse } = useQuery(getMyReviewedOfferIdsOptions(user?.id));
  const myReviews = new Set((myReviewsResponse?.data ?? [])
    .map(review => review.offerId)
    .filter((offerId): offerId is string => offerId !== null));

  if (authLoading)
    return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-3xl flex-1 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          My Offers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Offers you've made on other sellers' listings. Offers received on your
          own listings appear under
          {' '}
          <button
            onClick={() => navigate('/my-listings')}
            className="
              font-medium text-primary underline
              hover:text-primary/80
            "
          >
            My Listings
          </button>
          .
        </p>

        <div className="mt-6">
          {loadingSent
            ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (sent.length === 0
                ? (
                    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card py-16 text-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 font-heading text-base font-semibold text-foreground">
                        You haven't made any offers yet
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Browse listings and make an offer to get started.
                      </p>
                    </div>
                  )
                : (
                    <div className="space-y-3">
                      {sent.map(offer => (
                        <Card
                          key={offer.id}
                          className="
                            overflow-hidden transition-all
                            hover:shadow-sm
                          "
                        >
                          <CardContent className="
                            flex flex-col gap-4 p-4
                            sm:flex-row sm:items-center
                          "
                          >
                            <img
                              src="/placeholder.svg"
                              onClick={() => navigate(`/listing/${offer.listingId}`)}
                              alt=""
                              className="h-16 w-16 cursor-pointer rounded-md bg-muted object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  onClick={() =>
                                    navigate(`/listing/${offer.listingId}`)}
                                  className="
                                    cursor-pointer truncate text-sm font-semibold text-foreground
                                    hover:text-primary
                                  "
                                >
                                  {offer.listingTitle ?? 'Listing'}
                                </h3>
                                <Badge variant={statusBadge(offer.status)}>
                                  {formatEnumLabel(offer.status)}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Listed Rs
                                {' '}
                                {offer.listingPrice?.toLocaleString()}
                                {' '}
                                ·
                                {' '}
                                {format(new Date(offer.createdAt), 'MMM d')}
                              </p>
                              <p className="mt-1.5 text-sm font-semibold text-foreground">
                                Your offer: Rs
                                {' '}
                                {offer.amount.toLocaleString()}
                              </p>

                              {offer.status === 'COUNTERED' && offer.counterAmount && (
                                <div className="mt-2 max-w-md rounded border bg-muted/60 p-2">
                                  <p className="text-xs font-semibold text-foreground">
                                    Counter: Rs
                                    {' '}
                                    {offer.counterAmount.toLocaleString()}
                                  </p>
                                </div>
                              )}

                              {offer.status === 'ACCEPTED'
                                && !myReviews.has(offer.id)
                                && (reviewingOffer === offer.id
                                  ? (
                                      <div className="mt-3 w-full border-t border-border pt-3">
                                        <p className="mb-2 text-xs font-medium text-foreground">
                                          Rate this seller
                                        </p>
                                        <ReviewForm
                                          listingId={offer.listingId}
                                          offerId={offer.id}
                                          reviewedId={offer.sellerId}
                                          onSuccess={() => setReviewingOffer(null)}
                                          role="BUYER"
                                        />
                                      </div>
                                    )
                                  : (
                                      <Button
                                        onClick={() => setReviewingOffer(offer.id)}
                                        size="sm"
                                        variant="outline"
                                        className="mt-2.5 h-8 gap-1.5"
                                      >
                                        <Star className="h-3.5 w-3.5" />
                                        {' '}
                                        Leave Review
                                      </Button>
                                    ))}
                              {offer.status === 'ACCEPTED'
                                && myReviews.has(offer.id) && (
                                <span className="mt-2 inline-flex items-center rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                                  ✓ Reviewed
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MyOffers;
