import type { MarketplaceListing } from '@/queries/marketplace.query';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Shield,
  ShoppingBag,
  Trash2,
  Weight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { MakeOfferButton } from '@/components/MakeOfferButton';
import { MyListingFeedbackSection } from '@/components/MyListingFeedbackWidgets';
import Navbar from '@/components/Navbar';
import { ReportDialog } from '@/components/ReportDialog';
import { ReviewsList } from '@/components/ReviewsList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { trackEvent } from '@/lib/analytics';
import { getWeightLabel } from '@/lib/constants';
import {
  getListingMediaUrls,
  getMarketplaceListingOptions,
  getReservedOfferAmountOptions,
} from '@/queries/marketplace.query';
import {
  useCancelMyListingReservationMutation,
  useDeleteMyListingMutation,
} from '@/queries/myListings.query';

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target)
      return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target)
    return null;
  const ms = new Date(target).getTime() - now;
  if (ms <= 0)
    return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function isVideoUrl(url: string) {
  return /\.(?:mp4|webm|mov|m4v|ogg)(?:\?|$)/i.test(url);
}

function ImageGallery({
  images,
  status,
  title,
}: {
  images: string[];
  status?: string;
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];
  const isCurrentIsVideo = isVideoUrl(current);

  const isUnavailable = status === 'sold' || status === 'reserved';
  const unavailableClass = isUnavailable ? 'grayscale opacity-60' : '';

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {isCurrentIsVideo
          ? (
              <video
                key={current}
                src={current}
                controls
                playsInline
                className={`
                  h-full w-full bg-black object-contain
                  ${unavailableClass}
                `}
              />
            )
          : (
              <img
                src={current}
                alt={`${title} - photo ${selected + 1}`}
                className={`
                  h-full w-full object-cover transition-opacity duration-300
                  ${unavailableClass}
                `}
              />
            )}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelected(p => (p - 1 + images.length) % images.length)}
              aria-label="Previous photo"
              className="
                absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur-sm transition
                hover:bg-background
              "
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSelected(p => (p + 1) % images.length)}
              aria-label="Next photo"
              className="
                absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur-sm transition
                hover:bg-background
              "
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setSelected(index)}
                  aria-label={`Photo ${index + 1}`}
                  className={`
                    h-2 w-2 rounded-full transition
                    ${index === selected ? 'scale-125 bg-primary' : 'bg-background/70'}
                  `}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const isVid = isVideoUrl(image);
            return (
              <button
                key={image}
                onClick={() => setSelected(index)}
                className={`
                  relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition
                  ${index === selected
                ? 'border-primary'
                : `
                  border-transparent opacity-60
                  hover:opacity-100
                `}
                `}
              >
                {isVid
                  ? (
                      <>
                        <video
                          src={image}
                          muted
                          preload="metadata"
                          className="h-full w-full bg-black object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
                          ▶
                        </span>
                      </>
                    )
                  : (
                      <img
                        src={image}
                        alt={`${title} thumbnail ${index + 1}`}
                        className={`
                          h-full w-full object-cover
                          ${isUnavailable ? 'opacity-60 grayscale' : ''}
                        `}
                      />
                    )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function toCartListing(listing: MarketplaceListing) {
  return {
    id: listing.id,
    brand: listing.brand,
    category: listing.categoryValue,
    condition: listing.condition,
    created_at: listing.createdAt,
    description: listing.description,
    images: getListingMediaUrls(listing),
    price: listing.price,
    seller_id: listing.sellerId,
    seller_name: listing.seller?.fullName ?? 'Seller',
    size: listing.size,
    status: listing.status.toLowerCase() as 'approved' | 'needs_revision' | 'pending' | 'rejected' | 'reserved' | 'sold',
    title: listing.title,
    weight: listing.weight ?? null,
  };
}

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { user } = useAuth();
  const inCart = items.some(index => index.listing.id === id);

  const { data: listing, isLoading } = useQuery(getMarketplaceListingOptions(id));

  useEffect(() => {
    if (listing) {
      trackEvent('view_item', {
        currency: 'PKR',
        items: [
          {
            item_brand: listing.brand,
            item_category: listing.categoryValue,
            item_id: listing.id,
            item_name: listing.title,
            price: listing.price,
          },
        ],
        value: listing.price,
      });
    }
  }, [listing]);

  const isOwner = listing && user && listing.sellerId === user.id;
  const isReserved = listing?.status === 'RESERVED';
  const isReservedForMe = !!listing?.reservedForCurrentUser;
  const isReservedForOther = isReserved && !isReservedForMe && !isOwner;
  const countdown = useCountdown(isReserved ? listing?.reservedUntil : null);

  const { data: reservedOfferAmount } = useQuery(getReservedOfferAmountOptions(
    listing?.reservedOfferId,
    !!(isReservedForMe && listing?.reservedOfferId),
  ));

  const effectivePrice
    = isReservedForMe && reservedOfferAmount
      ? reservedOfferAmount
      : (listing?.price ?? 0);

  const cancelReservation = useCancelMyListingReservationMutation();
  const deleteMutation = useDeleteMyListingMutation();

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

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Listing not found
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

        <div className="
          grid gap-8
          md:grid-cols-2
        "
        >
          <ImageGallery
            images={listing ? getListingMediaUrls(listing) : []}
            status={listing.status.toLowerCase()}
            title={listing.title}
          />

          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {listing.brand}
            </p>
            <h1 className="
              mt-2 font-heading text-3xl font-bold text-foreground
              md:text-4xl
            "
            >
              {listing.title}
            </h1>
            {isReservedForMe
              && reservedOfferAmount
              && reservedOfferAmount !== listing.price
              ? (
                  <div className="mt-4 flex items-baseline gap-3">
                    <p className="text-3xl font-bold text-foreground">
                      Rs
                      {' '}
                      {reservedOfferAmount.toLocaleString()}
                    </p>
                    <p className="text-lg text-muted-foreground line-through">
                      Rs
                      {' '}
                      {listing.price.toLocaleString()}
                    </p>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Your accepted offer
                    </span>
                  </div>
                )
              : (
                  <p className="mt-4 text-3xl font-bold text-foreground">
                    Rs
                    {' '}
                    {listing.price.toLocaleString()}
                  </p>
                )}

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                Size
                {' '}
                {listing.size}
              </span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
                {listing.condition.replace('_', ' ')}
              </span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
                {listing.categoryValue}
              </span>
              {listing.weight && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Weight className="h-3 w-3" />
                  {' '}
                  {getWeightLabel(listing.weight)}
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">
              {listing.description}
            </p>

            {isOwner && <MyListingFeedbackSection listingId={listing.id} />}

            {listing.status === 'SOLD' && !isOwner && (
              <div className="mt-8 rounded-lg border border-border bg-muted px-4 py-6 text-center">
                <p className="font-heading text-lg font-semibold text-foreground">
                  Sold
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This item has already been purchased and is no longer
                  available.
                </p>
                <Button
                  onClick={() => navigate('/listings')}
                  variant="outline"
                  className="mt-4"
                >
                  Browse other listings
                </Button>
              </div>
            )}

            {isReserved && (
              <div
                className="mt-6 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
              >
                {isReservedForMe
                  ? (
                      <p>
                        <span className="font-semibold text-primary">
                          Reserved for you.
                        </span>
                        {' '}
                        Complete your purchase within
                        {' '}
                        <span className="font-mono font-semibold text-foreground">
                          {countdown}
                        </span>
                        .
                      </p>
                    )
                  : isOwner
                    ? (
                        <p>
                          Reserved for an approved buyer · expires in
                          {' '}
                          <span className="font-mono font-semibold text-foreground">
                            {countdown}
                          </span>
                          .
                        </p>
                      )
                    : (
                        <p>
                          Currently reserved for another buyer · available again in
                          {' '}
                          <span className="font-mono font-semibold text-foreground">
                            {countdown}
                          </span>
                          .
                        </p>
                      )}
              </div>
            )}

            {isOwner
              ? (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button
                      onClick={() => navigate(`/edit-listing/${listing.id}`)}
                      size="lg"
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {' '}
                      Edit Listing
                    </Button>
                    {isReserved && (
                      <Button
                        onClick={() =>
                          cancelReservation.mutate(listing.id, {
                            onError: (error: any) =>
                              toast.error(error.message ?? 'Failed to cancel'),
                            onSuccess: () => toast.success('Reservation cancelled'),
                          })}
                        disabled={cancelReservation.isPending}
                        size="lg"
                        variant="outline"
                      >
                        Cancel reservation
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="lg"
                          variant="outline"
                          className="gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          {' '}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove "
                            {listing.title}
                            " and
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteMutation.mutate(id!, {
                                onError: () => toast.error('Failed to delete'),
                                onSuccess: () => {
                                  toast.success('Listing deleted');
                                  navigate('/my-listings');
                                },
                              })}
                            className="
                              bg-destructive text-destructive-foreground
                              hover:bg-destructive/90
                            "
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              : (listing.status === 'SOLD'
                  ? null
                  : (
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Button
                          onClick={() =>
                            addItem(
                              toCartListing(listing),
                              isReservedForMe ? effectivePrice : undefined,
                            )}
                          disabled={inCart || isReservedForOther}
                          size="lg"
                          className="min-w-0 flex-1 gap-2"
                        >
                          {inCart
                            ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  {' '}
                                  In Cart
                                </>
                              )
                            : (isReservedForOther
                                ? (
                                    <>Currently Reserved</>
                                  )
                                : (
                                    <>
                                      <ShoppingBag className="h-4 w-4" />
                                      {' '}
                                      {isReservedForMe ? 'Complete Purchase' : 'Add to Cart'}
                                    </>
                                  ))}
                        </Button>
                        {!isReserved && (
                          <MakeOfferButton
                            listingId={listing.id}
                            sellerId={listing.sellerId}
                            listingPrice={listing.price}
                            listingTitle={listing.title}
                          />
                        )}
                      </div>
                    ))}

            {!isOwner && (
              <div className="mt-3 flex justify-end gap-2">
                <ReportDialog
                  targetId={listing.id}
                  label="Report listing"
                  targetType="listing"
                />
                {listing.sellerId && (
                  <ReportDialog
                    targetId={listing.sellerId}
                    label="Report seller"
                    targetType="user"
                  />
                )}
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-secondary p-4">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Buyer Protection
                </p>
                <p className="text-xs text-muted-foreground">
                  Money-back guarantee if item isn't as described
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <p className="mt-4 text-sm text-muted-foreground">
                Sold by
                {' '}
                <Link
                  to={`/seller/${listing.sellerId}`}
                  className="
                    font-medium text-primary transition-colors
                    hover:underline
                  "
                >
                  {listing.seller?.fullName || 'Seller'}
                </Link>
              </p>
              {listing.sellerId && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Seller Reviews
                  </p>
                  <ReviewsList userId={listing.sellerId} limit={5} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ListingDetail;
