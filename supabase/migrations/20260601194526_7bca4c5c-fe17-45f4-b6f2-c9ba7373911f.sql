-- Add return-address fields and seller update policy for complaints
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS return_to_name text,
  ADD COLUMN IF NOT EXISTS return_to_address text,
  ADD COLUMN IF NOT EXISTS return_to_city text,
  ADD COLUMN IF NOT EXISTS return_to_postal text,
  ADD COLUMN IF NOT EXISTS return_to_phone text,
  ADD COLUMN IF NOT EXISTS return_to_notes text,
  ADD COLUMN IF NOT EXISTS return_address_provided_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_approved_at timestamptz;

-- Allow sellers to update complaints filed against them (so they can post the return address
-- and progress the workflow). Mirrors the existing buyer-update policy.
DROP POLICY IF EXISTS "Sellers can update own complaints" ON public.complaints;
CREATE POLICY "Sellers can update own complaints"
ON public.complaints
FOR UPDATE
TO authenticated
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- Notify buyer when seller posts the return address
CREATE OR REPLACE FUNCTION public.notify_complaint_address_provided()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'return_address_provided'
     AND OLD.status IS DISTINCT FROM 'return_address_provided' THEN
    PERFORM public.create_notification(
      NEW.buyer_id, 'return_address_provided',
      'Return address provided',
      'The seller posted the return address. You can ship the item back now.',
      '/profile', 'user'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_complaint_address_provided ON public.complaints;
CREATE TRIGGER trg_complaint_address_provided
AFTER UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.notify_complaint_address_provided();

-- Notify seller when admin approves the return (so seller knows to post return address)
CREATE OR REPLACE FUNCTION public.notify_complaint_return_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'return_approved'
     AND OLD.status IS DISTINCT FROM 'return_approved' THEN
    PERFORM public.create_notification(
      NEW.seller_id, 'return_approved',
      'Return approved — please provide return address',
      'Open the sold item to add the address where the buyer should ship the return.',
      '/my-listings', 'user'
    );
    PERFORM public.create_notification(
      NEW.buyer_id, 'return_approved',
      'Your return was approved',
      'Waiting for the seller to provide the return shipping address.',
      '/profile', 'user'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_complaint_return_approved ON public.complaints;
CREATE TRIGGER trg_complaint_return_approved
AFTER UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.notify_complaint_return_approved();