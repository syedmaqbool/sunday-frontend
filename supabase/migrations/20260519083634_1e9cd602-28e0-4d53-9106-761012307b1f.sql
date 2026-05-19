
-- Commission tiers table
CREATE TABLE public.commission_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  min_price numeric NOT NULL DEFAULT 0,
  max_price numeric NULL,
  rate numeric NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commission tiers"
  ON public.commission_tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active commission tiers"
  ON public.commission_tiers
  FOR SELECT TO public
  USING (active = true);

CREATE OR REPLACE FUNCTION public.touch_commission_tiers_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_commission_tiers_touch
  BEFORE UPDATE ON public.commission_tiers
  FOR EACH ROW EXECUTE FUNCTION public.touch_commission_tiers_updated_at();

-- Add commission_amount column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0;

-- Seed sample tiers from the spec
INSERT INTO public.commission_tiers (name, categories, min_price, max_price, rate, sort_order) VALUES
  ('Tier 1', ARRAY['y2k','western'], 0, 10000, 20, 1),
  ('Tier 2', ARRAY['everyday','eastern'], 10001, 30000, 20, 2),
  ('Tier 3', ARRAY['formals','eastern'], 30001, 100000, 18, 3),
  ('Tier 4', ARRAY['formals','eastern','luxury'], 100001, NULL, 16, 4);
