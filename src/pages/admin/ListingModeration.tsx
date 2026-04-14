import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, Eye, ChevronLeft, ChevronRight, Weight, Tag, Ruler, Package, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ListingRow {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  condition: string;
  size: string;
  price: number;
  weight: number | null;
  images: string[];
  status: string;
  seller_id: string;
  created_at: string;
}

const DetailGallery = ({ images }: { images: string[] }) => {
  const [idx, setIdx] = useState(0);
  if (!images.length) return <div className="aspect-square rounded-lg bg-muted" />;

  return (
    <div className="space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <img src={images[idx]} alt="" className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIdx((p) => (p + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
              {idx + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition ${i === idx ? "border-primary" : "border-transparent opacity-50 hover:opacity-100"}`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ListingModeration = () => {
  const [filter, setFilter] = useState("pending");
  const [reviewListing, setReviewListing] = useState<ListingRow | null>(null);
  const [feedback, setFeedback] = useState("");
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-listings", filter],
    queryFn: async () => {
      let q = supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ListingRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_feedback }: { id: string; status: string; admin_feedback?: string }) => {
      // Update listing status (also keep admin_feedback column for quick access)
      const updateData: Record<string, unknown> = { status };
      if (admin_feedback !== undefined) updateData.admin_feedback = admin_feedback;
      if (status === "approved") updateData.admin_feedback = null;
      const { error } = await supabase.from("listings").update(updateData).eq("id", id);
      if (error) throw error;

      // Insert into feedback history if feedback provided
      if (admin_feedback) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("listing_feedback").insert({
            listing_id: id,
            admin_id: user.id,
            feedback: admin_feedback,
          } as any);
        }
      }
    },
    onSuccess: (_, { status }) => {
      toast.success(`Listing ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["listing-feedback"] });
      setReviewListing(null);
      setFeedback("");
    },
    onError: () => toast.error("Failed to update listing"),
  });

  const statusColor = (s: string) => {
    if (s === "approved") return "default" as const;
    if (s === "rejected") return "destructive" as const;
    return "secondary" as const;
  };

  // Navigate to next pending listing in review modal
  const pendingListings = listings.filter((l) => l.status === "pending");
  const currentReviewIdx = reviewListing ? pendingListings.findIndex((l) => l.id === reviewListing.id) : -1;
  const goToNext = () => {
    if (currentReviewIdx >= 0 && currentReviewIdx < pendingListings.length - 1) {
      setReviewListing(pendingListings[currentReviewIdx + 1]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Listing Moderation</h1>
          <p className="mt-1 text-muted-foreground">
            Review listings to verify photos match descriptions
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-8 text-center text-muted-foreground">No listings found</div>
      ) : (
        <div className="mt-6 space-y-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="group">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <img
                  src={listing.images?.[0] || "/placeholder.svg"}
                  alt={listing.title}
                  className="h-20 w-20 rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{listing.title}</h3>
                    <Badge variant={statusColor(listing.status)}>{listing.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {listing.brand} · {listing.category} · R {listing.price.toLocaleString()}
                    {listing.images?.length > 1 && ` · ${listing.images.length} photos`}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{listing.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setReviewListing(listing)}
                  >
                    <Eye className="h-4 w-4" /> Review
                  </Button>
                  {listing.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-primary"
                      onClick={() => updateStatus.mutate({ id: listing.id, status: "approved" })}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {listing.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                      onClick={() => updateStatus.mutate({ id: listing.id, status: "rejected" })}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full review modal */}
      <Dialog open={!!reviewListing} onOpenChange={(open) => !open && setReviewListing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {reviewListing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="font-heading text-xl">{reviewListing.title}</DialogTitle>
                  <Badge variant={statusColor(reviewListing.status)}>{reviewListing.status}</Badge>
                </div>
              </DialogHeader>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {/* Images */}
                <DetailGallery images={reviewListing.images || []} />

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">{reviewListing.description || "No description provided"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">Brand</p>
                        <p className="text-sm font-semibold text-foreground">{reviewListing.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">Category</p>
                        <p className="text-sm font-semibold capitalize text-foreground">{reviewListing.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">Size</p>
                        <p className="text-sm font-semibold text-foreground">{reviewListing.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">Condition</p>
                        <p className="text-sm font-semibold capitalize text-foreground">{reviewListing.condition.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Price</p>
                      <p className="text-2xl font-bold text-foreground">R {reviewListing.price.toLocaleString()}</p>
                    </div>
                    {reviewListing.weight && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Weight className="h-4 w-4" />
                        <span className="text-sm">{reviewListing.weight}kg</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Submitted {format(new Date(reviewListing.created_at), "MMM d, yyyy 'at' h:mm a")}
                    <br />
                    Seller ID: {reviewListing.seller_id.slice(0, 8)}…
                  </div>

                  {/* Previous feedback history */}
                  {reviewListing && <FeedbackHistorySection listingId={reviewListing.id} />}

                  {/* New Feedback */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Feedback</p>
                    </div>
                    <Textarea
                      placeholder="Provide feedback to the seller (optional for approval, recommended for rejection)..."
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>

                  {/* Moderation actions */}
                  <div className="flex gap-3">
                    {reviewListing.status !== "approved" && (
                      <Button
                        className="flex-1 gap-2"
                        onClick={() => {
                          updateStatus.mutate({ id: reviewListing.id, status: "approved", admin_feedback: feedback || undefined });
                          goToNext();
                        }}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                    )}
                    {reviewListing.status !== "rejected" && (
                      <Button
                        variant="destructive"
                        className="flex-1 gap-2"
                        onClick={() => {
                          updateStatus.mutate({ id: reviewListing.id, status: "rejected", admin_feedback: feedback });
                          goToNext();
                        }}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    )}
                  </div>

                  {currentReviewIdx >= 0 && pendingListings.length > 1 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Reviewing {currentReviewIdx + 1} of {pendingListings.length} pending
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListingModeration;
