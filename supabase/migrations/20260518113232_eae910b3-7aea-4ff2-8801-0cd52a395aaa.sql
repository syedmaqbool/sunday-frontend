
-- Payout runs: a snapshot of payouts + refunds generated for a specific date range
CREATE TABLE public.payout_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payout runs"
ON public.payout_runs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_payout_runs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_touch_payout_runs
BEFORE UPDATE ON public.payout_runs
FOR EACH ROW EXECUTE FUNCTION public.touch_payout_runs_updated_at();


-- Individual lines inside a payout run (one per seller payout or buyer refund)
CREATE TABLE public.payout_run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.payout_runs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('seller_payout','buyer_refund')),
  party_id uuid NOT NULL,
  party_name text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','unpaid')),
  reference text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Snapshotted bank details so historical exports don't break if the user edits later
  bank_account_holder text,
  bank_name text,
  bank_account_number text,
  bank_iban text,
  bank_swift text,
  source_key text, -- e.g. "seller:<uuid>" or "refund:<complaint_id>"
  marked_at timestamp with time zone,
  marked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_run_items_run ON public.payout_run_items(run_id);
CREATE INDEX idx_payout_run_items_party ON public.payout_run_items(party_id);

ALTER TABLE public.payout_run_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payout run items"
ON public.payout_run_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_touch_payout_run_items
BEFORE UPDATE ON public.payout_run_items
FOR EACH ROW EXECUTE FUNCTION public.touch_payout_runs_updated_at();
