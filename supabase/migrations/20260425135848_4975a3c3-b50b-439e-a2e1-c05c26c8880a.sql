CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user','listing','message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  admin_notes TEXT NOT NULL DEFAULT '',
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reports"
ON public.reports FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_reports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER reports_set_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.touch_reports_updated_at();