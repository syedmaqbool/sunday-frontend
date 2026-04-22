CREATE POLICY "Sellers can view orders containing their items"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM jsonb_array_elements(items) AS item
    WHERE (item->>'seller_id')::uuid = auth.uid()
  )
);