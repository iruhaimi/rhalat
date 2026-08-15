-- 1) Remove column-level UPDATE privilege on wallet_balance from client roles
REVOKE UPDATE ON public.profiles FROM authenticated, anon;

GRANT UPDATE (
  full_name, phone, avatar_url, date_of_birth, nationality,
  passport_number, passport_expiry, address, city, country, updated_at
) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-- 2) Harden the trigger: raise instead of silently reverting, and use the JWT role claim
CREATE OR REPLACE FUNCTION public.protect_profile_wallet_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    IF COALESCE(current_setting('request.jwt.claims', true)::json ->> 'role', '') <> 'service_role' THEN
      RAISE EXCEPTION 'wallet_balance can only be modified by the system';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Restrict the self-update RLS policy so it can never persist a wallet_balance change
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND wallet_balance = (SELECT p.wallet_balance FROM public.profiles p WHERE p.id = profiles.id)
);