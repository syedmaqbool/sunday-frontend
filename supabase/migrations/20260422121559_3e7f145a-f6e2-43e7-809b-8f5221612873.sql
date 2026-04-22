
-- Allow reviews to be tied to an order (not just an offer)
ALTER TABLE public.reviews ADD COLUMN order_id uuid;
ALTER TABLE public.reviews ALTER COLUMN offer_id DROP NOT NULL;

-- Ensure exactly one of offer_id/order_id is set
ALTER TABLE public.reviews ADD CONSTRAINT reviews_offer_or_order_chk
  CHECK ((offer_id IS NOT NULL) OR (order_id IS NOT NULL));

-- Prevent duplicate reviews for the same (reviewer, order, listing)
CREATE UNIQUE INDEX reviews_unique_order_item
  ON public.reviews (reviewer_id, order_id, listing_id)
  WHERE order_id IS NOT NULL;

-- Replace insert policy to also allow order-based reviews by the buyer
DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;

CREATE POLICY "Users can create own reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_id
  AND (
    (offer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = reviews.offer_id
        AND o.status = 'accepted'
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    ))
    OR
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders ord
      WHERE ord.id = reviews.order_id
        AND ord.buyer_id = auth.uid()
    ))
  )
);
