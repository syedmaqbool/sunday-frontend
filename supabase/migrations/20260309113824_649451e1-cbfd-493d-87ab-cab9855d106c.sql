
-- Add flagged column to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS flag_reason text;

-- Create function to detect contact info in messages
CREATE OR REPLACE FUNCTION public.flag_contact_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lower_content text := lower(NEW.content);
BEGIN
  -- Check for phone numbers (various formats)
  IF lower_content ~ '\+?\d[\d\s\-\.]{7,}\d' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible phone number detected';
    RETURN NEW;
  END IF;

  -- Check for Instagram handles (@username patterns)
  IF lower_content ~ '@[a-z0-9_\.]{3,30}' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible social media handle detected';
    RETURN NEW;
  END IF;

  -- Check for common contact keywords
  IF lower_content ~ '(instagram|insta|whatsapp|telegram|signal|snapchat|tiktok|facebook|fb|twitter|watsapp|wattsapp)' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Social media platform mention detected';
    RETURN NEW;
  END IF;

  -- Check for email patterns
  IF lower_content ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Possible email address detected';
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER check_contact_info
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.flag_contact_info();

-- Allow admins to view all messages for moderation
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
