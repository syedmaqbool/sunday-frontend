## Reserved Purchase Flow (6h exclusive window)

Add a "reserved" state to listings so an accepted offer gives the buyer 6 hours of exclusive purchase access, after which the listing reopens automatically.

### Database changes

Migration on `listings`:
- Add `reserved_for uuid` (buyer id), `reserved_until timestamptz`, `reserved_offer_id uuid`.
- Extend allowed `status` values to include `reserved` (status is plain text — no enum change needed; update RLS public-view policy to also include `reserved` so other buyers can still see it).
- Update `Anyone can view approved or sold listings` policy → include `reserved`.

Migration on `offers`:
- Helper function `expire_reservation(listing_id uuid)` (SECURITY DEFINER) that, when called, if `reserved_until < now()`, resets the listing to `approved` and clears reservation fields, and notifies seller + buyer.

Trigger on `offers` update: when status flips to `accepted`, set listing.status='reserved', reserved_for=buyer_id, reserved_until=now()+6h, reserved_offer_id=offer.id; reject other pending offers on same listing (mark `expired`); send buyer a `reservation_started` notification.

When listing becomes `sold` (checkout completes), close all remaining pending/countered offers as `expired`.

### Edge function update

`check-shipping-deadlines` (rename concept or add second loop): also scan listings where `status='reserved' AND reserved_until < now()` → reset to `approved`, clear fields, notify both parties (`reservation_expired`).

### Frontend changes

**ReceivedOffers.tsx accept handler**: keep as-is (DB trigger handles reservation). Toast text updates: "Offer accepted — buyer has 6h to pay."

**ListingDetail.tsx**:
- If `listing.status === 'reserved'`:
  - If current user is `reserved_for` → show countdown banner "Reserved for you — complete purchase in HH:MM:SS", Buy/Add-to-cart enabled.
  - Else → disable Buy/Add-to-cart/Make Offer, show banner "Reserved for another buyer — available again in HH:MM:SS".
- Live countdown via `setInterval`.

**CartContext / Checkout**: block adding/buying reserved listings unless `reserved_for === user.id`.

**MyListings.tsx**: show "Reserved (expires in …)" badge; add "Cancel reservation" button that resets listing to approved + notifies buyer.

**ListingCard.tsx**: small "Reserved" badge when status='reserved'.

**Checkout success**: after order creation, listings already get marked sold via existing `mark_listings_sold`; add post-step to close other offers (handled by trigger on listings status change to 'sold').

### Notifications

Reuse existing `create_notification`:
- `reservation_started` → buyer (link `/listings/{id}`)
- `reservation_expired` → buyer + seller
- `reservation_cancelled` → buyer (when seller cancels)
- `reservation_completed` → seller (already covered by sale flow)

### Files to create / edit

- migration (listings columns + RLS update + triggers + functions)
- `supabase/functions/check-shipping-deadlines/index.ts` — add reservation expiry sweep
- `src/pages/ListingDetail.tsx` — reservation banner + countdown + button gating
- `src/contexts/CartContext.tsx` — guard against reserved-for-other
- `src/pages/Checkout.tsx` — same guard server-aware
- `src/pages/MyListings.tsx` — reserved badge + cancel button
- `src/components/ListingCard.tsx` — reserved badge
- `src/components/ReceivedOffers.tsx` — toast copy

No new pages. Cron already runs hourly; we'll piggyback. (Note: hourly cron means up to 1h slop on auto-expire — acceptable, plus client-side countdown enforces UX immediately and DB guard prevents bad purchases.)
