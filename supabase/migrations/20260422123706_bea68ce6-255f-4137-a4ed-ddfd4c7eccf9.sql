-- Add media columns to reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text;

-- Create public storage bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for review-media
CREATE POLICY "Review media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-media');

CREATE POLICY "Users can upload own review media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own review media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own review media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);