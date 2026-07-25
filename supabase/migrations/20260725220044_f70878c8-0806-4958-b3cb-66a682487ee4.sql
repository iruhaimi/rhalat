-- Documentation migration: capture live tour_* schema and policies in version control.
-- All statements are idempotent; no behavior change vs. current production.

-- Ensure RLS is enabled (already true in prod; safe to reassert)
ALTER TABLE IF EXISTS public.tour_operators       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tour_programs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tour_bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tour_program_reviews ENABLE ROW LEVEL SECURITY;

-- Ensure GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_operators       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_programs        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_bookings        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_program_reviews TO authenticated;
GRANT SELECT ON public.tour_programs        TO anon;
GRANT SELECT ON public.tour_program_reviews TO anon;
GRANT ALL ON public.tour_operators, public.tour_programs, public.tour_bookings, public.tour_program_reviews TO service_role;

-- ============ tour_operators ============
DROP POLICY IF EXISTS "Admins can manage all operators"         ON public.tour_operators;
DROP POLICY IF EXISTS "Admins can read full tour operator rows" ON public.tour_operators;
DROP POLICY IF EXISTS "Operators can read own profile"          ON public.tour_operators;
DROP POLICY IF EXISTS "Operators can update own profile"        ON public.tour_operators;
DROP POLICY IF EXISTS "Tour operators can insert own profile"   ON public.tour_operators;

CREATE POLICY "Admins can manage all operators" ON public.tour_operators
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can read full tour operator rows" ON public.tour_operators
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Operators can read own profile" ON public.tour_operators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Operators can update own profile" ON public.tour_operators
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tour operators can insert own profile" ON public.tour_operators
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'tour_operator'::app_role));

-- ============ tour_programs ============
DROP POLICY IF EXISTS "Anyone can view approved programs"    ON public.tour_programs;
DROP POLICY IF EXISTS "Operators can insert own programs"    ON public.tour_programs;
DROP POLICY IF EXISTS "Operators can update own programs"    ON public.tour_programs;
DROP POLICY IF EXISTS "Can delete own draft or admin delete" ON public.tour_programs;

CREATE POLICY "Anyone can view approved programs" ON public.tour_programs
  FOR SELECT
  USING (
    status = 'approved'
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tour_operators o
      WHERE o.id = tour_programs.operator_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can insert own programs" ON public.tour_programs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tour_operators o
      WHERE o.id = tour_programs.operator_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update own programs" ON public.tour_programs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_operators o
      WHERE o.id = tour_programs.operator_id AND o.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Can delete own draft or admin delete" ON public.tour_programs
  FOR DELETE TO authenticated
  USING (
    (status = 'draft' AND EXISTS (
      SELECT 1 FROM public.tour_operators o
      WHERE o.id = tour_programs.operator_id AND o.user_id = auth.uid()
    ))
    OR public.is_admin(auth.uid())
  );

-- ============ tour_bookings ============
DROP POLICY IF EXISTS "Authenticated users can create own bookings" ON public.tour_bookings;
DROP POLICY IF EXISTS "Operators can view own bookings"             ON public.tour_bookings;
DROP POLICY IF EXISTS "Operators can update own bookings"           ON public.tour_bookings;

CREATE POLICY "Authenticated users can create own bookings" ON public.tour_bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.tour_operators o WHERE o.id = tour_bookings.operator_id)
  );

CREATE POLICY "Operators can view own bookings" ON public.tour_bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_operators o
      WHERE o.id = tour_bookings.operator_id AND o.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Operators can update own bookings" ON public.tour_bookings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_operators o
      WHERE o.id = tour_bookings.operator_id AND o.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- ============ tour_program_reviews ============
DROP POLICY IF EXISTS "Anyone can view approved reviews"   ON public.tour_program_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.tour_program_reviews;
DROP POLICY IF EXISTS "Admins can manage reviews"          ON public.tour_program_reviews;

CREATE POLICY "Anyone can view approved reviews" ON public.tour_program_reviews
  FOR SELECT
  USING (is_approved = true OR public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create reviews" ON public.tour_program_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage reviews" ON public.tour_program_reviews
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));