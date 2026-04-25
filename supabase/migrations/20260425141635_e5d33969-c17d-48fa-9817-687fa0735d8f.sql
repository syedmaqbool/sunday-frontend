CREATE OR REPLACE FUNCTION public.mark_listings_sold(_listing_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only mark listings as sold if the caller has a confirmed order containing them
  UPDATE public.listings l
  SET status = 'sold', updated_at = now()
  WHERE l.id = ANY(_listing_ids)
    AND l.status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.orders o,
           jsonb_array_elements(o.items) item
      WHERE o.buyer_id = auth.uid()
        AND (item->>'listing_id')::uuid = l.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_listings_sold(uuid[]) TO authenticated;