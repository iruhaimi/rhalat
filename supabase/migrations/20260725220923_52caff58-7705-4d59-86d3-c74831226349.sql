-- =========================================================
-- Round 5: capture tour_* table definitions (schema drift closure)
-- and harden tour_program_reviews INSERT rule.
-- Uses IF NOT EXISTS so existing prod rows are untouched.
-- =========================================================

-- 1) tour_operators
CREATE TABLE IF NOT EXISTS public.tour_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_name_en text,
  description text,
  description_en text,
  logo_url text,
  cover_image_url text,
  whatsapp_number text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  country text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  admin_notes text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) tour_programs
CREATE TABLE IF NOT EXISTS public.tour_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES public.tour_operators(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_en text,
  description text,
  description_en text,
  destination text NOT NULL,
  destination_en text,
  cover_image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  duration_days integer NOT NULL DEFAULT 1,
  duration_nights integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  discounted_price numeric,
  discount_percentage integer,
  currency text NOT NULL DEFAULT 'SAR',
  daily_itinerary jsonb DEFAULT '[]'::jsonb,
  hotels jsonb DEFAULT '[]'::jsonb,
  inclusions jsonb DEFAULT '[]'::jsonb,
  exclusions jsonb DEFAULT '[]'::jsonb,
  cancellation_policy text,
  cancellation_policy_en text,
  available_dates jsonb DEFAULT '[]'::jsonb,
  max_seats integer,
  seats_booked integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  is_recurring boolean NOT NULL DEFAULT false,
  tags jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  rejection_reason text,
  display_order integer DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) tour_bookings
CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.tour_programs(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES public.tour_operators(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  travelers_count integer NOT NULL DEFAULT 1,
  preferred_date text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  operator_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) tour_program_reviews
CREATE TABLE IF NOT EXISTS public.tour_program_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.tour_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  rating integer NOT NULL,
  comment text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, user_id)
);

-- =========================================================
-- Harden tour_program_reviews INSERT: require completed booking
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.tour_program_reviews;

CREATE POLICY "Only completed-booking owners can create reviews"
ON public.tour_program_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.tour_bookings b
    WHERE b.user_id = auth.uid()
      AND b.program_id = tour_program_reviews.program_id
      AND b.status = 'completed'
  )
);