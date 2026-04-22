DROP POLICY IF EXISTS "Sellers can view orders containing their items" ON public.orders;

CREATE POLICY "Sellers can view orders containing their items"
ON public.orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM jsonb_array_elements(orders.items) AS item(value)
    WHERE
      ((item.value ->> 'seller_id')::uuid = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id = (item.value ->> 'listing_id')::uuid
          AND l.seller_id = auth.uid()
      )
  )
);