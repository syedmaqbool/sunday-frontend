import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface OrderItemReviewProps {
  orderId: string;
  listingId: string;
  sellerId: string;
  sellerName?: string;
}

export const OrderItemReview = ({ orderId, listingId, sellerId, sellerName }: OrderItemReviewProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  const { data: existing, isLoading } = useQuery({
    queryKey: ["order-review", orderId, listingId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating")
        .eq("reviewer_id", user!.id)
        .eq("order_id", orderId)
        .eq("listing_id", listingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!sellerId,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user.id,
        reviewed_id: sellerId,
        listing_id: listingId,
        order_id: orderId,
        rating,
        comment,
        role: "buyer",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted");
      queryClient.invalidateQueries({ queryKey: ["order-review", orderId, listingId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", sellerId] });
      queryClient.invalidateQueries({ queryKey: ["seller-rating", sellerId] });
      setOpen(false);
    },
    onError: (e: any) => {
      toast.error(e.message?.includes("duplicate") ? "Already reviewed" : "Failed to submit review");
    },
  });

  if (!sellerId || isLoading) return null;

  if (existing) {
    return (
      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        Reviewed
        <div className="ml-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${
                s <= existing.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Star className="h-3.5 w-3.5" />
        Leave review{sellerName ? ` for ${sellerName}` : ""}
      </button>
    );
  }

  const display = hovered || rating;

  return (
    <div className="mt-2 space-y-2 rounded-md border border-border bg-secondary/50 p-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= display ? "fill-primary text-primary" : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-1 text-xs text-muted-foreground">{rating}/5</span>}
      </div>
      <Textarea
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={rating === 0 || submit.isPending}
          onClick={() => submit.mutate()}
          className="gap-1.5"
        >
          {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Submit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
