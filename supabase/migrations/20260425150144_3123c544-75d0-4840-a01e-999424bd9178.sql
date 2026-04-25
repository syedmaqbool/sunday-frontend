-- Complaints table for "inadequate quality" returns
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  evidence_urls text[] NOT NULL DEFAULT '{}',
  return_proof_urls text[] NOT NULL DEFAULT '{}',
  return_tracking text,
  return_carrier text,
  status text NOT NULL DEFAULT 'raised',
  admin_notes text NOT NULL DEFAULT '',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_order ON public.complaints(order_id);
CREATE INDEX idx_complaints_buyer ON public.complaints(buyer_id);
CREATE INDEX idx_complaints_seller ON public.complaints(seller_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Buyer: create complaint on own order
CREATE POLICY "Buyers can create complaints on own orders"
ON public.complaints FOR INSERT TO authenticated
WITH CHECK (
  buyer_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
);

-- Buyer: view + update own complaints
CREATE POLICY "Buyers can view own complaints"
ON public.complaints FOR SELECT TO authenticated
USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own complaints"
ON public.complaints FOR UPDATE TO authenticated
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- Seller: view complaints against their items
CREATE POLICY "Sellers can view complaints against them"
ON public.complaints FOR SELECT TO authenticated
USING (seller_id = auth.uid());

-- Admin: view + update all
CREATE POLICY "Admins can view all complaints"
ON public.complaints FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all complaints"
ON public.complaints FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_complaints_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_touch_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.touch_complaints_updated_at();

-- Storage bucket for return proofs and complaint evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('return-proofs', 'return-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read return proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'return-proofs');

CREATE POLICY "Authenticated users can upload to own folder in return-proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'return-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own return-proof files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'return-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own return-proof files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'return-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);