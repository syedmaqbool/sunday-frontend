

## Show buyer details to seller + allow "Mark as Shipped"

### Goal

When someone buys an item, the seller sees the buyer's full shipping details on their **Sold** card and can update the order's status from **Confirmed → Shipped** with one click. The buyer sees the updated status in their **Bought** tab.

### Database

Migration to support per-seller status tracking on a multi-seller order (an order may contain items from several sellers, each with their own shipment):

1. Add `item_status jsonb not null default '{}'` to `public.orders`. Shape: `{ "<listing_id>": { "status": "shipped", "shipped_at": "..." } }`. Keeps the existing top-level `orders.status` untouched for backward compatibility.
2. Add an UPDATE policy on `orders` so a seller can update **only** the `item_status` column for orders containing one of their listings:

```sql
CREATE POLICY "Sellers can update item_status on their orders"
ON public.orders FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(orders.items) AS item(value)
    WHERE ((item.value->>'seller_id')::uuid = auth.uid())
       OR EXISTS (SELECT 1 FROM public.listings l
                  WHERE l.id = (item.value->>'listing_id')::uuid
                    AND l.seller_id = auth.uid())
  )
)
WITH CHECK (true);
```

(Column-level safety is enforced client-side; we only ever send `item_status` in the update payload.)

### Seller view — `src/pages/UserProfile.tsx` (`SoldOrderCard`)

Expand the Sold card to show full buyer details and a status action:

- **Buyer details block** (already partially shown): name, full shipping address, postal, city, phone.
- **Status badge**: reads `order.item_status[listing_id].status` (defaults to `confirmed`).
- **"Mark as Shipped" button**: visible only when status is `confirmed`. On click, updates `orders.item_status` by merging `{ [listing_id]: { status: 'shipped', shipped_at: now } }`, then invalidates `sold-orders` and `my-orders` queries.
- After shipping, button is replaced with a green "Shipped on …" label.

Update the `sold-orders` query to also select `shipping_address`, `shipping_postal`, `shipping_phone`, and `item_status`, and pass them through into the flat list.

### Buyer view — `OrderCard` in same file

For each item row inside the order details, show the per-item shipment status badge (Confirmed / Shipped + date) read from `order.item_status[listing_id]`. No new actions for buyers.

### Files

- `supabase/migrations/<ts>_order_item_status.sql` — add `item_status` column + seller UPDATE policy
- `src/pages/UserProfile.tsx` — extend `sold-orders` query, expand `SoldOrderCard` with buyer details + ship action, show item status in `OrderCard`

### Out of scope

- Email/SMS notifications to buyer on shipment (can be added later via edge function)
- Tracking numbers / carrier selection (can be a follow-up)

