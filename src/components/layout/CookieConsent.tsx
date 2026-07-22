import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isIOSApp } from '@/lib/platform';

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';

function updateConsentMode(opts: { analytics: boolean; marketing: boolean }) {
  const w = window as any;
  if (typeof w.gtag !== 'function') return;
  w.gtag('consent', 'update', {
    ad_storage: opts.marketing ? 'granted' : 'denied',
    ad_user_data: opts.marketing ? 'granted' : 'denied',
    ad_personalization: opts.marketing ? 'granted' : 'denied',
    analytics_storage: opts.analytics ? 'granted' : 'denied',
  });
}

export default function CookieConsent() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
  });

  // Never show cookie consent inside the iOS app — Apple treats cookie
  // prompts as tracking (Guideline 5.1.2). gtag is already disabled on iOS,
  // so there is nothing to consent to.
  if (isIOSApp()) return null;

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const saved = JSON.parse(hasConsented);
        updateConsentMode({ analytics: !!saved.analytics, marketing: !!saved.marketing });
      } catch {}
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    updateConsentMode({ analytics: true, marketing: true });
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    const consent = {
      ...preferences,
      essential: true, // Always true
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    updateConsentMode({ analytics: preferences.analytics, marketing: preferences.marketing });
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const consent = {
      essential: true, // Essential cookies cannot be rejected
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    updateConsentMode({ analytics: false, marketing: false });
    setIsVisible(false);
  };

  const cookieTypes = [
    {
      id: 'essential',
      nameAr: 'ملفات تعريف الارتباط الأساسية',
      nameEn: 'Essential Cookies',
      descAr: 'ضرورية لعمل الموقع بشكل صحيح ولا يمكن تعطيلها',
      descEn: 'Required for the website to function properly and cannot be disabled',
      required: true,
    },
    {
      id: 'analytics',
      nameAr: 'ملفات تعريف الارتباط التحليلية',
      nameEn: 'Analytics Cookies',
      descAr: 'تساعدنا في فهم كيفية استخدامك للموقع لتحسين تجربتك',
      descEn: 'Help us understand how you use the website to improve your experience',
      required: false,
    },
    {
      id: 'marketing',
      nameAr: 'ملفات تعريف الارتباط التسويقية',
      nameEn: 'Marketing Cookies',
      descAr: 'تُستخدم لعرض إعلانات ملائمة لاهتماماتك',
      descEn: 'Used to display ads relevant to your interests',
      required: false,
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Main Banner */}
              <div className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  {/* Cookie Icon */}
                  <div className="hidden sm:flex w-12 h-12 bg-primary/10 rounded-full items-center justify-center flex-shrink-0">
                    <Cookie className="w-6 h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Cookie className="w-5 h-5 text-primary sm:hidden" />
                        {isRTL ? 'نحن نستخدم ملفات تعريف الارتباط' : 'We Use Cookies'}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isRTL
                          ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. بعضها ضروري لعمل الموقع، وبعضها يساعدنا في تحسين خدماتنا. يمكنك قبول جميع ملفات تعريف الارتباط أو تخصيص اختياراتك.'
                          : 'We use cookies to enhance your experience on our website. Some are essential for the website to function, while others help us improve our services. You can accept all cookies or customize your choices.'}
                      </p>
                      <Link
                        to="/privacy"
                        className="text-sm text-primary hover:underline inline-block mt-1"
                      >
                        {isRTL ? 'اقرأ سياسة الخصوصية' : 'Read Privacy Policy'}
                      </Link>
                    </div>

                    {/* Cookie Settings (Expandable) */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 pt-2 border-t">
                            {cookieTypes.map((cookie) => (
                              <div
                                key={cookie.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                              >
                                <div className="pt-0.5">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={preferences[cookie.id as keyof typeof preferences]}
                                      onChange={(e) =>
                                        !cookie.required &&
                                        setPreferences((prev) => ({
                                          ...prev,
                                          [cookie.id]: e.target.checked,
                                        }))
                                      }
                                      disabled={cookie.required}
                                      className="sr-only peer"
                                    />
                                    <div
                                      className={`w-9 h-5 rounded-full peer transition-colors ${
                                        preferences[cookie.id as keyof typeof preferences]
                                          ? 'bg-primary'
                                          : 'bg-muted-foreground/30'
                                      } ${cookie.required ? 'opacity-70' : ''}`}
                                    >
                                      <div
                                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                          preferences[cookie.id as keyof typeof preferences]
                                            ? isRTL
                                              ? '-translate-x-4'
                                              : 'translate-x-4'
                                            : isRTL
                                            ? '-translate-x-0.5'
                                            : 'translate-x-0.5'
                                        }`}
                                      />
                                    </div>
                                  </label>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {isRTL ? cookie.nameAr : cookie.nameEn}
                                    </span>
                                    {cookie.required && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                        {isRTL ? 'مطلوب' : 'Required'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {isRTL ? cookie.descAr : cookie.descEn}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleAcceptAll} className="gap-2">
                        <Check className="w-4 h-4" />
                        {isRTL ? 'قبول الكل' : 'Accept All'}
                      </Button>
                      {showSettings ? (
                        <Button onClick={handleAcceptSelected} variant="secondary" className="gap-2">
                          <Check className="w-4 h-4" />
                          {isRTL ? 'حفظ التفضيلات' : 'Save Preferences'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setShowSettings(true)}
                          variant="secondary"
                          className="gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          {isRTL ? 'تخصيص' : 'Customize'}
                        </Button>
                      )}
                      <Button onClick={handleRejectAll} variant="ghost" className="gap-2">
                        <X className="w-4 h-4" />
                        {isRTL ? 'رفض غير الأساسية' : 'Reject Non-Essential'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
