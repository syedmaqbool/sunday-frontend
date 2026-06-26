import type { MarketplaceListing } from '@/queries/useMarketplace';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getListingMediaUrls } from '@/queries/useMarketplace';

interface ListingCardProps {
  index?: number;
  listing: MarketplaceListing | {
    id: string;
    brand: string;
    condition: string;
    images?: string[];
    price: number;
    size: string;
    status: string;
    title: string;
  };
  sellerRating?: { avgRating: number; totalReviews: number } | null;
}

function ListingCard({
  index = 0,
  listing,
  sellerRating,
}: ListingCardProps) {
  const image = 'imageUrls' in listing || 'media' in listing || 'coverImageUrl' in listing
    ? getListingMediaUrls(listing)[0]
    : listing.images?.[0];
  const status = listing.status.toLowerCase();
  const previewImage = image || '/placeholder.svg';

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link to={`/listing/${listing.id}`} className="group block">
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
              {listing.condition.replace('_', ' ')}
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
        </div>
      </Link>
    </motion.div>
  );
}

export default ListingCard;
