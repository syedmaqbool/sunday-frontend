

## Fix: Sellers can't see their sold items from older orders

### Root cause

The RLS policy on `orders` only allows a seller to view an order when `items[*].seller_id` in the JSON snapshot equals their `auth.uid()`. Older orders (created before we started writing `seller_id` into the snapshot) don't have that field, so the policy returns zero rows for the seller. The client-side fallback that resolves `seller_id` from the `listings` table never runs because the rows are filtered out by RLS first.

### Fix

**Migration** — replace the `Sellers can view orders containing their items` SELECT policy with one that also matches via the `listings` table:

```sql
DROP POLICY "Sellers can view orders containing their items" ON public.orders;

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
```

This lets sellers see legacy orders by joining back to `listings.seller_id` when the snapshot is missing the field. New orders (which now embed `seller_id`) continue to work via the fast path.

### Files

- `supabase/migrations/<ts>_sellers_view_orders_legacy.sql` — drop + recreate the policy

No client changes needed — `UserProfile.tsx` already has the `buildListingSellerMap` fallback that will populate the missing seller info once the rows are visible.

