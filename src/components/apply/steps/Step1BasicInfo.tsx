import { useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { User, Mail, Phone, ArrowLeft, ArrowRight, CheckCircle, Loader2, LogIn, UserPlus, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Separator } from '@/components/ui/separator';

// Helper function to filter Arabic characters
const filterArabicChars = (value: string): string => {
  return value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
};

// Helper function to filter non-numeric characters (allow only digits)
const filterNonNumeric = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

// Extract phone number without country code
const extractPhoneNumber = (phone: string | null): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/^\+?\d{1,3}[\s-]?/, '').replace(/\D/g, '');
  return cleaned.slice(0, 9);
};

// Google Sign In Button Component
function GoogleSignInButton() {
  const { direction } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isRTL = direction === 'rtl';

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: isRTL ? 'فشل تسجيل الدخول' : 'Login Failed',
          description: result.error.message,
        });
        setIsLoading(false);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full h-12 gap-2"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {isRTL ? 'تسجيل الدخول بحساب جوجل' : 'Sign in with Google'}
    </Button>
  );
}

// Sign In Form Component
function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { direction } = useLanguage();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRTL = direction === 'rtl';

  const schema = z.object({
    email: z.string().email(isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email'),
    password: z.string().min(6, isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'),
  });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('email', filtered);
    }
  }, [setValue]);

  const handlePasswordInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('password', filtered);
    }
  }, [setValue]);

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل تسجيل الدخول' : 'Login Failed',
        description: error.message === 'Invalid login credentials'
          ? (isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password')
          : error.message,
      });
    } else {
      toast({
        title: isRTL ? 'مرحباً بعودتك!' : 'Welcome back!',
        description: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully',
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {isRTL ? 'البريد الإلكتروني' : 'Email'}
        </Label>
        <Input
          type="email"
          placeholder="example@email.com"
          dir="ltr"
          inputMode="email"
          onInput={handleEmailInput}
          style={{ textAlign: 'left' }}
          className="h-12"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            dir="ltr"
            onInput={handlePasswordInput}
            style={{ textAlign: 'left' }}
            className="h-12 pe-10"
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        {isRTL ? 'تسجيل الدخول' : 'Sign In'}
      </Button>

      {/* Forgot Password Link */}
      <div className="text-center">
        <button 
          type="button"
          onClick={() => {
            toast({
              title: isRTL ? 'إعادة تعيين كلمة المرور' : 'Password Reset',
              description: isRTL 
                ? 'سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني المسجل' 
                : 'A password reset link will be sent to your registered email',
            });
            // Navigate after showing toast
            setTimeout(() => {
              window.location.href = '/auth?mode=forgot-password';
            }, 1500);
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <KeyRound className="w-3 h-3" />
          {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          {isRTL ? 'أو' : 'OR'}
        </span>
      </div>

      {/* Google Sign In Button */}
      <GoogleSignInButton />
    </form>
  );
}

// Sign Up Form Component
function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { direction } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRTL = direction === 'rtl';

  const schema = z.object({
    fullName: z.string().min(2, isRTL ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Name must be at least 2 characters'),
    email: z.string().email(isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email'),
    password: z.string().min(6, isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'),
  });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('email', filtered);
    }
  }, [setValue]);

  const handlePasswordInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('password', filtered);
    }
  }, [setValue]);

  const onSubmit = async (data: { fullName: string; email: string; password: string }) => {
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: data.fullName },
      },
    });
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = isRTL ? 'هذا البريد الإلكتروني مسجل مسبقاً' : 'This email is already registered';
      }
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل إنشاء الحساب' : 'Registration Failed',
        description: message,
      });
    } else {
      toast({
        title: isRTL ? 'تم إنشاء الحساب!' : 'Account Created!',
        description: isRTL ? 'مرحباً بك في عطلات رحلاتكم!' : 'Welcome to Otolat Rahlatcom!',
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {isRTL ? 'الاسم الكامل' : 'Full Name'}
        </Label>
        <Input
          placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
          className="h-12"
          {...register('fullName')}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {isRTL ? 'البريد الإلكتروني' : 'Email'}
        </Label>
        <Input
          type="email"
          placeholder="example@email.com"
          dir="ltr"
          inputMode="email"
          onInput={handleEmailInput}
          style={{ textAlign: 'left' }}
          className="h-12"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            dir="ltr"
            onInput={handlePasswordInput}
            style={{ textAlign: 'left' }}
            className="h-12 pe-10"
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isRTL ? 'إنشاء حساب' : 'Create Account'}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          {isRTL ? 'أو' : 'OR'}
        </span>
      </div>

      {/* Google Sign In Button */}
      <GoogleSignInButton />
    </form>
  );
}

// Logged In User Form
function LoggedInUserForm() {
  const { t, direction } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep } = useApplication();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [hasPreFilled, setHasPreFilled] = useState(false);
  const [autoAdvanceTriggered, setAutoAdvanceTriggered] = useState(false);

  const schema = z.object({
    fullName: z.string().min(3, t('validation.required')),
    email: z.string().email(t('validation.email')),
    phone: z.string().min(9, t('validation.phone')).max(9, direction === 'rtl' ? 'رقم الجوال يجب أن يكون 9 أرقام' : 'Phone must be 9 digits'),
    countryCode: z.string(),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: applicationData.fullName,
      email: applicationData.email,
      phone: applicationData.phone,
      countryCode: applicationData.countryCode || '+966',
    },
  });

  const watchedValues = watch();

  // Pre-fill and check for auto-advance
  useEffect(() => {
    if (!hasPreFilled && !authLoading && user && profile) {
      const profilePhone = extractPhoneNumber(profile.phone);
      
      const preFilledName = applicationData.fullName || profile.full_name || '';
      const preFilledEmail = applicationData.email || user.email || '';
      const preFilledPhone = applicationData.phone || profilePhone || '';
      
      if (!applicationData.fullName && profile.full_name) {
        setValue('fullName', profile.full_name);
      }
      if (!applicationData.email && user.email) {
        setValue('email', user.email);
      }
      if (!applicationData.phone && profilePhone) {
        setValue('phone', profilePhone);
      }
      
      setHasPreFilled(true);
      
      // Check if all data is complete for auto-advance
      const isComplete = !!(
        preFilledName && 
        preFilledEmail.includes('@') && 
        preFilledPhone.length === 9
      );
      
      if (isComplete && !autoAdvanceTriggered) {
        setAutoAdvanceTriggered(true);
        // Update application data first
        updateApplicationData({
          fullName: preFilledName,
          email: preFilledEmail,
          phone: preFilledPhone,
          countryCode: applicationData.countryCode || '+966',
        });
        // Auto-advance after a brief delay
        setTimeout(() => {
          goToNextStep();
        }, 300);
      }
    }
  }, [hasPreFilled, authLoading, user, profile, applicationData, setValue, goToNextStep, updateApplicationData, autoAdvanceTriggered]);

  useEffect(() => {
    if (hasPreFilled) {
      updateApplicationData({
        fullName: watchedValues.fullName,
        email: watchedValues.email,
        phone: watchedValues.phone,
        countryCode: watchedValues.countryCode,
      });
    }
  }, [watchedValues.fullName, watchedValues.email, watchedValues.phone, watchedValues.countryCode, updateApplicationData, hasPreFilled]);

  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('email', filtered);
    }
  }, [setValue]);

  const handlePhoneInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let filtered = filterNonNumeric(input.value);
    if (filtered.length > 9) {
      filtered = filtered.slice(0, 9);
    }
    if (filtered !== input.value) {
      input.value = filtered;
      setValue('phone', filtered);
    }
  }, [setValue]);

  const onSubmit = (data: FormData) => {
    updateApplicationData(data);
    goToNextStep();
  };

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const hasCompleteData = !!(watchedValues.fullName && watchedValues.email && watchedValues.phone?.length === 9);

  if (authLoading || autoAdvanceTriggered) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {direction === 'rtl' ? 'جاري تحميل بياناتك...' : 'Loading your data...'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Show logged-in status with pre-filled indicator */}
      {hasCompleteData && (
        <div className="p-4 bg-accent/50 rounded-lg border border-primary/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
          <div className="text-sm text-foreground">
            {direction === 'rtl' 
              ? 'تم تعبئة بياناتك تلقائياً من ملفك الشخصي. يمكنك تعديلها إذا لزم الأمر.' 
              : 'Your data has been auto-filled from your profile. You can modify it if needed.'}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('form.fullName')}
          </Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder={direction === 'rtl' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            className="h-12"
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {t('form.email')}
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            {...register('email')}
            onInput={handleEmailInput}
            placeholder="example@email.com"
            className="h-12 text-left"
            dir="ltr"
            style={{ textAlign: 'left' }}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {t('form.phone')}
          </Label>
          <div className="flex flex-row-reverse gap-2">
            <CountryCodePicker
              value={watchedValues.countryCode}
              onChange={(value) => setValue('countryCode', value)}
            />
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={9}
              {...register('phone')}
              onInput={handlePhoneInput}
              placeholder="5XXXXXXXX"
              className="flex-1 h-12 text-left"
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Country Selection Info */}
      {applicationData.countryName && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-sm text-muted-foreground">{t('form.country')}</div>
          <div className="font-semibold text-primary">{applicationData.countryName}</div>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full h-12 gap-2">
        {t('wizard.next')}
        <ArrowIcon className="w-4 h-4" />
      </Button>
    </form>
  );
}

// Main Step 1 Component
export default function Step1BasicInfo() {
  const { direction } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { goToNextStep } = useApplication();
  const [authCompleted, setAuthCompleted] = useState(false);

  const handleAuthSuccess = useCallback(() => {
    setAuthCompleted(true);
  }, []);

  // When auth is completed, the user state will update
  useEffect(() => {
    if (authCompleted && user) {
      // User just logged in, the LoggedInUserForm will handle pre-fill and auto-advance
      setAuthCompleted(false);
    }
  }, [authCompleted, user, goToNextStep]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // User is logged in - show the logged-in form
  if (user) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">
            {direction === 'rtl' ? 'البيانات الأساسية' : 'Basic Information'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {direction === 'rtl' 
              ? 'أدخل بياناتك الأساسية للتواصل معك' 
              : 'Enter your basic information to contact you'}
          </p>
        </div>
        <LoggedInUserForm />
      </div>
    );
  }

  // User is not logged in - show login/register tabs
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">
          {direction === 'rtl' ? 'تسجيل الدخول للمتابعة' : 'Sign in to Continue'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'سجل دخولك أو أنشئ حساباً جديداً لمتابعة طلب التأشيرة' 
            : 'Sign in or create an account to continue your visa application'}
        </p>
      </div>

      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="signin" className="gap-2">
            <LogIn className="w-4 h-4" />
            {direction === 'rtl' ? 'تسجيل الدخول' : 'Sign In'}
          </TabsTrigger>
          <TabsTrigger value="signup" className="gap-2">
            <UserPlus className="w-4 h-4" />
            {direction === 'rtl' ? 'حساب جديد' : 'Sign Up'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin">
          <SignInForm onSuccess={handleAuthSuccess} />
        </TabsContent>
        
        <TabsContent value="signup">
          <SignUpForm onSuccess={handleAuthSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
