import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trackEvent } from '@/lib/analytics';
import { createOfferReview } from '@/services/offers.service';

const reviewSchema = z.object({
  comment: z.string().max(500).optional(),
  rating: z.number().min(1).max(5),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  listingId: string;
  offerId: string;
  reviewedId: string;
  onSuccess?: () => void;
  role: 'BUYER' | 'SELLER';
}

export function ReviewForm({
  listingId,
  offerId,
  reviewedId,
  onSuccess,
  role,
}: ReviewFormProps) {
  const queryClient = useQueryClient();
  const [hoveredRating, setHoveredRating] = useState(0);
  const form = useForm<ReviewFormValues>({
    defaultValues: {
      comment: '',
      rating: 0,
    },
    mode: 'all',
    resolver: zodResolver(reviewSchema),
  });
  const { control, handleSubmit, reset, watch } = form;
  const rating = watch('rating');

  const submitReview = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      await createOfferReview({
        listingId,
        offerId,
        reviewedId,
        comment: values.comment || undefined,
        rating: values.rating,
        role,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('You\'ve already reviewed this transaction');
      }
      else {
        toast.error(error.message ?? 'Failed to submit review');
      }
    },
    onSuccess: () => {
      trackEvent('review_submitted', {
        listing_id: listingId,
        offer_id: offerId,
        rating,
        role,
      });
      toast.success('Review submitted!');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      reset();
      onSuccess?.();
    },
  });

  const onSubmit: SubmitHandler<ReviewFormValues> = values =>
    submitReview.mutate(values);

  const displayRating = hoveredRating || rating;

  return (
    <div className="space-y-3">
      <Controller
        name="rating"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => field.onChange(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                type="button"
                className="
                  transition-transform
                  hover:scale-110
                "
              >
                <Star
                  className={`
                    h-6 w-6 transition-colors
                    ${
              star <= displayRating
                ? 'fill-primary text-primary'
                : 'text-muted-foreground/30'
              }
                  `}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {rating}
                /5
              </span>
            )}
          </div>
        )}
      />
      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Textarea
            maxLength={500}
            placeholder="Share your experience (optional)"
            rows={2}
            {...field}
          />
        )}
      />
      <Button
        onClick={handleSubmit(onSubmit)}
        disabled={rating === 0 || submitReview.isPending}
        size="sm"
        className="gap-1.5"
      >
        {submitReview.isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        )}
        Submit Review
      </Button>
    </div>
  );
}
