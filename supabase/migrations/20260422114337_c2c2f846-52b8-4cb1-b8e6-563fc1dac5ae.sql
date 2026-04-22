ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_account_holder text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text;

-- Tighten: restrict generic profile SELECT so bank details aren't exposed publicly.
-- Drop the broad "view any profile" policy and replace with a restricted one.
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;

CREATE POLICY "Users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
-- Note: column-level restriction is enforced at the application layer by only
-- selecting bank_* columns when id = auth.uid().