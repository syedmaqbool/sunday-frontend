import { useQuery } from '@tanstack/react-query';

import { format } from 'date-fns';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getUserReviewsOptions } from '@/queries/review.query';

interface ReviewsListProps {
  userId: string;
  limit?: number;
}

export function ReviewsList({ userId, limit = 10 }: ReviewsListProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery(getUserReviewsOptions(userId, limit));

  if (isLoading)
    return null;
  if (reviews.length === 0)
    return <p className="text-sm text-muted-foreground">No reviews yet</p>;

  const avgRating = (
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              className={`
                h-4 w-4
                ${
            s <= Math.round(Number(avgRating))
              ? 'fill-primary text-primary'
              : 'text-muted-foreground/30'
            }
              `}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-foreground">{avgRating}</span>
        <span className="text-sm text-muted-foreground">
          (
          {reviews.length}
          {' '}
          review
          {reviews.length === 1 ? '' : 's'}
          )
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map(review => (
          <div
            key={review.id}
            className="rounded-lg border border-border bg-secondary/50 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`
                        h-3 w-3
                        ${
                    s <= review.rating
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'
                    }
                      `}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-foreground">
                  {review.reviewerFullName || 'User'}
                </span>
                <span className="text-xs capitalize text-muted-foreground">
                  (
                  {review.role}
                  )
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            {review.comment && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {review.comment}
              </p>
            )}

            {review.imageUrls && review.imageUrls.length > 0 && (
              <div className="
                mt-2 grid grid-cols-3 gap-1.5
                sm:grid-cols-4
              "
              >
                {review.imageUrls.map(url => (
                  <button
                    key={url}
                    onClick={() => setLightbox(url)}
                    type="button"
                    className="
                      aspect-square overflow-hidden rounded-md border border-border transition-opacity
                      hover:opacity-90
                    "
                  >
                    <img
                      src={url}
                      alt="Review"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {review.videoUrl && (
              <video
                src={review.videoUrl}
                controls
                className="mt-2 max-h-[280px] w-full rounded-md border border-border bg-black"
              />
            )}

            {review.listingTitle && (
              <p className="mt-1.5 text-xs text-muted-foreground/70">
                Re:
                {' '}
                {review.listingTitle}
              </p>
            )}
          </div>
        ))}
      </div>

      <Dialog onOpenChange={o => !o && setLightbox(null)} open={!!lightbox}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          {lightbox && (
            <img
              src={lightbox}
              alt="Review"
              className="h-auto w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`
            h-3.5 w-3.5
            ${
        s <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
        }
          `}
        />
      ))}
    </div>
  );
}
