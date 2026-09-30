import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ImagePlus, Loader2, Star, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast } from '@/lib/errorToast';
import { getUploadedFileUrl, uploadFile } from '@/lib/uploadFile';
import {
  getOrderItemReviewOptions,
  useCreateOrderItemReviewMutation,
} from '@/queries/review.query';

interface OrderItemReviewProps {
  listingId: string;
  orderId: string;
  orderItemId: string;
  sellerId: string;
  sellerName?: string;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const reviewMediaFileSchema = z.custom<File>(value => typeof File !== 'undefined' && value instanceof File);

const orderReviewSchema = z.object({
  comment: z.string().max(500).optional(),
  images: z.array(reviewMediaFileSchema),
  rating: z.number().min(1).max(5),
  video: reviewMediaFileSchema.nullable(),
});

type OrderReviewFormValues = z.infer<typeof orderReviewSchema>;

export function OrderItemReview({
  listingId,
  orderId,
  orderItemId,
  sellerId,
  sellerName,
}: OrderItemReviewProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const imageInputReference = useRef<HTMLInputElement>(null);
  const videoInputReference = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!videoPreviewUrl)
      return;

    return () => URL.revokeObjectURL(videoPreviewUrl);
  }, [videoPreviewUrl]);

  const form = useForm<OrderReviewFormValues>({
    defaultValues: {
      comment: '',
      images: [],
      rating: 0,
      video: null,
    },
    mode: 'all',
    resolver: zodResolver(orderReviewSchema),
  });
  const { control, handleSubmit, reset, setValue, watch } = form;
  const rating = watch('rating');
  const images = watch('images');
  const video = watch('video');

  const { data: existingResponse, isLoading } = useQuery(getOrderItemReviewOptions(orderId, listingId, user?.id, sellerId));
  const existing = (existingResponse?.data ?? []).find(
    review => review.listingId === listingId,
  ) ?? null;

  const handleAddImages = (files: FileList | null, currentImages: File[], onChange: (files: File[]) => void) => {
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
    const next = [...currentImages, ...valid].slice(0, MAX_IMAGES);
    if (currentImages.length + valid.length > MAX_IMAGES)
      toast.error(`Max ${MAX_IMAGES} images`);
    onChange(next);
    if (imageInputReference.current)
      imageInputReference.current.value = '';
  };

  const handleAddVideo = (files: FileList | null, onChange: (file: File) => void) => {
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
    onChange(f);
    setVideoPreviewUrl(URL.createObjectURL(f));
    if (videoInputReference.current)
      videoInputReference.current.value = '';
  };

  const submit = useCreateOrderItemReviewMutation(user?.id, sellerId);

  const onSubmit: SubmitHandler<OrderReviewFormValues> = async (values) => {
    try {
      const imageUrls: string[] = [];
      let videoUrl: string | undefined;

      for (const file of values.images) {
        const { data } = await uploadFile(file);
        imageUrls.push(getUploadedFileUrl(data));
      }

      if (values.video) {
        const { data } = await uploadFile(values.video);
        videoUrl = getUploadedFileUrl(data);
      }

      submit.mutate(
        {
          listingId,
          orderId,
          orderItemId,
          comment: values.comment || undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          rating: values.rating,
          videoUrl,
        },
        {
          onError: (error: any) => showErrorToast(error, 'Failed to submit review'),
          onSuccess: () => {
            toast.success('Review submitted');
            setOpen(false);
            setVideoPreviewUrl(null);
            reset();
          },
        },
      );
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to upload review media');
    }
  };

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
      <Controller
        name="rating"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => field.onChange(star)}
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
            className="text-sm"
            {...field}
          />
        )}
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
                    setValue('images', images.filter((_, index_) => index_ !== index), { shouldDirty: true, shouldValidate: true })}
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
      {video && videoPreviewUrl && (
        <div className="relative inline-block">
          <video
            src={videoPreviewUrl}
            muted
            className="h-24 rounded-md border border-border"
          />
          <button
            onClick={() => {
              setValue('video', null, { shouldDirty: true, shouldValidate: true });
              setVideoPreviewUrl(null);
            }}
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
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <input
              onChange={event => handleAddImages(event.target.files, field.value, field.onChange)}
              ref={(element) => {
                field.ref(element);
                imageInputReference.current = element;
              }}
              accept="image/jpeg,image/png,image/webp"
              multiple
              type="file"
              className="hidden"
            />
          )}
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

        <Controller
          name="video"
          control={control}
          render={({ field }) => (
            <input
              onChange={event => handleAddVideo(event.target.files, file => field.onChange(file))}
              ref={(element) => {
                field.ref(element);
                videoInputReference.current = element;
              }}
              accept="video/mp4,video/webm,video/quicktime"
              type="file"
              className="hidden"
            />
          )}
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
          onClick={handleSubmit(onSubmit)}
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
