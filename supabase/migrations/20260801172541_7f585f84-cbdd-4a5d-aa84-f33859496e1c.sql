
UPDATE public.site_content SET content = jsonb_set(jsonb_set(content,
  '{description}', '"عطلات رحلاتكم وكالة سفر وسياحة متخصصة في خدمات تجهيز طلبات التأشيرة ومراجعة المستندات. نساعد المسافرين في تجهيز طلبات التأشيرة واستكمال متطلباتها وفق المصادر الرسمية، وقرار المنح يعود حصرياً للجهات الحكومية المختصة."'::jsonb),
  '{description_en}', '"Otolat Rahlatcom is a travel agency specialized in visa application preparation and document review. We help travelers prepare their applications according to official sources; issuance decisions rest solely with the competent government authorities."'::jsonb)
WHERE page = 'about' AND section = 'hero';

UPDATE public.site_content SET content = jsonb_set(jsonb_set(content,
  '{description}', '"تواصل معنا اليوم ودعنا نساعدك في تجهيز طلب التأشيرة بكل سهولة"'::jsonb),
  '{description_en}', '"Contact us today and let us help you prepare your visa application with ease"'::jsonb)
WHERE page = 'about' AND section = 'cta';

UPDATE public.site_content SET content = jsonb_set(jsonb_set(content,
  '{items,0,label}', '"طلب تمت خدمته"'::jsonb),
  '{items,0,label_en}', '"Applications Served"'::jsonb)
WHERE page = 'about' AND section = 'stats';

UPDATE public.site_content SET content = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(content,
  '{items,0,content}', '"خدمة ممتازة وسريعة. جهزوا طلب تأشيرة شنغن وراجعوا مستنداتي خلال 5 أيام فقط! فريق محترف ومتابعة مستمرة."'::jsonb),
  '{items,0,content_en}', '"Excellent and fast service. They prepared and reviewed my Schengen application in just 5 days! Professional team with continuous follow-up."'::jsonb),
  '{items,1,content}', '"فريق محترف ساعدني في تجهيز طلب تأشيرة الدراسة بكل سهولة. أنصح الجميع بالتعامل معهم."'::jsonb),
  '{items,1,content_en}', '"Professional team helped me prepare my student visa application easily. I recommend everyone to deal with them."'::jsonb),
  '{items,4,content}', '"سهولة في التقديم ومتابعة دقيقة للطلب. تم تجهيز الملف وتقديمه قبل الموعد المتوقع!"'::jsonb)
WHERE page = 'home' AND section = 'testimonials';

UPDATE public.site_content SET content = jsonb_set(content,
  '{items,4,content_en}', '"Easy application and precise tracking. My file was prepared and submitted ahead of the expected date!"'::jsonb)
WHERE page = 'home' AND section = 'testimonials';

UPDATE public.site_content SET content = jsonb_set(jsonb_set(content,
  '{items,2,content}', '"أفضل خدمة لتجهيز طلبات التأشيرة استخدمتها. متابعة مستمرة وتواصل ممتاز. سأتعامل معهم دائماً."'::jsonb),
  '{items,2,content_en}', '"Best visa application preparation service I have used. Continuous follow-up and excellent communication."'::jsonb)
WHERE page = 'home' AND section = 'testimonials';
