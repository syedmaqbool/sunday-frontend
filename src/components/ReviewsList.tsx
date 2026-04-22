import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ReviewsListProps {
  userId: string;
  limit?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  role: string;
  created_at: string;
  image_urls: string[] | null;
  video_url: string | null;
  reviewer_profile: { full_name: string | null } | null;
  listing: { title: string } | null;
}

export const ReviewsList = ({ userId, limit = 10 }: ReviewsListProps) => {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const reviewerIds = [...new Set((data ?? []).map((r: any) => r.reviewer_id))];
      const listingIds = [...new Set((data ?? []).map((r: any) => r.listing_id))];

      const [profilesRes, listingsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", reviewerIds),
        supabase.from("listings").select("id, title").in("id", listingIds),
      ]);

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
      const listingMap = new Map((listingsRes.data ?? []).map((l) => [l.id, l]));

      return (data ?? []).map((r: any) => ({
        ...r,
        reviewer_profile: profileMap.get(r.reviewer_id) ?? null,
        listing: listingMap.get(r.listing_id) ?? null,
      })) as Review[];
    },
    enabled: !!userId,
  });

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) return null;
  if (reviews.length === 0) return <p className="text-sm text-muted-foreground">No reviews yet</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${
                s <= Math.round(Number(avgRating))
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-foreground">{avgRating}</span>
        <span className="text-sm text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-border bg-secondary/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${
                        s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-foreground">
                  {review.reviewer_profile?.full_name || "User"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">({review.role})</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "MMM d, yyyy")}
              </span>
            </div>
            {review.comment && (
              <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
            )}

            {review.image_urls && review.image_urls.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {review.image_urls.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightbox(url)}
                    className="aspect-square overflow-hidden rounded-md border border-border transition-opacity hover:opacity-90"
                  >
                    <img src={url} alt="Review" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {review.video_url && (
              <video
                controls
                src={review.video_url}
                className="mt-2 max-h-[280px] w-full rounded-md border border-border bg-black"
              />
            )}

            {review.listing && (
              <p className="mt-1.5 text-xs text-muted-foreground/70">Re: {review.listing.title}</p>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          {lightbox && (
            <img src={lightbox} alt="Review" className="h-auto w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-3.5 w-3.5 ${
          s <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"
        }`}
      />
    ))}
  </div>
);
