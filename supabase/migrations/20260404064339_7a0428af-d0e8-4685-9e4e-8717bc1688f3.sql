
-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '📦',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subcategories table
CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '📦',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read subcategories" ON public.subcategories FOR SELECT TO public USING (true);

-- Admin CRUD
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage subcategories" ON public.subcategories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed with existing data
INSERT INTO public.categories (label, value, icon, sort_order) VALUES
  ('Women', 'women', '👗', 1),
  ('Men', 'men', '🧥', 2),
  ('Children', 'children', '🧒', 3);

INSERT INTO public.subcategories (label, value, icon, sort_order) VALUES
  ('Clothes', 'clothes', '👔', 1),
  ('Shoes', 'shoes', '👟', 2),
  ('Bags', 'bags', '👜', 3),
  ('Accessories', 'accessories', '💍', 4);
