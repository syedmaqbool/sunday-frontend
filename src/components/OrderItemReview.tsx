import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ImagePlus, Loader2, Star, Video, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getOrderItemReviewOptions } from '@/queries/useReview';

interface OrderItemReviewProps {
  listingId: string;
  orderId: string;
  sellerId: string;
  sellerName?: string;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export function OrderItemReview({
  listingId,
  orderId,
  sellerId,
  sellerName,
}: OrderItemReviewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const imageInputReference = useRef<HTMLInputElement>(null);
  const videoInputReference = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading } = useQuery(
    getOrderItemReviewOptions(orderId, listingId, user?.id, sellerId),
  );

  const handleAddImages = (files: FileList | null) => {
    if (!files)
      return;
    const incoming = [...files];
    const valid: File[] = [];
    for (const f of incoming) {
      if (!IMAGE_TYPES.has(f.type)) {
        toast.error(`${f.name}: unsupported image type`);
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        toast.error(`${f.name}: exceeds 5MB`);
        continue;
      }
      valid.push(f);
    }
    setImages((previous) => {
      const next = [...previous, ...valid].slice(0, MAX_IMAGES);
      if (previous.length + valid.length > MAX_IMAGES) {
        toast.error(`Max ${MAX_IMAGES} images`);
      }
      return next;
    });
    if (imageInputReference.current)
      imageInputReference.current.value = '';
  };

  const handleAddVideo = (files: FileList | null) => {
    if (!files || !files[0])
      return;
    const f = files[0];
    if (!VIDEO_TYPES.has(f.type)) {
      toast.error('Unsupported video type (use MP4, WebM, MOV)');
      return;
    }
    if (f.size > MAX_VIDEO_SIZE) {
      toast.error('Video exceeds 30MB');
      return;
    }
    setVideo(f);
    if (videoInputReference.current)
      videoInputReference.current.value = '';
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user)
        throw new Error('Not signed in');
      const folder = `${user.id}/${orderId}-${listingId}-${Date.now()}`;
      const uploadedPaths: string[] = [];
      const imageUrls: string[] = [];
      let videoUrl: string | null = null;

      try {
        for (const [index, file] of images.entries()) {
          const extension = file.name.split('.').pop() || 'jpg';
          const path = `${folder}/img-${index}-${crypto.randomUUID()}.${extension}`;
          const { error: upError } = await supabase.storage
            .from('review-media')
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upError)
            throw upError;
          uploadedPaths.push(path);
          const { data: pub } = supabase.storage
            .from('review-media')
            .getPublicUrl(path);
          imageUrls.push(pub.publicUrl);
        }

        if (video) {
          const extension = video.name.split('.').pop() || 'mp4';
          const path = `${folder}/video-${crypto.randomUUID()}.${extension}`;
          const { error: upError } = await supabase.storage
            .from('review-media')
            .upload(path, video, { contentType: video.type, upsert: false });
          if (upError)
            throw upError;
          uploadedPaths.push(path);
          const { data: pub } = supabase.storage
            .from('review-media')
            .getPublicUrl(path);
          videoUrl = pub.publicUrl;
        }

        const { error } = await supabase.from('reviews').insert({
          comment,
          image_urls: imageUrls,
          listing_id: listingId,
          order_id: orderId,
          rating,
          reviewed_id: sellerId,
          reviewer_id: user.id,
          role: 'buyer',
          video_url: videoUrl,
        });
        if (error)
          throw error;
      }
      catch (error) {
        // Rollback uploads
        if (uploadedPaths.length > 0) {
          await supabase.storage.from('review-media').remove(uploadedPaths);
        }
        throw error;
      }
    },
    onError: (error: any) => {
      toast.error(
        error.message?.includes('duplicate')
          ? 'Already reviewed'
          : error.message || 'Failed to submit review',
      );
    },
    onSuccess: () => {
      toast.success('Review submitted');
      queryClient.invalidateQueries({
        queryKey: ['order-review', orderId, listingId],
      });
      queryClient.invalidateQueries({ queryKey: ['reviews', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-rating', sellerId] });
      setOpen(false);
      setImages([]);
      setVideo(null);
      setComment('');
      setRating(0);
    },
  });

  if (!sellerId || isLoading)
    return null;

  if (existing) {
    return (
      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        Reviewed
        <div className="ml-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              className={`
                h-3 w-3
                ${
            s <= existing.rating
              ? 'fill-primary text-primary'
              : 'text-muted-foreground/30'
            }
              `}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        type="button"
        className="
          mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary
          hover:underline
        "
      >
        <Star className="h-3.5 w-3.5" />
        Leave review
        {sellerName ? ` for ${sellerName}` : ''}
      </button>
    );
  }

  const display = hovered || rating;
  const uploading = submit.isPending;

  return (
    <div className="mt-2 space-y-2 rounded-md border border-border bg-secondary/50 p-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            type="button"
            className="
              transition-transform
              hover:scale-110
            "
          >
            <Star
              className={`
                h-5 w-5 transition-colors
                ${
          star <= display
            ? 'fill-primary text-primary'
            : 'text-muted-foreground/30'
          }
              `}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
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
        className="text-sm"
      />

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((file, index) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={file.name}
                className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() =>
                    setImages(previous => previous.filter((_, index_) => index_ !== index))}
                  aria-label="Remove image"
                  type="button"
                  className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground shadow"
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
            muted
            className="h-24 rounded-md border border-border"
          />
          <button
            onClick={() => setVideo(null)}
            aria-label="Remove video"
            type="button"
            className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 text-foreground shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload triggers */}
      <div className="flex flex-wrap gap-2">
        <input
          onChange={event => handleAddImages(event.target.files)}
          ref={imageInputReference}
          accept="image/jpeg,image/png,image/webp"
          multiple
          type="file"
          className="hidden"
        />
        <Button
          onClick={() => imageInputReference.current?.click()}
          disabled={images.length >= MAX_IMAGES || uploading}
          size="sm"
          type="button"
          variant="outline"
          className="gap-1.5"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Photos
          {' '}
          {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
        </Button>

        <input
          onChange={event => handleAddVideo(event.target.files)}
          ref={videoInputReference}
          accept="video/mp4,video/webm,video/quicktime"
          type="file"
          className="hidden"
        />
        <Button
          onClick={() => videoInputReference.current?.click()}
          disabled={!!video || uploading}
          size="sm"
          type="button"
          variant="outline"
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
          onClick={() => submit.mutate()}
          disabled={rating === 0 || uploading}
          size="sm"
          className="gap-1.5"
        >
          {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {uploading ? 'Uploading...' : 'Submit'}
        </Button>
        <Button
          onClick={() => setOpen(false)}
          disabled={uploading}
          size="sm"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
