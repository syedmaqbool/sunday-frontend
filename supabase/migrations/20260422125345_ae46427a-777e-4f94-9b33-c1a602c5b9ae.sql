ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS item_status jsonb NOT NULL DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "Sellers can update item_status on their orders" ON public.orders;

CREATE POLICY "Sellers can update item_status on their orders"
ON public.orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(orders.items) AS item(value)
    WHERE ((item.value->>'seller_id')::uuid = auth.uid())
       OR EXISTS (
         SELECT 1 FROM public.listings l
         WHERE l.id = (item.value->>'listing_id')::uuid
           AND l.seller_id = auth.uid()
       )
  )
)
WITH CHECK (true);