
CREATE TABLE public.listing_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  feedback text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feedback"
  ON public.listing_feedback FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view feedback on own listings"
  ON public.listing_feedback FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_feedback.listing_id AND l.seller_id = auth.uid()
  ));

CREATE INDEX idx_listing_feedback_listing_id ON public.listing_feedback(listing_id);
