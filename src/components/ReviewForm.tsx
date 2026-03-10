import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  offerId: string;
  listingId: string;
  reviewedId: string;
  role: "buyer" | "seller";
  onSuccess?: () => void;
}

export const ReviewForm = ({ offerId, listingId, reviewedId, role, onSuccess }: ReviewFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        listing_id: listingId,
        offer_id: offerId,
        rating,
        comment,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted!");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      onSuccess?.();
    },
    onError: (e: any) => {
      if (e.message?.includes("duplicate")) {
        toast.error("You've already reviewed this transaction");
      } else {
        toast.error("Failed to submit review");
      }
    },
  });

  const displayRating = hoveredRating || rating;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= displayRating
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
        )}
      </div>
      <Textarea
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
      />
      <Button
        size="sm"
        disabled={rating === 0 || submitReview.isPending}
        onClick={() => submitReview.mutate()}
        className="gap-1.5"
      >
        {submitReview.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Submit Review
      </Button>
    </div>
  );
};
