ALTER TABLE public.flag_keywords
ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT 'review'
  CHECK (action IN ('review', 'auto_delete'));

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

  SELECT keyword, reason, action INTO matched_keyword
  FROM public.flag_keywords
  WHERE active = true
    AND lower_content LIKE '%' || lower(keyword) || '%'
  LIMIT 1;

  IF matched_keyword.keyword IS NOT NULL THEN
    NEW.flagged := true;
    NEW.flag_reason := matched_keyword.reason;
    IF matched_keyword.action = 'auto_delete' THEN
      NEW.content := '[Message removed automatically — contained blocked keyword]';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;