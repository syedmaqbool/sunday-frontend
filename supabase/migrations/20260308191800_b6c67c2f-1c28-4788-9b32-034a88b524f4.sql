
-- Add weight column to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS weight numeric DEFAULT null;

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload to listing-images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-images');

-- Allow public read access
CREATE POLICY "Public read access for listing images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'listing-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update own listing images
CREATE POLICY "Users can update own listing images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Allow users to delete their own listings
CREATE POLICY "Users can delete own listings"
ON public.listings FOR DELETE TO authenticated
USING (seller_id = auth.uid());
