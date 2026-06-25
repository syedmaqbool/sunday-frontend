import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';

interface ReviewFormProps {
  listingId: string;
  offerId: string;
  reviewedId: string;
  onSuccess?: () => void;
  role: 'buyer' | 'seller';
}

export function ReviewForm({
  listingId,
  offerId,
  reviewedId,
  onSuccess,
  role,
}: ReviewFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user)
        throw new Error('Must be logged in');
      const { error } = await supabase.from('reviews').insert({
        comment,
        listing_id: listingId,
        offer_id: offerId,
        rating,
        reviewed_id: reviewedId,
        reviewer_id: user.id,
        role,
      });
      if (error)
        throw error;
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('You\'ve already reviewed this transaction');
      }
      else {
        toast.error('Failed to submit review');
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
      onSuccess?.();
    },
  });

  const displayRating = hoveredRating || rating;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
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
      <Textarea
        onChange={event => setComment(event.target.value)}
        value={comment}
        maxLength={500}
        placeholder="Share your experience (optional)"
        rows={2}
      />
      <Button
        onClick={() => submitReview.mutate()}
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
