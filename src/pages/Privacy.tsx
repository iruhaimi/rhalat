import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/seo/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Eye,
  Lock,
  Database,
  Share2,
  Trash2,
  Mail,
  Globe,
  Cookie,
  AlertTriangle,
  Users,
  Scale,
  Plane,
  FileText,
  Bot,
  RefreshCw
} from 'lucide-react';

export default function Privacy() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const sections = [
    {
      icon: Shield,
      titleAr: 'من نحن',
      titleEn: 'Who We Are',
      contentAr: `**وكالة عطلات رحلاتكم للسياحة والسفر** هي الجهة المسؤولة عن بياناتك الشخصية (يُشار إليها بـ "نحن" أو "لنا" أو "خاصتنا" في إشعار الخصوصية هذا).

يوضح إشعار الخصوصية هذا ما يلي:
• من نحن
• كيف نجمع بياناتك الشخصية ونشاركها ونستخدمها
• كيف يمكنك ممارسة حقوق الخصوصية الخاصة بك

نلتزم بالعمل وفقاً لأحكام **نظام حماية البيانات الشخصية** الصادر بموجب المرسوم الملكي رقم (م/19) بتاريخ 09/02/1443هـ الموافق 16/09/2021م، والمعدّل بموجب المرسوم الملكي رقم (م/148) بتاريخ 05/09/1444هـ الموافق 27/03/2023م.`,
      contentEn: `**Otolat Rahlatcom Travel Agency** is the entity responsible for your personal data (referred to as "we", "us", or "our" in this privacy notice).

This privacy notice explains:
• Who we are
• How we collect, share, and use your personal data
• How you can exercise your privacy rights

We operate in compliance with the **Personal Data Protection Law (PDPL)** issued pursuant to Royal Decree No. (M/19) dated 09/02/1443 AH corresponding to 16/09/2021 G, and amended pursuant to Royal Decree No. (M/148) dated 05/09/1444 AH corresponding to 27/03/2023 G.`
    },
    {
      icon: Database,
      titleAr: 'البيانات الشخصية التي نجمعها منك',
      titleEn: 'Personal Data We Collect From You',
      contentAr: `نقوم بجمع البيانات الشخصية عند:
• إكمال استمارة التواصل عبر الإنترنت
• زيارة موقعنا الإلكتروني
• استخدام تطبيقنا للجوال
• طلب أو شراء أو استخدام خدمة منا
• التواصل معنا (بما في ذلك المكالمات الهاتفية والواتساب والبريد الإلكتروني)

**أنواع البيانات التي نجمعها:**

**بيانات الهوية:** اسمك الكامل، الصور، جواز السفر، تاريخ الميلاد، الجنسية

**بيانات الاتصال:** عنوان بريدك الإلكتروني، أرقام هاتفك، عنوان منزلك

**البيانات المالية:** تفاصيل بطاقتك الائتمانية، كشوف الحسابات البنكية

**البيانات الحساسة:** شهادات طبية، معلومات صحية (عند الحاجة لطلب التأشيرة)

من المهم أن تكون البيانات الشخصية التي نحتفظ بها عنك دقيقة ومحدثة. يرجى إبقاؤنا على اطلاع بأي تغييرات تطرأ على بياناتك الشخصية.`,
      contentEn: `We collect personal data when you:
• Complete an online contact form
• Visit our website
• Use our mobile application
• Request, purchase, or use a service from us
• Contact us (including phone calls, WhatsApp, and email)

**Types of data we collect:**

**Identity Data:** Your full name, photos, passport, date of birth, nationality

**Contact Data:** Your email address, phone numbers, home address

**Financial Data:** Your credit card details, bank statements

**Sensitive Data:** Medical certificates, health information (when required for visa application)

It is important that the personal data we hold about you is accurate and up to date. Please keep us informed of any changes to your personal data.`
    },
    {
      icon: Users,
      titleAr: 'البيانات الشخصية التي نجمعها من الآخرين',
      titleEn: 'Personal Data We Collect From Others',
      contentAr: `في بعض الأحيان نعمل مع أطراف ثالثة مختارة بعناية، وقد نتلقى بياناتك الشخصية منها. تشمل الأطراف الثالثة:

• **السفارات والقنصليات:** معلومات حول حالة طلب التأشيرة
• **شركاء الخدمة:** شركات الطيران والفنادق
• **شركاء الأعمال:** الوكالات الأخرى التي نتعاون معها`,
      contentEn: `Sometimes we work with carefully selected third parties, and we may receive your personal data from them. Third parties include:

• **Embassies and Consulates:** Information about visa application status
• **Service Partners:** Airlines and hotels
• **Business Partners:** Other agencies we collaborate with`
    },
    {
      icon: Scale,
      titleAr: 'الأسس القانونية لمعالجة بياناتك',
      titleEn: 'Legal Basis for Processing Your Data',
      contentAr: `نقوم بمعالجة بياناتك الشخصية بناءً على الأسس القانونية التالية:

**الموافقة:** عندما تمنحنا موافقة صريحة لمعالجة بياناتك لأغراض محددة

**العقود:** عندما تكون المعالجة ضرورية لتنفيذ العقد الذي أنت طرف فيه (مثل معالجة طلب التأشيرة)

**الالتزام القانوني:** عندما نحتاج إلى الامتثال لالتزام قانوني

**المصالح المشروعة:** عندما يكون ذلك ضروريًا لمصالحنا المشروعة ولا تتعارض مصالحك وحقوقك مع تلك المصالح`,
      contentEn: `We process your personal data based on the following legal grounds:

**Consent:** When you give us explicit consent to process your data for specific purposes

**Contracts:** When processing is necessary to perform a contract you are party to (such as processing a visa application)

**Legal Obligation:** When we need to comply with a legal obligation

**Legitimate Interests:** When necessary for our legitimate interests and your interests and rights do not conflict with those interests`
    },
    {
      icon: Eye,
      titleAr: 'كيف نستخدم بياناتك الشخصية',
      titleEn: 'How We Use Your Personal Data',
      contentAr: `نستخدم بياناتك الشخصية للأغراض التالية:

**توفير المعلومات التي طلبتها:**
أنواع البيانات: الهوية، التواصل (المصالح المشروعة)

**تقديم خدمة لك:**
أنواع البيانات: الهوية والتواصل (العقود)

**إدارة طلبات التأشيرة:**
أنواع البيانات: بيانات الهوية والاتصال والبيانات المالية والحساسة (العقود)

**تسويق منتجاتنا وخدماتنا:**
أنواع البيانات: الهوية والتواصل (الموافقة)

**طلب تعليقات وملاحظات:**
أنواع البيانات: الهوية والتواصل (المصالح المشروعة)

عندما نقوم بمعالجة بياناتك الشخصية لتحقيق مصالحنا المشروعة، يمكنك الاعتراض على معالجة بياناتك الشخصية.`,
      contentEn: `We use your personal data for the following purposes:

**Providing information you requested:**
Data types: Identity, Contact (Legitimate Interests)

**Providing a service to you:**
Data types: Identity and Contact (Contracts)

**Managing visa applications:**
Data types: Identity, Contact, Financial, and Sensitive data (Contracts)

**Marketing our products and services:**
Data types: Identity and Contact (Consent)

**Requesting feedback:**
Data types: Identity and Contact (Legitimate Interests)

When we process your personal data to achieve our legitimate interests, you can object to the processing of your personal data.`
    },
    {
      icon: Share2,
      titleAr: 'مشاركة بياناتك الشخصية',
      titleEn: 'Sharing Your Personal Data',
      contentAr: `عند الضرورة، نقوم بمشاركة بياناتك الشخصية مع:

• **السفارات والقنصليات:** لمعالجة طلبات التأشيرة
• **شركاء الخدمة:** شركات الطيران والإقامات
• **مقدمي خدمات الدفع:** لمعالجة المدفوعات
• **السلطات الضريبية والتنظيمية:** عند الحاجة
• **السلطات الحكومية:** مثل معالجة التأشيرات
• **السلطات القضائية والمحاكم:** عند الإجراءات القانونية
• **وكالات إنفاذ القانون:** عند الطلب القانوني

**لا نبيع** بياناتك الشخصية لأي طرف ثالث أبداً.`,
      contentEn: `When necessary, we share your personal data with:

• **Embassies and Consulates:** For processing visa applications
• **Service Partners:** Airlines and accommodations
• **Payment Service Providers:** For processing payments
• **Tax and Regulatory Authorities:** When required
• **Government Authorities:** Such as visa processing
• **Judicial Authorities and Courts:** For legal proceedings
• **Law Enforcement Agencies:** When legally required

We **never sell** your personal data to any third party.`
    },
    {
      icon: Plane,
      titleAr: 'نقل البيانات دولياً',
      titleEn: 'International Data Transfers',
      contentAr: `قد يتم نقل بياناتك الشخصية ومعالجتها في دول خارج المملكة العربية السعودية. قد لا توفر بعض هذه البلدان نفس مستوى حماية البيانات المتوفر في المملكة.

في حال نقل بياناتك الشخصية خارج المملكة العربية السعودية:
• سيتم مشاركتها مع السفارات والقنصليات وشركائنا في الخدمة
• نضمن وجود الضمانات المناسبة لحماية بياناتك
• نلتزم بمتطلبات نظام حماية البيانات الشخصية السعودي (PDPL)

يلتزم مقدمو خدماتنا وشركاؤنا بالحفاظ على سرية بياناتك الشخصية ولن يشاركوها مع أي أطراف ثالثة.`,
      contentEn: `Your personal data may be transferred and processed in countries outside the Kingdom of Saudi Arabia. Some of these countries may not provide the same level of data protection available in the Kingdom.

When your personal data is transferred outside Saudi Arabia:
• It will be shared with embassies, consulates, and our service partners
• We ensure appropriate safeguards are in place to protect your data
• We comply with Saudi Personal Data Protection Law (PDPL) requirements

Our service providers and partners are committed to maintaining the confidentiality of your personal data and will not share it with any third parties.`
    },
    {
      icon: Lock,
      titleAr: 'حماية بياناتك',
      titleEn: 'Protecting Your Data',
      contentAr: `نتخذ إجراءات أمنية صارمة لحماية معلوماتك:

• **تشفير SSL:** جميع البيانات المنقولة مشفرة
• **تخزين آمن:** المستندات محفوظة في خوادم مشفرة
• **التحكم في الوصول:** وصول محدود للموظفين المصرح لهم فقط
• **المراقبة المستمرة:** مراقبة الأنظمة للكشف عن أي نشاط مشبوه
• **التحديثات الأمنية:** تحديث منتظم لأنظمتنا الأمنية`,
      contentEn: `We take strict security measures to protect your information:

• **SSL Encryption:** All transmitted data is encrypted
• **Secure Storage:** Documents stored on encrypted servers
• **Access Control:** Limited access to authorized personnel only
• **Continuous Monitoring:** Systems monitored for suspicious activity
• **Security Updates:** Regular updates to our security systems`
    },
    {
      icon: Trash2,
      titleAr: 'الاحتفاظ ببياناتك الشخصية',
      titleEn: 'Retention of Your Personal Data',
      contentAr: `نحتفظ بالبيانات الشخصية طالما كان ذلك ضروريًا للأغراض التالية:

• **معالجة طلبك:** طوال فترة معالجة الطلب
• **الالتزامات القانونية والتنظيمية:** وفقاً للمتطلبات القانونية
• **الترافع في الدعاوى القانونية:** عند الحاجة
• **المرجعية:** نحتفظ بالبيانات لمدة سنتين بعد اكتمال الطلب

بعد انتهاء فترة الاحتفاظ، يتم حذف بياناتك بشكل آمن.`,
      contentEn: `We retain personal data as long as necessary for the following purposes:

• **Processing your application:** Throughout the application processing period
• **Legal and regulatory obligations:** According to legal requirements
• **Legal proceedings:** When needed
• **Reference:** We keep data for two years after application completion

After the retention period ends, your data is securely deleted.`
    },
    {
      icon: Globe,
      titleAr: 'حقوقك كصاحب بيانات',
      titleEn: 'Your Rights as a Data Subject',
      contentAr: `نعترف بحقوقك المتعلقة ببياناتك الشخصية وفقاً لنظام حماية البيانات الشخصية. يمكنك طلب ممارسة حقوقك في أي وقت عن طريق التواصل معنا:

**الحق في الحصول على المعلومات:** الحصول على معلومات واضحة وشفافة حول كيفية جمع بياناتك واستخدامها ومشاركتها

**الحق في الوصول:** طلب الوصول إلى بياناتك الشخصية والحصول على نسخة منها

**الحق في التصحيح:** طلب تصحيح البيانات غير الدقيقة أو غير الكاملة

**الحق في الحذف:** طلب حذف بياناتك الشخصية في ظروف معينة

**الحق في التقييد:** طلب تقييد معالجة بياناتك الشخصية

**الحق في نقل البيانات:** طلب استلام بياناتك بتنسيق منظم وقابل للقراءة آليًا

**الحق في الاعتراض:** الاعتراض على معالجة بياناتك، بما في ذلك لأغراض التسويق المباشر

**الحق في سحب الموافقة:** إذا كانت المعالجة تعتمد على موافقتك، فلديك الحق في سحب الموافقة في أي وقت

قد تخضع هذه الحقوق لاستثناءات وقيود مختلفة وفقًا لنظام حماية البيانات الشخصية.`,
      contentEn: `We recognize your rights regarding your personal data according to the Personal Data Protection Law. You can request to exercise your rights at any time by contacting us:

**Right to Information:** Obtain clear and transparent information about how your data is collected, used, and shared

**Right to Access:** Request access to your personal data and obtain a copy

**Right to Correction:** Request correction of inaccurate or incomplete data

**Right to Deletion:** Request deletion of your personal data in certain circumstances

**Right to Restriction:** Request restriction of processing your personal data

**Right to Data Portability:** Request to receive your data in a structured, machine-readable format

**Right to Object:** Object to processing your data, including for direct marketing purposes

**Right to Withdraw Consent:** If processing is based on your consent, you have the right to withdraw consent at any time

These rights may be subject to various exceptions and limitations according to the Personal Data Protection Law.`
    },
    {
      icon: AlertTriangle,
      titleAr: 'تقديم شكوى بشأن حماية البيانات',
      titleEn: 'Filing a Data Protection Complaint',
      contentAr: `إذا كانت لديك أي شكاوى حول استخدام بياناتك الشخصية أو مخاوف بشأن كيفية التعامل مع بياناتك وحقوقك، يمكنك:

**1. التواصل معنا مباشرة:**
يمكنك تقديم شكوى إلينا باستخدام معلومات التواصل المذكورة أدناه

**2. تقديم شكوى للجهة الرقابية:**
إذا لم تكن راضيًا عن طريقة تعاملنا مع شكواك، يحق لك رفع شكوى مباشرة إلى **الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)**`,
      contentEn: `If you have any complaints about the use of your personal data or concerns about how your data and rights are handled, you can:

**1. Contact us directly:**
You can submit a complaint to us using the contact information below

**2. File a complaint with the regulatory authority:**
If you are not satisfied with how we handled your complaint, you have the right to file a complaint directly with the **Saudi Data and Artificial Intelligence Authority (SDAIA)**`
    },
    {
      icon: FileText,
      titleAr: 'إشعار خرق البيانات',
      titleEn: 'Data Breach Notification',
      contentAr: `في حالة حدوث خرق للبيانات:

• سنقوم بإخطار السلطة الإشرافية المختصة (سدايا) في غضون **72 ساعة** من علمنا بالخرق، كما هو مطلوب بموجب القانون

• إذا كان من المحتمل أن يشكل الخرق خطرًا كبيرًا على حقوقك وحرياتك، سنقوم بإبلاغك دون تأخير غير مبرر

• سنتخذ جميع الإجراءات اللازمة للحد من آثار الخرق وحماية بياناتك`,
      contentEn: `In case of a data breach:

• We will notify the competent supervisory authority (SDAIA) within **72 hours** of becoming aware of the breach, as required by law

• If the breach is likely to pose a significant risk to your rights and freedoms, we will inform you without undue delay

• We will take all necessary measures to mitigate the effects of the breach and protect your data`
    },
    {
      icon: Bot,
      titleAr: 'التوصيف واتخاذ القرارات الآلي',
      titleEn: 'Profiling and Automated Decision-Making',
      contentAr: `**التوصيف:**
نحن لا نشارك في أي أنشطة إنشاء ملف تعريفي باستخدام بياناتك الشخصية

**اتخاذ القرارات الآلي:**
نحن لا نستخدم أي عمليات آلية لاتخاذ قرارات بشأنك والتي تنتج تأثيرات قانونية أو ذات أثر بالغ عليك`,
      contentEn: `**Profiling:**
We do not engage in any profiling activities using your personal data

**Automated Decision-Making:**
We do not use any automated processes to make decisions about you that produce legal effects or significantly affect you`
    },
    {
      icon: Cookie,
      titleAr: 'ملفات تعريف الارتباط',
      titleEn: 'Cookies',
      contentAr: `نستخدم ملفات تعريف الارتباط (Cookies) لـ:

• **تحسين تجربة التصفح:** تذكر تفضيلاتك
• **تحليل الاستخدام:** فهم كيفية استخدام الموقع
• **الإعلانات:** عرض إعلانات ملائمة (بموافقتك)

يمكنك التحكم في ملفات تعريف الارتباط من إعدادات متصفحك.`,
      contentEn: `We use cookies for:

• **Improving browsing experience:** Remembering your preferences
• **Usage analytics:** Understanding how the website is used
• **Advertising:** Showing relevant ads (with your consent)

You can control cookies through your browser settings.`
    },
    {
      icon: RefreshCw,
      titleAr: 'التغييرات على إشعار الخصوصية',
      titleEn: 'Changes to This Privacy Notice',
      contentAr: `يجوز لنا تحديث إشعار الخصوصية هذا بشكل دوري ليعكس التغييرات في ممارساتنا أو المتطلبات القانونية.

إذا أجرينا تغييرات جوهرية، سنقوم بـ:
• نشر الإشعار المحدث على موقعنا الإلكتروني
• مراجعة تاريخ "آخر تحديث" في أسفل هذا الإشعار
• إخطارك عبر البريد الإلكتروني عند الضرورة`,
      contentEn: `We may update this privacy notice periodically to reflect changes in our practices or legal requirements.

If we make material changes, we will:
• Post the updated notice on our website
• Revise the "Last Updated" date at the bottom of this notice
• Notify you by email when necessary`
    },
    {
      icon: Mail,
      titleAr: 'تواصل معنا',
      titleEn: 'Contact Us',
      contentAr: `إذا كان لديك أي أسئلة حول إشعار الخصوصية، استخدام بياناتك الشخصية، أو إذا كنت ترغب في ممارسة أي من حقوق الخصوصية الخاصة بك، يرجى التواصل معنا:

**وكالة عطلات رحلاتكم للسياحة والسفر:**

**عن طريق البريد الإلكتروني:** info@rhalat.com

**عن طريق الهاتف:** 562525665

**العنوان:** الرياض - حي الربيع - شارع أبي بن معاذ الأنصاري

**آخر تحديث:** يناير 2025`,
      contentEn: `If you have any questions about this privacy notice, the use of your personal data, or if you would like to exercise any of your privacy rights, please contact us:

**Otolat Rahlatcom Travel Agency:**

**By Email:** info@rhalat.com

**By Phone:** 562525665

**Address:** Riyadh - Al-Rabi' neighborhood - Ubay Bin Moaath Alansari Rd

**Last Updated:** January 2025`
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO title="سياسة الخصوصية — عطلات رحلاتكم" description="تعرف على كيفية حماية بياناتك الشخصية وفقًا لنظام حماية البيانات الشخصية في المملكة العربية السعودية." path="/privacy" />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-lg opacity-90">
            {isRTL 
              ? 'كيف نحمي خصوصيتك ونتعامل مع بياناتك'
              : 'How we protect your privacy and handle your data'
            }
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-4xl mx-auto">
          {/* PDPL Compliance Notice */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="py-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className={`text-muted-foreground leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL 
                      ? 'نلتزم بتطبيق نظام حماية البيانات الشخصية السعودي والصادر من الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) لضمان حماية خصوصيتك وفقاً لأعلى المعايير.'
                      : 'We are committed to applying the Saudi Personal Data Protection Law issued by the Saudi Data and Artificial Intelligence Authority (SDAIA) to ensure your privacy is protected according to the highest standards.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index}>
                  <CardHeader className="pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
                    <CardTitle className={`flex items-center gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span>{isRTL ? section.titleAr : section.titleEn}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="text-muted-foreground whitespace-pre-line leading-relaxed prose prose-sm max-w-none"
                      style={{ textAlign: isRTL ? 'right' : 'left' }}
                      dangerouslySetInnerHTML={{ 
                        __html: (isRTL ? section.contentAr : section.contentEn)
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
