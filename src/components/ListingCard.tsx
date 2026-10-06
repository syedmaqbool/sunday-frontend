import type { MarketplaceListing } from '@/queries/marketplace.query';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import SellerByline from '@/components/SellerByline';
import SellerCouponEstimateDisplay from '@/components/SellerCouponEstimateDisplay';
import { formatEnumLabel } from '@/lib/utilities';
import { getListingMediaUrls } from '@/queries/marketplace.query';

interface ListingCardProps {
  index?: number;
  listing: MarketplaceListing | {
    id: string;
    brand: string;
    condition: string;
    images?: string[];
    price: number;
    sellerCouponEstimate?: NonNullable<MarketplaceListing['sellerCouponEstimate']>;
    size: string;
    status: string;
    title: string;
  };
  sellerRating?: { avgRating: number; totalReviews: number } | null;
  showSellerByline?: boolean;
}

function ListingCard({
  index = 0,
  listing,
  sellerRating,
  showSellerByline = false,
}: ListingCardProps) {
  const image = 'categoryId' in listing
    ? getListingMediaUrls(listing)[0]
    : listing.images?.find((value): value is string => typeof value === 'string');
  const status = listing.status.toLowerCase();
  const previewImage = image || '/placeholder.svg';
  const seller = 'seller' in listing ? listing.seller : undefined;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <div className="group relative">
        <Link
          aria-label={listing.title}
          to={`/listing/${listing.id}`}
          className="
            absolute inset-0 z-10 block rounded-md
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          "
        />
        <div className="pointer-events-none relative">
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
            <img
              src={previewImage}
              alt={listing.title}
              loading="lazy"
              className={`
                h-full w-full object-cover transition-transform duration-500
                group-hover:scale-105
                ${
    status === 'sold' || status === 'reserved'
      ? 'opacity-60 grayscale'
      : ''
    }
              `}
            />
            {status === 'sold' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-md bg-foreground/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-background backdrop-blur">
                  Sold
                </span>
              </div>
            )}
            {status === 'reserved' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-md bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground backdrop-blur">
                  Reserved
                </span>
              </div>
            )}
            <div className="absolute bottom-2 left-2">
              <span className="rounded-sm bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
                {formatEnumLabel(listing.condition)}
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {listing.brand}
            </p>
            <h3 className="line-clamp-1 text-sm font-medium leading-tight text-foreground">
              {listing.title}
            </h3>
            <p className="text-sm font-semibold text-foreground">
              Rs
              {' '}
              {listing.price.toLocaleString()}
            </p>
            <SellerCouponEstimateDisplay estimate={listing.sellerCouponEstimate} status={listing.status} />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Size
                {listing.size}
              </p>
              {sellerRating && sellerRating.totalReviews > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    {sellerRating.avgRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            {showSellerByline && seller && (
              <SellerByline sellerId={seller.id} sellerName={seller.fullName} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ListingCard;
