import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Header
    'nav.home': 'الرئيسية',
    'nav.destinations': 'الدول',
    'nav.pricing': 'الأسعار',
    'nav.track': 'تتبع الطلب',
    'nav.faq': 'الأسئلة الشائعة',
    'nav.about': 'من نحن',
    'nav.contact': 'تواصل معنا',
    'nav.requirements': 'المتطلبات',
    'nav.startApplication': 'ابدأ طلبك',
    'nav.signIn': 'تسجيل الدخول',
    'nav.signUp': 'إنشاء حساب',
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.myApplications': 'طلباتي',
    'nav.signOut': 'تسجيل الخروج',
    
    // Hero
    'hero.title': 'قدّم على تأشيرتك بسهولة وأمان',
    'hero.subtitle': 'خدمات إصدار التأشيرات لأكثر من 50 دولة حول العالم. نضمن لك تجربة سلسة وسريعة.',
    'hero.cta': 'اختر وجهتك وابدأ',
    'hero.searchPlaceholder': 'ابحث عن الدولة...',
    'hero.trusted': 'موثوق من قبل أكثر من 10,000 مسافر',
    
    // Stats
    'stats.countries': 'دولة',
    'stats.clients': 'عميل سعيد',
    'stats.successRate': 'نسبة النجاح',
    'stats.support': 'دعم متواصل',
    
    // How it works
    'howItWorks.title': 'كيف نعمل',
    'howItWorks.subtitle': 'احصل على تأشيرتك في 4 خطوات بسيطة',
    'howItWorks.step1.title': 'اختر الدولة',
    'howItWorks.step1.desc': 'حدد وجهتك ونوع التأشيرة المطلوبة',
    'howItWorks.step2.title': 'املأ البيانات',
    'howItWorks.step2.desc': 'أدخل معلوماتك الشخصية وتفاصيل السفر',
    'howItWorks.step3.title': 'ارفع المستندات',
    'howItWorks.step3.desc': 'قم برفع المستندات المطلوبة بسهولة',
    'howItWorks.step4.title': 'ادفع وتابع',
    'howItWorks.step4.desc': 'أتمم الدفع وتابع حالة طلبك',
    
    // Features
    'features.title': 'لماذا تختارنا؟',
    'features.subtitle': 'نجعل عملية التأشيرة سهلة وسريعة',
    'features.support': 'دعم سريع',
    'features.supportDesc': 'فريق متخصص جاهز لمساعدتك على مدار الساعة',
    'features.tracking': 'تتبع الطلب',
    'features.trackingDesc': 'تابع حالة طلبك لحظة بلحظة',
    'features.experts': 'مستشارون خبراء',
    'features.expertsDesc': 'فريق من الخبراء في مجال التأشيرات',
    'features.transparent': 'أسعار شفافة',
    'features.transparentDesc': 'لا رسوم خفية - كل شيء واضح من البداية',
    
    // Countries
    'countries.title': 'الدول المتاحة',
    'countries.subtitle': 'اختر وجهتك من قائمة الدول',
    'countries.viewAll': 'عرض كل الدول',
    'countries.processingDays': 'يوم معالجة',
    'countries.startingFrom': 'يبدأ من',
    'countries.applyNow': 'قدّم الآن',
    'countries.details': 'التفاصيل',
    
    // Pricing
    'pricing.title': 'الأسعار والباقات',
    'pricing.subtitle': 'أسعار واضحة وشفافة لجميع خدماتنا',
    'pricing.serviceFeesIncluded': 'شامل رسوم الخدمة',
    'pricing.visaFeesIncluded': 'شامل رسوم التأشيرة',
    'pricing.visaFeesNotIncluded': 'غير شامل رسوم التأشيرة',
    'pricing.adult': 'بالغ (12+ سنة)',
    'pricing.child': 'طفل (6-12 سنة)',
    'pricing.infant': 'رضيع (أقل من 6)',
    'pricing.total': 'الإجمالي',
    'pricing.perPerson': 'للشخص',
    
    // Application Wizard
   'wizard.step1': 'تفاصيل التأشيرة',
   'wizard.step2': 'المتطلبات والسعر',
   'wizard.step3': 'طريقة الإكمال',
   'wizard.step4': 'رفع المستندات',
   'wizard.step5': 'الدفع',
   'wizard.step6': 'الدفع',
    'wizard.next': 'التالي',
    'wizard.previous': 'السابق',
    'wizard.submit': 'إرسال الطلب',
    'wizard.pay': 'ادفع الآن',
    
    // Form fields
    'form.fullName': 'الاسم الكامل',
    'form.email': 'البريد الإلكتروني',
    'form.phone': 'رقم الجوال',
    'form.country': 'الدولة',
    'form.visaType': 'نوع التأشيرة',
    'form.travelDate': 'تاريخ السفر',
    'form.travelers': 'عدد المسافرين',
    'form.adults': 'بالغين',
    'form.children': 'أطفال',
    'form.infants': 'رضع',
    
    // Documents
    'documents.title': 'رفع المستندات',
    'documents.upload': 'ارفع الملف',
    'documents.uploaded': 'تم الرفع',
    'documents.pending': 'قيد الانتظار',
    'documents.maxSize': 'الحد الأقصى: 10 ميجابايت',
    'documents.formats': 'PDF, JPG, PNG',
    
    // Requirements
    'requirements.title': 'المتطلبات',
    'requirements.passport': 'جواز سفر ساري (6 أشهر على الأقل)',
    'requirements.photo': 'صور شخصية بخلفية بيضاء',
    'requirements.bankStatement': 'كشف حساب بنكي',
    'requirements.hotelBooking': 'حجز فندقي',
    'requirements.flightBooking': 'حجز طيران',
    'requirements.travelInsurance': 'تأمين سفر',
    
    // Track
    'track.title': 'تتبع طلبك',
    'track.subtitle': 'أدخل رقم الطلب لمعرفة حالته',
    'track.applicationNumber': 'رقم الطلب',
    'track.phoneOrEmail': 'رقم الجوال أو البريد',
    'track.search': 'بحث',
    
    // Status
    'status.draft': 'مسودة',
    'status.pending_payment': 'بانتظار الدفع',
    'status.submitted': 'تم الإرسال',
    'status.under_review': 'قيد المراجعة',
    'status.documents_required': 'مستندات مطلوبة',
    'status.processing': 'جاري المعالجة',
    'status.approved': 'تمت الموافقة',
    'status.rejected': 'مرفوض',
    'status.cancelled': 'ملغي',
    
    // Payment
    'payment.title': 'الدفع',
    'payment.summary': 'ملخص الطلب',
    'payment.selectMethod': 'اختر طريقة الدفع',
    'payment.card': 'بطاقة ائتمانية',
    'payment.payNow': 'ادفع الآن',
    'payment.success': 'تم الدفع بنجاح!',
    'payment.failed': 'فشل الدفع',
    'payment.tryAgain': 'حاول مرة أخرى',
    'payment.applicationNumber': 'رقم طلبك هو',
    'payment.trackApplication': 'تتبع الطلب',
    'payment.downloadReceipt': 'تحميل الإيصال',
    
    // Footer
    'footer.about': 'نحن شركة متخصصة في إصدار التأشيرات لجميع دول العالم. نقدم خدمات احترافية وسريعة.',
    'footer.quickLinks': 'روابط سريعة',
    'footer.policies': 'السياسات',
    'footer.terms': 'الشروط والأحكام',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.refund': 'سياسة الاسترجاع',
    'footer.contact': 'تواصل معنا',
    'footer.workingHours': 'ساعات العمل',
    'footer.workingHoursValue': 'الأحد - الخميس: 9 ص - 6 م',
    'footer.rights': 'جميع الحقوق محفوظة',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'تم بنجاح',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.back': 'رجوع',
    'common.close': 'إغلاق',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.all': 'الكل',
    'common.noResults': 'لا توجد نتائج',
    'common.sar': 'ر.س',
    'common.usd': 'دولار',
    'common.days': 'يوم',
    
    // Validation
    'validation.required': 'هذا الحقل مطلوب',
    'validation.email': 'البريد الإلكتروني غير صحيح',
    'validation.phone': 'رقم الجوال غير صحيح',
    'validation.minLength': 'الحد الأدنى للحروف هو',
    'validation.maxLength': 'الحد الأقصى للحروف هو',
    'validation.agreeTerms': 'يجب الموافقة على الشروط والأحكام',
    
    // FAQ
    'faq.title': 'الأسئلة الشائعة',
    'faq.subtitle': 'إجابات على أكثر الأسئلة شيوعاً',
    'faq.viewAll': 'عرض كل الأسئلة',
    
    // About
    'about.title': 'من نحن',
    'about.subtitle': 'شريكك الموثوق في خدمات التأشيرات',
    
    // Contact
    'contact.title': 'تواصل معنا',
    'contact.subtitle': 'نحن هنا لمساعدتك',
    'contact.name': 'الاسم',
    'contact.message': 'الرسالة',
    'contact.send': 'إرسال',
  },
  en: {
    // Header
    'nav.home': 'Home',
    'nav.destinations': 'Destinations',
    'nav.pricing': 'Pricing',
    'nav.track': 'Track Application',
    'nav.faq': 'FAQ',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.requirements': 'Requirements',
    'nav.startApplication': 'Start Application',
    'nav.signIn': 'Sign In',
    'nav.signUp': 'Sign Up',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.myApplications': 'My Applications',
    'nav.signOut': 'Sign Out',
    
    // Hero
    'hero.title': 'Apply for Your Visa with Ease and Security',
    'hero.subtitle': 'Visa services for over 50 countries worldwide. We guarantee a smooth and fast experience.',
    'hero.cta': 'Choose Your Destination',
    'hero.searchPlaceholder': 'Search for a country...',
    'hero.trusted': 'Trusted by over 10,000 travelers',
    
    // Stats
    'stats.countries': 'Countries',
    'stats.clients': 'Happy Clients',
    'stats.successRate': 'Success Rate',
    'stats.support': '24/7 Support',
    
    // How it works
    'howItWorks.title': 'How It Works',
    'howItWorks.subtitle': 'Get your visa in 4 simple steps',
    'howItWorks.step1.title': 'Choose Country',
    'howItWorks.step1.desc': 'Select your destination and visa type',
    'howItWorks.step2.title': 'Fill Details',
    'howItWorks.step2.desc': 'Enter your personal and travel information',
    'howItWorks.step3.title': 'Upload Documents',
    'howItWorks.step3.desc': 'Upload required documents easily',
    'howItWorks.step4.title': 'Pay & Track',
    'howItWorks.step4.desc': 'Complete payment and track your application',
    
    // Features
    'features.title': 'Why Choose Us?',
    'features.subtitle': 'We make the visa process easy and fast',
    'features.support': 'Fast Support',
    'features.supportDesc': 'Dedicated team ready to help 24/7',
    'features.tracking': 'Track Application',
    'features.trackingDesc': 'Track your application status in real-time',
    'features.experts': 'Expert Consultants',
    'features.expertsDesc': 'Team of visa experts at your service',
    'features.transparent': 'Transparent Pricing',
    'features.transparentDesc': 'No hidden fees - everything is clear from the start',
    
    // Countries
    'countries.title': 'Available Countries',
    'countries.subtitle': 'Choose your destination',
    'countries.viewAll': 'View All Countries',
    'countries.processingDays': 'Processing Days',
    'countries.startingFrom': 'Starting from',
    'countries.applyNow': 'Apply Now',
    'countries.details': 'Details',
    
    // Pricing
    'pricing.title': 'Pricing & Packages',
    'pricing.subtitle': 'Clear and transparent pricing for all services',
    'pricing.serviceFeesIncluded': 'Service fees included',
    'pricing.visaFeesIncluded': 'Visa fees included',
    'pricing.visaFeesNotIncluded': 'Visa fees not included',
    'pricing.adult': 'Adult (12+ years)',
    'pricing.child': 'Child (6-12 years)',
    'pricing.infant': 'Infant (under 6)',
    'pricing.total': 'Total',
    'pricing.perPerson': 'per person',
    
    // Application Wizard
   'wizard.step1': 'Visa Details',
   'wizard.step2': 'Requirements & Price',
   'wizard.step3': 'Choose Path',
   'wizard.step4': 'Upload Documents',
   'wizard.step5': 'Payment',
   'wizard.step6': 'Payment',
    'wizard.next': 'Next',
    'wizard.previous': 'Previous',
    'wizard.submit': 'Submit Application',
    'wizard.pay': 'Pay Now',
    
    // Form fields
    'form.fullName': 'Full Name',
    'form.email': 'Email',
    'form.phone': 'Phone Number',
    'form.country': 'Country',
    'form.visaType': 'Visa Type',
    'form.travelDate': 'Travel Date',
    'form.travelers': 'Travelers',
    'form.adults': 'Adults',
    'form.children': 'Children',
    'form.infants': 'Infants',
    
    // Documents
    'documents.title': 'Upload Documents',
    'documents.upload': 'Upload File',
    'documents.uploaded': 'Uploaded',
    'documents.pending': 'Pending',
    'documents.maxSize': 'Max size: 10MB',
    'documents.formats': 'PDF, JPG, PNG',
    
    // Requirements
    'requirements.title': 'Requirements',
    'requirements.passport': 'Valid passport (6+ months validity)',
    'requirements.photo': 'Passport photos with white background',
    'requirements.bankStatement': 'Bank statement',
    'requirements.hotelBooking': 'Hotel booking',
    'requirements.flightBooking': 'Flight booking',
    'requirements.travelInsurance': 'Travel insurance',
    
    // Track
    'track.title': 'Track Your Application',
    'track.subtitle': 'Enter your application number to check status',
    'track.applicationNumber': 'Application Number',
    'track.phoneOrEmail': 'Phone or Email',
    'track.search': 'Search',
    
    // Status
    'status.draft': 'Draft',
    'status.pending_payment': 'Pending Payment',
    'status.submitted': 'Submitted',
    'status.under_review': 'Under Review',
    'status.documents_required': 'Documents Required',
    'status.processing': 'Processing',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.cancelled': 'Cancelled',
    
    // Payment
    'payment.title': 'Payment',
    'payment.summary': 'Order Summary',
    'payment.selectMethod': 'Select Payment Method',
    'payment.card': 'Credit Card',
    'payment.payNow': 'Pay Now',
    'payment.success': 'Payment Successful!',
    'payment.failed': 'Payment Failed',
    'payment.tryAgain': 'Try Again',
    'payment.applicationNumber': 'Your application number is',
    'payment.trackApplication': 'Track Application',
    'payment.downloadReceipt': 'Download Receipt',
    
    // Footer
    'footer.about': 'We specialize in visa services for countries worldwide. We provide professional and fast services.',
    'footer.quickLinks': 'Quick Links',
    'footer.policies': 'Policies',
    'footer.terms': 'Terms & Conditions',
    'footer.privacy': 'Privacy Policy',
    'footer.refund': 'Refund Policy',
    'footer.contact': 'Contact Us',
    'footer.workingHours': 'Working Hours',
    'footer.workingHoursValue': 'Sun - Thu: 9 AM - 6 PM',
    'footer.rights': 'All rights reserved',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.noResults': 'No results found',
    'common.sar': 'SAR',
    'common.usd': 'USD',
    'common.days': 'days',
    
    // Validation
    'validation.required': 'This field is required',
    'validation.email': 'Invalid email address',
    'validation.phone': 'Invalid phone number',
    'validation.minLength': 'Minimum characters is',
    'validation.maxLength': 'Maximum characters is',
    'validation.agreeTerms': 'You must agree to the terms and conditions',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Answers to common questions',
    'faq.viewAll': 'View All Questions',
    
    // About
    'about.title': 'About Us',
    'about.subtitle': 'Your trusted partner in visa services',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We are here to help',
    'contact.name': 'Name',
    'contact.message': 'Message',
    'contact.send': 'Send',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
