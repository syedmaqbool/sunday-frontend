-- Allow buyers to update item_status (e.g. mark received/not received) on their own orders
CREATE POLICY "Buyers can update item_status on own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());