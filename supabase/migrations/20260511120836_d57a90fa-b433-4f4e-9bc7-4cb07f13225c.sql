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
  SELECT c.name INTO app_country
  FROM applications a
  JOIN visa_types vt ON a.visa_type_id = vt.id
  JOIN countries c ON vt.country_id = c.id
  WHERE a.id = NEW.application_id;

  CASE NEW.priority
    WHEN 'urgent' THEN priority_label := '🚨 عاجل: ';
    WHEN 'important' THEN priority_label := '⚠️ مهم: ';
    ELSE priority_label := '';
  END CASE;

  IF NEW.sender_type IN ('agent', 'admin') THEN
    -- Notify the customer (application owner)
    SELECT user_id INTO recipient_id
    FROM applications
    WHERE id = NEW.application_id;

    notification_title := priority_label || CASE
      WHEN NEW.sender_type = 'admin' THEN 'رسالة جديدة من الإدارة'
      ELSE 'رسالة جديدة من الوكيل'
    END;

    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      recipient_id,
      notification_title,
      'لديك رسالة جديدة بخصوص طلب تأشيرة ' || COALESCE(app_country, ''),
      'message',
      '/track?id=' || NEW.application_id::TEXT
    );
  ELSE
    -- Customer message → notify the assigned agent
    SELECT assigned_agent_id INTO recipient_id
    FROM applications
    WHERE id = NEW.application_id;

    IF recipient_id IS NOT NULL THEN
      notification_title := priority_label || 'رسالة جديدة من العميل';
      INSERT INTO notifications (user_id, title, message, type, action_url)
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