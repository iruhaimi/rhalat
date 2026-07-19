DO $$
DECLARE
  reviewer_auth_id uuid := 'a11e0000-0000-4000-8000-000000000001'::uuid;
  reviewer_profile_id uuid;
  visa_id uuid := '0a6b92e5-d1e8-4e2a-bc53-4813015cebc6'::uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'applereview@visafaster.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      reviewer_auth_id,
      'authenticated','authenticated',
      'applereview@visafaster.com',
      crypt('AppleReview2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Apple Reviewer"}'::jsonb,
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), reviewer_auth_id,
      jsonb_build_object('sub', reviewer_auth_id::text, 'email', 'applereview@visafaster.com', 'email_verified', true),
      'email', reviewer_auth_id::text,
      now(), now(), now()
    );
  ELSE
    SELECT id INTO reviewer_auth_id FROM auth.users WHERE email = 'applereview@visafaster.com';
  END IF;

  -- Ensure profile exists (create if trigger didn't fire)
  SELECT id INTO reviewer_profile_id FROM public.profiles WHERE user_id = reviewer_auth_id;
  IF reviewer_profile_id IS NULL THEN
    INSERT INTO public.profiles (user_id, full_name, phone)
    VALUES (reviewer_auth_id, 'Apple Reviewer', '966562525665')
    RETURNING id INTO reviewer_profile_id;
  ELSE
    UPDATE public.profiles
      SET full_name = 'Apple Reviewer', phone = '966562525665'
      WHERE id = reviewer_profile_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.applications WHERE user_id = reviewer_profile_id) THEN
    INSERT INTO public.applications (
      user_id, visa_type_id, travel_date, status, purpose_of_travel
    ) VALUES (
      reviewer_profile_id,
      visa_id,
      (now() + interval '60 days')::date,
      'pending_payment',
      jsonb_build_object(
        'travelers', jsonb_build_object('adults', 1, 'children', 0, 'infants', 0),
        'checkedRequirements', jsonb_build_array(),
        'currentStep', 4,
        'demo', true
      )::text
    );
  END IF;
END $$;