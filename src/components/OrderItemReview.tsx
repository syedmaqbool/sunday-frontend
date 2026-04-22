import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, CheckCircle2, ImagePlus, Video, X } from "lucide-react";
import { toast } from "sonner";

interface OrderItemReviewProps {
  orderId: string;
  listingId: string;
  sellerId: string;
  sellerName?: string;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const OrderItemReview = ({ orderId, listingId, sellerId, sellerName }: OrderItemReviewProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!IMAGE_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported image type`);
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        toast.error(`${f.name}: exceeds 5MB`);
        continue;
      }
      valid.push(f);
    }
    setImages((prev) => {
      const next = [...prev, ...valid].slice(0, MAX_IMAGES);
      if (prev.length + valid.length > MAX_IMAGES) {
        toast.error(`Max ${MAX_IMAGES} images`);
      }
      return next;
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleAddVideo = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    if (!VIDEO_TYPES.includes(f.type)) {
      toast.error("Unsupported video type (use MP4, WebM, MOV)");
      return;
    }
    if (f.size > MAX_VIDEO_SIZE) {
      toast.error("Video exceeds 30MB");
      return;
    }
    setVideo(f);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const folder = `${user.id}/${orderId}-${listingId}-${Date.now()}`;
      const uploadedPaths: string[] = [];
      const imageUrls: string[] = [];
      let videoUrl: string | null = null;

      try {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${folder}/img-${i}-${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("review-media")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) throw upErr;
          uploadedPaths.push(path);
          const { data: pub } = supabase.storage.from("review-media").getPublicUrl(path);
          imageUrls.push(pub.publicUrl);
        }

        if (video) {
          const ext = video.name.split(".").pop() || "mp4";
          const path = `${folder}/video-${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("review-media")
            .upload(path, video, { contentType: video.type, upsert: false });
          if (upErr) throw upErr;
          uploadedPaths.push(path);
          const { data: pub } = supabase.storage.from("review-media").getPublicUrl(path);
          videoUrl = pub.publicUrl;
        }

        const { error } = await supabase.from("reviews").insert({
          reviewer_id: user.id,
          reviewed_id: sellerId,
          listing_id: listingId,
          order_id: orderId,
          rating,
          comment,
          role: "buyer",
          image_urls: imageUrls,
          video_url: videoUrl,
        });
        if (error) throw error;
      } catch (err) {
        // Rollback uploads
        if (uploadedPaths.length) {
          await supabase.storage.from("review-media").remove(uploadedPaths);
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Review submitted");
      queryClient.invalidateQueries({ queryKey: ["order-review", orderId, listingId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", sellerId] });
      queryClient.invalidateQueries({ queryKey: ["seller-rating", sellerId] });
      setOpen(false);
      setImages([]);
      setVideo(null);
      setComment("");
      setRating(0);
    },
    onError: (e: any) => {
      toast.error(e.message?.includes("duplicate") ? "Already reviewed" : e.message || "Failed to submit review");
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
  const uploading = submit.isPending;

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

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground shadow"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Video preview */}
      {video && (
        <div className="relative inline-block">
          <video
            src={URL.createObjectURL(video)}
            className="h-24 rounded-md border border-border"
            muted
          />
          <button
            type="button"
            onClick={() => setVideo(null)}
            className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 text-foreground shadow"
            aria-label="Remove video"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload triggers */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleAddImages(e.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => imageInputRef.current?.click()}
          disabled={images.length >= MAX_IMAGES || uploading}
          className="gap-1.5"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Photos {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
        </Button>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => handleAddVideo(e.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => videoInputRef.current?.click()}
          disabled={!!video || uploading}
          className="gap-1.5"
        >
          <Video className="h-3.5 w-3.5" />
          Video
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Up to 5 photos (JPEG/PNG/WebP, ≤5MB) and 1 video (MP4/WebM/MOV, ≤30MB)
      </p>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={rating === 0 || uploading}
          onClick={() => submit.mutate()}
          className="gap-1.5"
        >
          {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {uploading ? "Uploading..." : "Submit"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={uploading}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
