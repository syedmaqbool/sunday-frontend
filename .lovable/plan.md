

## Add Photos & Video to Reviews

Let buyers attach up to 5 images and 1 short video when leaving a review. Media renders in the seller's review section.

### Database

Migration to extend `reviews`:
- `image_urls text[] not null default '{}'`
- `video_url text` (nullable)

Migration to create a public storage bucket `review-media` with RLS:
- Anyone can read (public bucket)
- Authenticated users can upload only to a path prefixed with their `auth.uid()`
- Users can delete only their own files

### Upload UI (`src/components/OrderItemReview.tsx`)

Below the comment textarea, add two controls:
- **Photos**: file input (`accept="image/*"`, multiple), max 5, ~5MB each. Shows thumbnail previews with remove (X) button per image.
- **Video**: file input (`accept="video/*"`), max 1, ~30MB, ~60s. Shows preview with remove button.

Submission flow:
1. Upload selected files to `review-media/{user.id}/{reviewId-or-uuid}/...` via `supabase.storage`.
2. Collect public URLs.
3. Insert review row with `image_urls` and `video_url`.
4. Toast errors on oversize / wrong type / upload failure; rollback uploaded files if insert fails.

State: `images: File[]`, `video: File | null`, `uploading: boolean`. Disable Submit while uploading.

### Display (`src/components/ReviewsList.tsx`)

After the comment text, render media when present:
- Image grid (2–3 columns of square thumbnails). Click opens full image in a `Dialog` lightbox.
- Video below images with native `<video controls>` (max-height ~280px).

Update the `Review` interface and select query to include `image_urls` and `video_url`.

### Files

- `supabase/migrations/<ts>_review_media.sql` — add columns + create bucket + RLS policies
- `src/components/OrderItemReview.tsx` — upload UI + storage upload logic
- `src/components/ReviewsList.tsx` — render images + video

### Limits (enforced client-side, validated by size in storage)

- Images: up to 5, JPEG/PNG/WebP, ≤5MB each
- Video: 1, MP4/WebM/MOV, ≤30MB

