-- Prevent users from directly modifying wallet_balance via the profiles table.
-- Only service_role (Edge Functions / admin RPCs) may change it.
CREATE OR REPLACE FUNCTION public.protect_profile_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    IF COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'role'),
      ''
    ) <> 'service_role' THEN
      NEW.wallet_balance := OLD.wallet_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_wallet_balance_trigger ON public.profiles;
CREATE TRIGGER protect_profile_wallet_balance_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_wallet_balance();