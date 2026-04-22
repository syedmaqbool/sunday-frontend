
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_code TEXT,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  shipping_first_name TEXT,
  shipping_last_name TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal TEXT,
  shipping_phone TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (buyer_id = auth.uid());

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyers can create own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
