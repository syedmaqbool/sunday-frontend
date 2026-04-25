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
  -- Phone numbers — auto-delete
  IF lower_content ~ '\+?\d[\d\s\-\.]{7,}\d' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible phone number detected';
    NEW.content := '[Message removed automatically — contained a phone number]';
    RETURN NEW;
  END IF;

  -- Email addresses — auto-delete
  IF lower_content ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible email address detected';
    NEW.content := '[Message removed automatically — contained an email address]';
    RETURN NEW;
  END IF;

  -- Social handles — review required
  IF lower_content ~ '@[a-z0-9_\.]{3,30}' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible social media handle detected';
    RETURN NEW;
  END IF;

  -- Platform mentions — review required
  IF lower_content ~ '(instagram|insta|whatsapp|telegram|signal|snapchat|tiktok|facebook|fb|twitter|watsapp|wattsapp)' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Social media platform mention detected';
    RETURN NEW;
  END IF;

  -- Custom admin keywords
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