
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS reserved_for uuid,
  ADD COLUMN IF NOT EXISTS reserved_until timestamptz,
  ADD COLUMN IF NOT EXISTS reserved_offer_id uuid;

CREATE INDEX IF NOT EXISTS idx_listings_reserved_until ON public.listings(reserved_until) WHERE reserved_until IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can view approved or sold listings" ON public.listings;
CREATE POLICY "Anyone can view approved sold or reserved listings"
ON public.listings FOR SELECT
TO public
USING (status IN ('approved','sold','reserved'));

-- Trigger: when an offer is accepted, reserve the listing for that buyer
CREATE OR REPLACE FUNCTION public.handle_offer_accepted_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reserve_until timestamptz := now() + interval '6 hours';
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    -- Reserve the listing for this buyer
    UPDATE public.listings
       SET status = 'reserved',
           reserved_for = NEW.buyer_id,
           reserved_until = reserve_until,
           reserved_offer_id = NEW.id,
           updated_at = now()
     WHERE id = NEW.listing_id
       AND status IN ('approved','reserved');

    -- Close other pending/countered offers on the same listing
    UPDATE public.offers
       SET status = 'expired', updated_at = now()
     WHERE listing_id = NEW.listing_id
       AND id <> NEW.id
       AND status IN ('pending','countered');

    -- Notify the buyer
    PERFORM public.create_notification(
      NEW.buyer_id, 'reservation_started',
      'Your offer was accepted',
      'Complete your purchase within 6 hours.',
      '/listings/' || NEW.listing_id::text, 'user'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_offer_accepted_reservation ON public.offers;
CREATE TRIGGER trg_offer_accepted_reservation
AFTER UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.handle_offer_accepted_reservation();

-- Trigger: when listing becomes sold, close any remaining open offers
CREATE OR REPLACE FUNCTION public.close_offers_on_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status IS DISTINCT FROM 'sold' THEN
    UPDATE public.offers
       SET status = 'expired', updated_at = now()
     WHERE listing_id = NEW.id
       AND status IN ('pending','countered');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_close_offers_on_sold ON public.listings;
CREATE TRIGGER trg_close_offers_on_sold
AFTER UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.close_offers_on_sold();

-- Function: expire a single reservation (used by edge function or seller cancel)
CREATE OR REPLACE FUNCTION public.expire_listing_reservation(_listing_id uuid, _force boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l RECORD;
BEGIN
  SELECT * INTO l FROM public.listings WHERE id = _listing_id;
  IF l IS NULL OR l.status <> 'reserved' THEN RETURN; END IF;
  IF NOT _force AND (l.reserved_until IS NULL OR l.reserved_until > now()) THEN RETURN; END IF;

  UPDATE public.listings
     SET status = 'approved',
         reserved_for = NULL,
         reserved_until = NULL,
         reserved_offer_id = NULL,
         updated_at = now()
   WHERE id = _listing_id;

  -- Mark the reserved offer as expired so the buyer can no longer purchase
  IF l.reserved_offer_id IS NOT NULL THEN
    UPDATE public.offers
       SET status = 'expired', updated_at = now()
     WHERE id = l.reserved_offer_id
       AND status = 'accepted';
  END IF;

  IF l.reserved_for IS NOT NULL THEN
    PERFORM public.create_notification(
      l.reserved_for, 'reservation_expired',
      'Your reserved purchase window has expired',
      l.title,
      '/listings/' || l.id::text, 'user'
    );
  END IF;
  PERFORM public.create_notification(
    l.seller_id, 'reservation_expired',
    'Reservation expired',
    'Listing "' || l.title || '" is active again.',
    '/my-listings', 'user'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_listing_reservation(uuid, boolean) TO authenticated;
