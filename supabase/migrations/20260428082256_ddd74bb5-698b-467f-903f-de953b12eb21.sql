-- Boost packages catalog (admin managed)
CREATE TABLE public.boost_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('trending','for_you','search')),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boost_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active boost packages"
ON public.boost_packages FOR SELECT TO public
USING (active = true);

CREATE POLICY "Admins can read all boost packages"
ON public.boost_packages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage boost packages"
ON public.boost_packages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_boost_packages_updated_at
BEFORE UPDATE ON public.boost_packages
FOR EACH ROW EXECUTE FUNCTION public.touch_help_updated_at();

-- Active and historical boosts for listings
CREATE TABLE public.listing_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  package_id UUID,
  placement TEXT NOT NULL CHECK (placement IN ('trending','for_you','search')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  price_paid NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'mock' CHECK (payment_status IN ('paid','pending','mock','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_boosts_active ON public.listing_boosts (placement, ends_at) WHERE payment_status IN ('paid','mock');
CREATE INDEX idx_listing_boosts_listing ON public.listing_boosts (listing_id);
CREATE INDEX idx_listing_boosts_seller ON public.listing_boosts (seller_id);

ALTER TABLE public.listing_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active boosts"
ON public.listing_boosts FOR SELECT TO public
USING (payment_status IN ('paid','mock') AND ends_at > now());

CREATE POLICY "Sellers can view own boosts"
ON public.listing_boosts FOR SELECT TO authenticated
USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all boosts"
ON public.listing_boosts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can create boosts on own approved listings"
ON public.listing_boosts FOR INSERT TO authenticated
WITH CHECK (
  seller_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_id AND l.seller_id = auth.uid() AND l.status = 'approved'
  )
);

CREATE POLICY "Admins can manage all boosts"
ON public.listing_boosts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_listing_boosts_updated_at
BEFORE UPDATE ON public.listing_boosts
FOR EACH ROW EXECUTE FUNCTION public.touch_help_updated_at();

-- Seed default à la carte boost packages
INSERT INTO public.boost_packages (name, placement, duration_days, price, description) VALUES
('Trending Boost — 7 days', 'trending', 7, 9.99, 'Surface your listing at the top of the Trending Now section for 7 days.'),
('For You Boost — 7 days', 'for_you', 7, 9.99, 'Prioritize your listing in personalized "Picked for You" recommendations for 7 days.'),
('Search Boost — 7 days', 'search', 7, 7.99, 'Rank your listing higher in search and category browse results for 7 days.'),
('Trending Boost — 14 days', 'trending', 14, 17.99, 'Two weeks of premium placement in Trending Now.'),
('For You Boost — 14 days', 'for_you', 14, 17.99, 'Two weeks of priority in personalized recommendations.'),
('Search Boost — 14 days', 'search', 14, 13.99, 'Two weeks of higher search ranking.');