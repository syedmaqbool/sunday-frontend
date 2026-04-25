-- Categories
CREATE TABLE public.help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  blurb TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active categories"
ON public.help_categories FOR SELECT TO public
USING (active = true);

CREATE POLICY "Admins manage categories"
ON public.help_categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FAQs
CREATE TABLE public.help_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published faqs"
ON public.help_faqs FOR SELECT TO public
USING (published = true);

CREATE POLICY "Admins manage faqs"
ON public.help_faqs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tutorials
CREATE TABLE public.help_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  steps TEXT[] NOT NULL DEFAULT '{}',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_to TEXT NOT NULL DEFAULT '/',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.help_tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published tutorials"
ON public.help_tutorials FOR SELECT TO public
USING (published = true);

CREATE POLICY "Admins manage tutorials"
ON public.help_tutorials FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reusable touch trigger
CREATE OR REPLACE FUNCTION public.touch_help_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER touch_help_categories BEFORE UPDATE ON public.help_categories
FOR EACH ROW EXECUTE FUNCTION public.touch_help_updated_at();
CREATE TRIGGER touch_help_faqs BEFORE UPDATE ON public.help_faqs
FOR EACH ROW EXECUTE FUNCTION public.touch_help_updated_at();
CREATE TRIGGER touch_help_tutorials BEFORE UPDATE ON public.help_tutorials
FOR EACH ROW EXECUTE FUNCTION public.touch_help_updated_at();