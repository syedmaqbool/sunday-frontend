CREATE OR REPLACE FUNCTION public.touch_seller_payouts_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.seller_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  period_start DATE,
  period_end DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'bank_transfer',
  reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_seller_payouts_seller ON public.seller_payouts(seller_id);
CREATE INDEX idx_seller_payouts_paid_at ON public.seller_payouts(paid_at DESC);

ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seller payouts"
ON public.seller_payouts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view own payouts"
ON public.seller_payouts FOR SELECT TO authenticated
USING (seller_id = auth.uid());

CREATE TRIGGER touch_seller_payouts_updated_at
BEFORE UPDATE ON public.seller_payouts
FOR EACH ROW EXECUTE FUNCTION public.touch_seller_payouts_updated_at();