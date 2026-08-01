UPDATE public.hero_settings
SET value = 'نقدم لك خدمات المساعدة في تجهيز طلبات التأشيرة والسفر بأعلى جودة. احصل على المساعدة في تجهيز طلب التأشيرة مع فريقنا المتخصص.',
    value_en = 'We provide visa application preparation assistance and travel services. Get help preparing your visa application.'
WHERE key = 'description';

UPDATE public.site_content
SET content = jsonb_set(
      jsonb_set(
        jsonb_set(content, '{subtitle}', '"جهز طلب التأشيرة في 4 خطوات بسيطة"'),
        '{subtitle_en}', '"Prepare your visa application in 4 simple steps"'
      ),
      '{items,3}',
      '{"icon":"Plane","title":"تابع طلبك","title_en":"Track Application","description":"تابع حالة طلبك حتى صدور قرار الجهة الرسمية","description_en":"Track your application until the official authority issues its decision"}'::jsonb
    )
WHERE page = 'home' AND section = 'how_it_works';

UPDATE public.site_content
SET content = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(content, '{description}', '"انضم لآلاف العملاء وابدأ تجهيز طلب التأشيرة الخاص بك"'),
          '{description_en}', '"Join thousands of clients and start preparing your visa application"'
        ),
        '{primary_button}', '"ابدأ طلب خدمة تجهيز التأشيرة"'
      ),
      '{primary_button_en}', '"Start visa preparation request"'
    )
WHERE page = 'home' AND section = 'cta';

UPDATE public.site_content
SET content = jsonb_set(
      jsonb_set(content, '{apply_btn}', '"ابدأ الطلب"'),
      '{apply_btn_en}', '"Start request"'
    )
WHERE (page = 'visa_services' AND section = 'card_labels')
   OR (page = 'visa_detail' AND section = 'labels');

UPDATE public.site_content
SET content = jsonb_set(
      jsonb_set(content, '{value_ar}', '"هذا الموقع يقدم خدمات المساعدة في تجهيز طلبات التأشيرات فقط، ولا يصدر التأشيرات ولا يمثل أي سفارة أو جهة حكومية رسمية."'),
      '{value_en}', '"This website provides visa application preparation assistance only. It does not issue visas and does not represent any embassy or official government entity."'
    )
WHERE content::text LIKE '%المساعدة في إصدار التأشيرات%';