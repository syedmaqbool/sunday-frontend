
-- Create offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  counter_amount numeric DEFAULT null,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn')),
  message text DEFAULT '',
  seller_message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own offers
CREATE POLICY "Buyers can view own offers"
ON public.offers FOR SELECT TO authenticated
USING (buyer_id = auth.uid());

-- Sellers can see offers on their listings
CREATE POLICY "Sellers can view offers on their listings"
ON public.offers FOR SELECT TO authenticated
USING (seller_id = auth.uid());

-- Buyers can create offers
CREATE POLICY "Buyers can create offers"
ON public.offers FOR INSERT TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- Buyers can withdraw their own offers
CREATE POLICY "Buyers can update own offers"
ON public.offers FOR UPDATE TO authenticated
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- Sellers can accept/reject/counter offers on their listings
CREATE POLICY "Sellers can respond to offers"
ON public.offers FOR UPDATE TO authenticated
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- Admins can view all offers
CREATE POLICY "Admins can view all offers"
ON public.offers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
