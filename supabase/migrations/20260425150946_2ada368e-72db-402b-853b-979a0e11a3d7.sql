-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read boolean NOT NULL DEFAULT false,
  audience text NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_audience ON public.notifications(audience, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users see their own user-targeted notifications
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND audience = 'user');

-- Admins see admin-targeted notifications (any user_id, e.g. system/null-target)
CREATE POLICY "Admins view admin notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (audience = 'admin' AND public.has_role(auth.uid(), 'admin'));

-- Users mark their own as read
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND audience = 'user')
  WITH CHECK (user_id = auth.uid() AND audience = 'user');

-- Admins mark admin notifications as read
CREATE POLICY "Admins update admin notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (audience = 'admin' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (audience = 'admin' AND public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Helper to insert notifications (SECURITY DEFINER bypasses RLS for triggers)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _type text, _title text, _body text, _link text, _audience text DEFAULT 'user'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, body, link, audience)
  VALUES (_user_id, _type, _title, _body, _link, _audience);
END; $$;

-- ============ TRIGGERS ============

-- Complaints: notify admin (audience=admin) and seller on raise
CREATE OR REPLACE FUNCTION public.notify_complaint_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Admin notification (single row, audience=admin, user_id = buyer for ref)
  PERFORM public.create_notification(
    NEW.buyer_id, 'complaint_raised',
    'New complaint raised',
    'A buyer raised an inadequate-quality complaint.',
    '/admin/complaints', 'admin'
  );
  -- Seller notification
  PERFORM public.create_notification(
    NEW.seller_id, 'complaint_raised',
    'A complaint was raised against your sale',
    NEW.reason,
    '/profile', 'user'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_complaint_created
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.notify_complaint_created();

-- Complaints: notify on status change
CREATE OR REPLACE FUNCTION public.notify_complaint_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Notify buyer
    PERFORM public.create_notification(
      NEW.buyer_id, 'complaint_status',
      'Your complaint was updated',
      'Status: ' || NEW.status,
      '/profile', 'user'
    );
    -- Notify seller when return is in transit
    IF NEW.status = 'return_in_transit' THEN
      PERFORM public.create_notification(
        NEW.seller_id, 'return_in_transit',
        'Return is in transit',
        COALESCE('Carrier: ' || NEW.return_carrier, 'Buyer shipped the return.'),
        '/profile', 'user'
      );
    END IF;
    -- Notify admin on resolution
    IF NEW.status IN ('refunded','rejected','return_received') THEN
      PERFORM public.create_notification(
        NEW.buyer_id, 'complaint_status',
        'Complaint ' || NEW.status,
        'Complaint resolved.',
        '/admin/complaints', 'admin'
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_complaint_updated
AFTER UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.notify_complaint_updated();

-- Offers: notify seller on new offer
CREATE OR REPLACE FUNCTION public.notify_offer_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.seller_id, 'offer_received',
    'New offer received',
    'You received an offer of €' || NEW.amount,
    '/my-offers', 'user'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_offer_created
AFTER INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_offer_created();

-- Offers: notify buyer on status change
CREATE OR REPLACE FUNCTION public.notify_offer_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected','countered') THEN
    PERFORM public.create_notification(
      NEW.buyer_id, 'offer_' || NEW.status,
      'Your offer was ' || NEW.status,
      'Update on your offer of €' || NEW.amount,
      '/my-offers', 'user'
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_offer_updated
AFTER UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_offer_updated();

-- Messages: notify recipient
CREATE OR REPLACE FUNCTION public.notify_message_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recipient uuid;
BEGIN
  IF NEW.flagged THEN RETURN NEW; END IF;
  SELECT CASE WHEN c.buyer_id = NEW.sender_id THEN c.seller_id ELSE c.buyer_id END
    INTO recipient
  FROM public.conversations c WHERE c.id = NEW.conversation_id;
  IF recipient IS NOT NULL THEN
    PERFORM public.create_notification(
      recipient, 'new_message', 'New message',
      LEFT(NEW.content, 80),
      '/messages', 'user'
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_message_created
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message_created();

-- Listings: notify admin on new pending listing
CREATE OR REPLACE FUNCTION public.notify_listing_pending()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.create_notification(
      NEW.seller_id, 'listing_pending',
      'New listing awaiting review',
      NEW.title,
      '/admin/listings', 'admin'
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_listing_pending
AFTER INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_listing_pending();

-- Listings: notify seller on status change (approved/rejected)
CREATE OR REPLACE FUNCTION public.notify_listing_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected','needs_revision') THEN
    PERFORM public.create_notification(
      NEW.seller_id, 'listing_' || NEW.status,
      'Listing ' || NEW.status,
      NEW.title,
      '/my-listings', 'user'
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_listing_status
AFTER UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_listing_status();

-- Reports: notify admin
CREATE OR REPLACE FUNCTION public.notify_report_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.reporter_id, 'report_submitted',
    'New report submitted',
    NEW.reason,
    '/admin/reports', 'admin'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_report_created
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.notify_report_created();