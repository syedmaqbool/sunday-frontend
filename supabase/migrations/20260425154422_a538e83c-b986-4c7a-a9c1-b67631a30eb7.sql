
CREATE TABLE public.tax_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tax settings"
ON public.tax_settings FOR SELECT
USING (active = true);

CREATE POLICY "Admins can read all tax settings"
ON public.tax_settings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage tax settings"
ON public.tax_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_tax_settings_updated_at
BEFORE UPDATE ON public.tax_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_complaints_updated_at();

ALTER TABLE public.orders
  ADD COLUMN tax_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0;
