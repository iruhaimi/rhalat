-- Restore EXECUTE on check_staff_portal_path for anonymous visitors.
-- This RPC is required by the public DynamicPortalRoute resolver to render the staff
-- login page when the request path matches the current secret_path. It only returns
-- a boolean and never leaks the secret path itself.
GRANT EXECUTE ON FUNCTION public.check_staff_portal_path(text) TO anon, authenticated;