ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_submission_method_check;
ALTER TABLE public.applications
  ADD CONSTRAINT applications_submission_method_check
  CHECK (submission_method IS NULL OR submission_method IN ('online','whatsapp','bank_transfer'));