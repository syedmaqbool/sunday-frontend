-- 1) seller_coupons
CREATE TABLE public.seller_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  per_user_limit integer,
  scope text NOT NULL DEFAULT 'seller_wide' CHECK (scope IN ('seller_wide','item_based')),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seller_coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seller_coupons TO authenticated;
GRANT ALL ON public.seller_coupons TO service_role;

ALTER TABLE public.seller_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active seller coupons"
  ON public.seller_coupons FOR SELECT
  USING (active = true OR public.has_role(auth.uid(),'admin') OR seller_id = auth.uid());

CREATE POLICY "Admins manage seller coupons - insert"
  ON public.seller_coupons FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins manage seller coupons - update"
  ON public.seller_coupons FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins manage seller coupons - delete"
  ON public.seller_coupons FOR DELETE
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_seller_coupons_seller ON public.seller_coupons(seller_id);
CREATE INDEX idx_seller_coupons_code ON public.seller_coupons(code);

CREATE TRIGGER touch_seller_coupons_updated_at
  BEFORE UPDATE ON public.seller_coupons
  FOR EACH ROW EXECUTE FUNCTION public.touch_commission_tiers_updated_at();

-- 2) seller_coupon_listings (item-based scope)
CREATE TABLE public.seller_coupon_listings (
  coupon_id uuid NOT NULL REFERENCES public.seller_coupons(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (coupon_id, listing_id)
);

GRANT SELECT ON public.seller_coupon_listings TO anon, authenticated;
GRANT INSERT, DELETE ON public.seller_coupon_listings TO authenticated;
GRANT ALL ON public.seller_coupon_listings TO service_role;

ALTER TABLE public.seller_coupon_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coupon listings"
  ON public.seller_coupon_listings FOR SELECT USING (true);

CREATE POLICY "Admins insert coupon listings"
  ON public.seller_coupon_listings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete coupon listings"
  ON public.seller_coupon_listings FOR DELETE
  USING (public.has_role(auth.uid(),'admin'));

-- 3) seller_coupon_redemptions
CREATE TABLE public.seller_coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.seller_coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.seller_coupon_redemptions TO authenticated;
GRANT ALL ON public.seller_coupon_redemptions TO service_role;

ALTER TABLE public.seller_coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their redemptions or admins/sellers view theirs"
  ON public.seller_coupon_redemptions FOR SELECT
  USING (
    user_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "Users record their own redemptions"
  ON public.seller_coupon_redemptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_redemptions_coupon ON public.seller_coupon_redemptions(coupon_id);
CREATE INDEX idx_redemptions_user ON public.seller_coupon_redemptions(user_id);