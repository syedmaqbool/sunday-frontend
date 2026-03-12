
-- Create discount_codes table
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_uses integer DEFAULT NULL,
  current_uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active codes (needed for validation at checkout)
CREATE POLICY "Anyone can read active discount codes"
  ON public.discount_codes FOR SELECT
  TO public
  USING (active = true);

-- Admins can manage discount codes
CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can increment usage (for checkout)
CREATE POLICY "Users can increment usage on checkout"
  ON public.discount_codes FOR UPDATE
  TO authenticated
  USING (active = true)
  WITH CHECK (active = true);
