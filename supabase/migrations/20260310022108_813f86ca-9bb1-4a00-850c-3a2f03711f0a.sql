
-- Reviews table for buyer/seller ratings
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  reviewed_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  role text NOT NULL CHECK (role IN ('buyer', 'seller')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (reviewer_id, offer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

-- Users can create reviews for transactions they were part of
CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
        AND o.status = 'accepted'
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
