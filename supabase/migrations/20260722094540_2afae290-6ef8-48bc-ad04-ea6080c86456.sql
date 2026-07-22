
-- Category B: AI admin tools (authenticated only)
REVOKE EXECUTE ON FUNCTION public.ai_agent_performance(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_bulk_notify(text, text, text, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_query_applications(text, integer, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_toggle_offer(uuid, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_update_site_content(text, text, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_update_visa_price(uuid, numeric) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.ai_agent_performance(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_bulk_notify(text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_query_applications(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_toggle_offer(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_update_site_content(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_update_visa_price(uuid, numeric) TO authenticated;

-- Category C: Internal email queue (service_role only)
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

-- Category D: Authenticated-only user action
REVOKE EXECUTE ON FUNCTION public.create_whatsapp_order(uuid, date, jsonb, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_order(uuid, date, jsonb, jsonb) TO authenticated;
