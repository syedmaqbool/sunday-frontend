
-- Allow admins to delete discount codes
CREATE POLICY "Admins can delete discount codes"
  ON public.discount_codes FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
