-- Revoke column-level SELECT of wallet_balance from authenticated & anon
REVOKE SELECT (wallet_balance) ON public.profiles FROM authenticated;
REVOKE SELECT (wallet_balance) ON public.profiles FROM anon;

-- Re-grant explicit column list to authenticated (all cols except wallet_balance)
GRANT SELECT (
  id, user_id, full_name, phone, avatar_url,
  passport_number, passport_expiry, date_of_birth, nationality,
  address, city, country,
  force_logout_after, created_at, updated_at
) ON public.profiles TO authenticated;

-- Owner-only RPC to read their own wallet balance
CREATE OR REPLACE FUNCTION public.get_my_wallet_balance()
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wallet_balance FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_wallet_balance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_wallet_balance() TO authenticated;