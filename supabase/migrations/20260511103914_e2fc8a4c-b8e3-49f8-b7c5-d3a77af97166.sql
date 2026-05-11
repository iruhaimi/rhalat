
-- Ensure sequence exists for application numbers
CREATE SEQUENCE IF NOT EXISTS public.application_number_seq START 1000;

-- Add submission_method column to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS submission_method text DEFAULT 'online'
  CHECK (submission_method IN ('online', 'whatsapp'));

-- Ensure trigger exists to auto-generate display_number on insert
DROP TRIGGER IF EXISTS trg_generate_application_display_number ON public.applications;
CREATE TRIGGER trg_generate_application_display_number
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_application_display_number();

-- Backfill display_number for any existing rows without one
UPDATE public.applications
SET display_number = 'VF-' || to_char(COALESCE(created_at, now()), 'YYYY') || '-' ||
                     lpad(nextval('public.application_number_seq')::text, 4, '0')
WHERE display_number IS NULL;

-- Add unique constraint on display_number to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS applications_display_number_unique
  ON public.applications(display_number)
  WHERE display_number IS NOT NULL;
