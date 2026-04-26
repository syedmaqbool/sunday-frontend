CREATE OR REPLACE FUNCTION public.touch_support_ticket_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.support_tickets
  SET last_message_at = now(),
      updated_at = now(),
      status = CASE
        WHEN NEW.sender_role = 'admin' AND status = 'open' THEN 'pending'
        WHEN NEW.sender_role = 'user' AND status IN ('resolved','closed') THEN 'open'
        ELSE status
      END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.touch_support_tickets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.notify_support_ticket_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id, 'support_ticket_created',
    'New support ticket', NEW.subject,
    '/admin/support', 'admin'
  );
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_support_message_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  ticket_owner UUID;
  ticket_subject TEXT;
BEGIN
  SELECT user_id, subject INTO ticket_owner, ticket_subject FROM public.support_tickets WHERE id = NEW.ticket_id;
  IF NEW.sender_role = 'admin' AND ticket_owner IS NOT NULL THEN
    PERFORM public.create_notification(
      ticket_owner, 'support_reply',
      'Support replied to your ticket', LEFT(NEW.content, 80),
      '/support', 'user'
    );
  ELSIF NEW.sender_role = 'user' THEN
    PERFORM public.create_notification(
      NEW.sender_id, 'support_message',
      'New support message', LEFT(COALESCE(ticket_subject,'Support'), 80),
      '/admin/support', 'admin'
    );
  END IF;
  RETURN NEW;
END; $$;