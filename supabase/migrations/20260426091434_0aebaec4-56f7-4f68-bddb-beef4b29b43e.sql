-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update all tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Support messages table
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view messages on own tickets" ON public.support_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Admins view all messages" ON public.support_messages
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users send messages on own tickets" ON public.support_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND sender_role = 'user' AND
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Admins send messages on any ticket" ON public.support_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND sender_role = 'admin' AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "Users mark own ticket messages read" ON public.support_messages
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Admins mark messages read" ON public.support_messages
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id, last_message_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status, last_message_at DESC);
CREATE INDEX idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);

-- Touch updated_at + last_message_at
CREATE OR REPLACE FUNCTION public.touch_support_ticket_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE TRIGGER trg_touch_support_ticket
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket_on_message();

CREATE OR REPLACE FUNCTION public.touch_support_tickets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_support_tickets_updated_at();

-- Notifications
CREATE OR REPLACE FUNCTION public.notify_support_ticket_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id, 'support_ticket_created',
    'New support ticket', NEW.subject,
    '/admin/support', 'admin'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_support_ticket_created
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_support_ticket_created();

CREATE OR REPLACE FUNCTION public.notify_support_message_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE TRIGGER trg_notify_support_message_created
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_support_message_created();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;