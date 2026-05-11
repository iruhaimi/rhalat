
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recipient_id UUID;
  app_country TEXT;
  priority_label TEXT;
  notification_title TEXT;
BEGIN
  -- Defensive: this function must only run as a trigger on application_messages
  IF TG_OP IS NULL OR TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME <> 'application_messages' THEN
    RAISE EXCEPTION 'notify_on_new_message must be invoked as a trigger on public.application_messages';
  END IF;

  SELECT c.name INTO app_country
  FROM public.applications a
  JOIN public.visa_types vt ON a.visa_type_id = vt.id
  JOIN public.countries c ON vt.country_id = c.id
  WHERE a.id = NEW.application_id;

  CASE NEW.priority
    WHEN 'urgent' THEN priority_label := '🚨 عاجل: ';
    WHEN 'important' THEN priority_label := '⚠️ مهم: ';
    ELSE priority_label := '';
  END CASE;

  IF NEW.sender_type IN ('agent', 'admin') THEN
    SELECT user_id INTO recipient_id
    FROM public.applications
    WHERE id = NEW.application_id;

    notification_title := priority_label || CASE
      WHEN NEW.sender_type = 'admin' THEN 'رسالة جديدة من الإدارة'
      ELSE 'رسالة جديدة من الوكيل'
    END;

    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      recipient_id,
      notification_title,
      'لديك رسالة جديدة بخصوص طلب تأشيرة ' || COALESCE(app_country, ''),
      'message',
      '/track?id=' || NEW.application_id::TEXT
    );
  ELSE
    SELECT assigned_agent_id INTO recipient_id
    FROM public.applications
    WHERE id = NEW.application_id;

    IF recipient_id IS NOT NULL THEN
      notification_title := priority_label || 'رسالة جديدة من العميل';
      INSERT INTO public.notifications (user_id, title, message, type, action_url)
      VALUES (
        recipient_id,
        notification_title,
        'لديك رسالة جديدة بخصوص طلب تأشيرة ' || COALESCE(app_country, ''),
        'message',
        '/agent/applications/' || NEW.application_id::TEXT
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Restrict EXECUTE: only the table owner (trigger runtime) needs it; no end-user role should call this directly.
REVOKE ALL ON FUNCTION public.notify_on_new_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_on_new_message() FROM anon;
REVOKE ALL ON FUNCTION public.notify_on_new_message() FROM authenticated;
