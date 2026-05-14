import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/seo/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Scale, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';

export default function Terms() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const sections = [
    {
      titleAr: 'مقدمة',
      titleEn: 'Introduction',
      contentAr: `مرحباً بك في وكالة عطلات رحلاتكم. بزيارتك لموقعنا واستخدام خدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام أي من خدماتنا.

هذه الشروط تحكم العلاقة بينك وبين وكالة عطلات رحلاتكم للسياحة والسفر. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام موقعنا أو خدماتنا.`,
      contentEn: `Welcome to Otolat Rahlatcom. By visiting our website and using our services, you agree to be bound by these terms and conditions. Please read them carefully before using any of our services.

These terms govern the relationship between you and Otolat Rahlatcom Travel Agency. If you do not agree to any of these terms, please do not use our website or services.`
    },
    {
      titleAr: 'تعريفات',
      titleEn: 'Definitions',
      contentAr: `• "الشركة" أو "نحن": تشير إلى وكالة عطلات رحلاتكم للسياحة والسفر.
• "العميل" أو "أنت": تشير إلى أي شخص يستخدم موقعنا أو خدماتنا.
• "الخدمات": تشمل جميع خدمات التأشيرات والسفر التي نقدمها.
• "الطلب": يشير إلى أي طلب تأشيرة يتم تقديمه عبر موقعنا.
• "الرسوم": تشمل رسوم الخدمة ورسوم التأشيرة الحكومية.`,
      contentEn: `• "Company" or "We": refers to Otolat Rahlatcom Travel Agency.
• "Client" or "You": refers to any person using our website or services.
• "Services": includes all visa and travel services we provide.
• "Application": refers to any visa application submitted through our website.
• "Fees": includes service fees and government visa fees.`
    },
    {
      titleAr: 'خدماتنا',
      titleEn: 'Our Services',
      contentAr: `نحن نقدم خدمات المساعدة في الحصول على التأشيرات لمختلف الدول. تشمل خدماتنا:

1. مراجعة الطلبات والمستندات
2. تقديم الطلبات للسفارات والقنصليات
3. متابعة حالة الطلبات
4. تقديم الاستشارات حول متطلبات التأشيرات

نحن لسنا سفارة أو قنصلية ولا نضمن الموافقة على أي طلب. القرار النهائي يعود للجهة المصدرة للتأشيرة.`,
      contentEn: `We provide visa assistance services for various countries. Our services include:

1. Application and document review
2. Submitting applications to embassies and consulates
3. Tracking application status
4. Providing consultations on visa requirements

We are not an embassy or consulate and do not guarantee approval of any application. The final decision rests with the visa-issuing authority.`
    },
    {
      titleAr: 'التزامات العميل',
      titleEn: 'Client Obligations',
      contentAr: `بصفتك عميلاً، أنت توافق على:

1. تقديم معلومات صحيحة ودقيقة وكاملة
2. توفير جميع المستندات المطلوبة في الوقت المحدد
3. عدم تقديم مستندات مزورة أو معلومات كاذبة
4. دفع جميع الرسوم المستحقة في الوقت المحدد
5. الالتزام بمتطلبات السفارة أو القنصلية
6. إبلاغنا بأي تغييرات على معلوماتك أو خططك

أي خرق لهذه الالتزامات قد يؤدي إلى رفض الطلب دون استرداد الرسوم.`,
      contentEn: `As a client, you agree to:

1. Provide true, accurate, and complete information
2. Provide all required documents on time
3. Not submit forged documents or false information
4. Pay all due fees on time
5. Comply with embassy or consulate requirements
6. Inform us of any changes to your information or plans

Any breach of these obligations may result in application rejection without fee refund.`
    },
    {
      titleAr: 'الرسوم والدفع',
      titleEn: 'Fees and Payment',
      contentAr: `1. رسوم الخدمة: هي رسوم غير قابلة للاسترداد تُدفع مقابل خدماتنا.

2. رسوم التأشيرة الحكومية: قد تكون شاملة أو غير شاملة في السعر. يتم توضيح ذلك في كل طلب.

3. طرق الدفع: نقبل البطاقات الائتمانية، مدى، Apple Pay، والتحويل البنكي.

4. التسعير: جميع الأسعار بالريال السعودي ما لم يذكر خلاف ذلك.

5. تغيير الأسعار: نحتفظ بالحق في تعديل أسعارنا دون إشعار مسبق. الطلبات المدفوعة لن تتأثر.`,
      contentEn: `1. Service Fees: These are non-refundable fees paid for our services.

2. Government Visa Fees: May or may not be included in the price. This is clarified in each application.

3. Payment Methods: We accept credit cards, Mada, Apple Pay, and bank transfer.

4. Pricing: All prices are in Saudi Riyal unless otherwise stated.

5. Price Changes: We reserve the right to modify our prices without prior notice. Paid applications will not be affected.`
    },
    {
      titleAr: 'سياسة الإلغاء',
      titleEn: 'Cancellation Policy',
      contentAr: `1. قبل تقديم الطلب للسفارة: يمكن إلغاء الطلب مع استرداد جزئي للرسوم (يخصم رسوم إدارية).

2. بعد تقديم الطلب للسفارة: لا يمكن إلغاء الطلب ولا استرداد الرسوم.

3. رسوم التأشيرة الحكومية: غير قابلة للاسترداد بعد دفعها للسفارة.

راجع سياسة الاسترجاع للحصول على تفاصيل كاملة.`,
      contentEn: `1. Before embassy submission: Application can be cancelled with partial refund (administrative fee deducted).

2. After embassy submission: Application cannot be cancelled and fees are non-refundable.

3. Government visa fees: Non-refundable once paid to the embassy.

See our Refund Policy for complete details.`
    },
    {
      titleAr: 'إخلاء المسؤولية',
      titleEn: 'Disclaimer',
      contentAr: `1. لا نضمن الموافقة على أي طلب تأشيرة. القرار النهائي للجهة المصدرة.

2. لا نتحمل مسؤولية التأخير من قبل السفارات أو القنصليات.

3. لا نتحمل مسؤولية أي خسائر ناتجة عن رفض التأشيرة.

4. المعلومات على موقعنا للاسترشاد فقط وقد تتغير دون إشعار.

5. لا نتحمل مسؤولية أي أخطاء في المعلومات المقدمة من العميل.`,
      contentEn: `1. We do not guarantee approval of any visa application. The final decision rests with the issuing authority.

2. We are not responsible for delays by embassies or consulates.

3. We are not responsible for any losses resulting from visa rejection.

4. Information on our website is for guidance only and may change without notice.

5. We are not responsible for any errors in information provided by the client.`
    },
    {
      titleAr: 'حماية البيانات',
      titleEn: 'Data Protection',
      contentAr: `نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. يرجى مراجعة سياسة الخصوصية للحصول على معلومات تفصيلية حول:

• كيفية جمع بياناتك
• كيفية استخدامها وتخزينها
• حقوقك فيما يتعلق ببياناتك
• إجراءات الأمان المتبعة`,
      contentEn: `We are committed to protecting your privacy and personal data. Please review our Privacy Policy for detailed information about:

• How we collect your data
• How we use and store it
• Your rights regarding your data
• Security measures in place`
    },
    {
      titleAr: 'التعديلات',
      titleEn: 'Amendments',
      contentAr: `نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر أي تعديلات على هذه الصفحة. استمرارك في استخدام خدماتنا بعد أي تعديل يعني موافقتك على الشروط المعدلة.

آخر تحديث: يناير 2025`,
      contentEn: `We reserve the right to modify these terms and conditions at any time. Any modifications will be posted on this page. Your continued use of our services after any modification constitutes acceptance of the modified terms.

Last updated: January 2025`
    },
    {
      titleAr: 'الاتصال بنا',
      titleEn: 'Contact Us',
      contentAr: `إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى الاتصال بنا:

البريد الإلكتروني: info@rhalat.com
الهاتف: 562525665
العنوان: الرياض - حي الربيع - شارع أبي بن معاذ الأنصاري`,
      contentEn: `If you have any questions about these terms and conditions, please contact us:

Email: info@rhalat.com
Phone: 562525665
Address: Riyadh - Al-Rabi' neighborhood - Ubay Bin Moaath Alansari Rd`
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO title="الشروط والأحكام — عطلات رحلاتكم" description="اطّلع على الشروط والأحكام الخاصة باستخدام خدمات منصة عطلات رحلاتكم للتأشيرات." path="/terms" />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'الشروط والأحكام' : 'Terms and Conditions'}
          </h1>
          <p className="text-lg opacity-90">
            {isRTL 
              ? 'آخر تحديث: يناير 2025'
              : 'Last updated: January 2025'
            }
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-4xl mx-auto">
          {/* Quick Summary */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="py-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={`flex gap-4 ${isRTL ? 'flex-row' : 'flex-row'}`}>
                <Info className={`w-6 h-6 text-primary flex-shrink-0 mt-1`} />
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="font-semibold mb-2">
                    {isRTL ? 'ملخص سريع' : 'Quick Summary'}
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className={`flex items-start gap-2 ${isRTL ? 'flex-row' : 'flex-row'}`}>
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL 
                        ? 'نحن نساعدك في تقديم طلبات التأشيرة ولسنا جهة إصدار'
                        : 'We help you submit visa applications, we are not the issuing authority'
                      }</span>
                    </li>
                    <li className={`flex items-start gap-2 ${isRTL ? 'flex-row' : 'flex-row'}`}>
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL 
                        ? 'رسوم الخدمة غير قابلة للاسترداد'
                        : 'Service fees are non-refundable'
                      }</span>
                    </li>
                    <li className={`flex items-start gap-2 ${isRTL ? 'flex-row' : 'flex-row'}`}>
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL 
                        ? 'أنت مسؤول عن دقة المعلومات والمستندات المقدمة'
                        : 'You are responsible for accuracy of information and documents provided'
                      }</span>
                    </li>
                    <li className={`flex items-start gap-2 ${isRTL ? 'flex-row' : 'flex-row'}`}>
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{isRTL 
                        ? 'لا نضمن الموافقة على أي طلب تأشيرة'
                        : 'We do not guarantee approval of any visa application'
                      }</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Terms */}
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    {isRTL ? section.titleAr : section.titleEn}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? section.contentAr : section.contentEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
