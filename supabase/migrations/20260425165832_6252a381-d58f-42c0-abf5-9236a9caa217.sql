
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_complaints_updated_at();

INSERT INTO public.email_templates (key, name, subject, body) VALUES
  (
    'order_confirmation',
    'Order Confirmation',
    'Your order #{{order_id}} is confirmed',
    E'Hi {{buyer_name}},\n\nThanks for your order! We''ve confirmed order #{{order_id}} for a total of €{{order_total}}.\n\nWe''ll let you know as soon as your items ship.\n\nThank you for shopping with us!'
  ),
  (
    'shipping_notification',
    'Shipping Notification',
    'Your order #{{order_id}} has shipped',
    E'Hi {{buyer_name}},\n\nGreat news — your item "{{item_title}}" from order #{{order_id}} is on its way!\n\nThank you for shopping with us.'
  );
