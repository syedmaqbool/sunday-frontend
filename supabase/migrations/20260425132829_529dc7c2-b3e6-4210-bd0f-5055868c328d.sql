-- Inline updated_at helper (no shared function exists)
CREATE TABLE public.flag_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'Custom keyword detected',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flag_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage flag keywords"
ON public.flag_keywords
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_flag_keywords_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_flag_keywords_updated_at
BEFORE UPDATE ON public.flag_keywords
FOR EACH ROW
EXECUTE FUNCTION public.touch_flag_keywords_updated_at();

CREATE OR REPLACE FUNCTION public.flag_contact_info()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  lower_content text := lower(NEW.content);
  matched_keyword RECORD;
BEGIN
  IF lower_content ~ '\+?\d[\d\s\-\.]{7,}\d' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible phone number detected';
    RETURN NEW;
  END IF;

  IF lower_content ~ '@[a-z0-9_\.]{3,30}' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible social media handle detected';
    RETURN NEW;
  END IF;

  IF lower_content ~ '(instagram|insta|whatsapp|telegram|signal|snapchat|tiktok|facebook|fb|twitter|watsapp|wattsapp)' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Social media platform mention detected';
    RETURN NEW;
  END IF;

  IF lower_content ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible email address detected';
    RETURN NEW;
  END IF;

  SELECT keyword, reason INTO matched_keyword
  FROM public.flag_keywords
  WHERE active = true
    AND lower_content LIKE '%' || lower(keyword) || '%'
  LIMIT 1;

  IF matched_keyword.keyword IS NOT NULL THEN
    NEW.flagged := true;
    NEW.flag_reason := matched_keyword.reason;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;