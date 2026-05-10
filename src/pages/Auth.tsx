import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plane, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_PROFILE_FIELDS = [
  'full_name', 'phone', 'date_of_birth', 'nationality',
  'passport_number', 'passport_expiry', 'address', 'city', 'country'
] as const;

const checkProfileCompleteness = async (userId: string): Promise<string[]> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return REQUIRED_PROFILE_FIELDS.slice();

  return REQUIRED_PROFILE_FIELDS.filter(field => {
    const value = profile[field as keyof typeof profile];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
};

const signInSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const signUpSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;


const createEphemeralAuthClient = () => {
  const memoryStore = new Map<string, string>();

  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: {
          getItem: (key: string) => memoryStore.get(key) ?? null,
          setItem: (key: string, value: string) => { memoryStore.set(key, value); },
          removeItem: (key: string) => { memoryStore.delete(key); },
        },
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
};

type EphemeralAuthClient = ReturnType<typeof createEphemeralAuthClient>;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(mode === 'forgot-password');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp } = useAuth();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  // Security: staff (admin/agent) MUST authenticate via the secret staff portal,
  // never via the public /auth page. If they try, we reject and force sign-out.
  const isStaffUser = async (userId: string, _client?: EphemeralAuthClient | typeof supabase): Promise<boolean> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'agent']);
    return Array.isArray(data) && data.length > 0;
  };

  const blockStaffOnPublicAuth = async (userId: string): Promise<boolean> => {
    if (!(await isStaffUser(userId))) return false;
    await supabase.auth.signOut();
    toast({
      variant: 'destructive',
      title: isRTL ? 'الدخول من هنا غير مسموح للموظفين' : 'Staff sign-in not allowed here',
      description: isRTL
        ? 'حسابات فريق العمل تُسجل الدخول فقط عبر بوابة الموظفين السرية. يرجى التواصل مع الإدارة للحصول على الرابط.'
        : 'Staff accounts may only sign in through the secure staff portal. Contact your administrator for the link.',
    });
    return true;
  };

  // Filter to remove Arabic characters from email and password fields
  const filterArabicChars = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    // Remove Arabic characters (Unicode range \u0600-\u06FF)
    const filtered = input.value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    if (filtered !== input.value) {
      input.value = filtered;
    }
  };

  useEffect(() => {
    if (user) {
      (async () => {
        const blocked = await blockStaffOnPublicAuth(user.id);
        if (!blocked) navigate('/profile');
      })();
    }
  }, [user, navigate]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    setIsSignUp(mode === 'signup');
    setIsForgotPassword(mode === 'forgot-password');
    setResetEmailSent(false);
  }, [searchParams]);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const authClient = createEphemeralAuthClient();
    const { data: loginData, error } = await authClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error || !loginData.user || !loginData.session) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
        description: error?.message === 'Invalid login credentials'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : error?.message || 'تعذر تسجيل الدخول',
      });
      return;
    }

    // Block staff before the session is ever activated in the public app client.
    if (await isStaffUser(loginData.user.id, authClient)) {
      await authClient.auth.signOut({ scope: 'local' });
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: isRTL ? 'الدخول من هنا غير مسموح للموظفين' : 'Staff sign-in not allowed here',
        description: isRTL
          ? 'حسابات فريق العمل تُسجل الدخول فقط عبر بوابة الموظفين السرية. يرجى التواصل مع الإدارة للحصول على الرابط.'
          : 'Staff accounts may only sign in through the secure staff portal. Contact your administrator for the link.',
      });
      return;
    }

    const { error: activateError } = await supabase.auth.setSession({
      access_token: loginData.session.access_token,
      refresh_token: loginData.session.refresh_token,
    });

    if (activateError) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
        description: activateError.message,
      });
      return;
    }

    toast({
      title: 'مرحباً بعودتك!',
      description: 'تم تسجيل الدخول بنجاح',
    });

    const missingFields = await checkProfileCompleteness(loginData.user.id);
    if (missingFields.length > 0) {
      setTimeout(() => {
        toast({
          title: isRTL ? 'أكمل ملفك الشخصي' : 'Complete Your Profile',
          description: isRTL 
            ? `لديك ${missingFields.length} حقول ناقصة. يرجى استكمال بياناتك لتسهيل عملية التقديم.`
            : `You have ${missingFields.length} incomplete fields. Please complete your profile.`,
        });
      }, 1000);
    }

    navigate('/profile');
    setIsLoading(false);
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.';
      }
      toast({
        variant: 'destructive',
        title: 'فشل إنشاء الحساب',
        description: message,
      });
    } else {
      toast({
        title: 'تم إنشاء الحساب!',
        description: 'مرحباً بك في عطلات رحلاتكم! يرجى استكمال بياناتك الشخصية.',
      });

      // Show profile completion reminder for new users
      setTimeout(() => {
        toast({
          title: isRTL ? 'أكمل ملفك الشخصي' : 'Complete Your Profile',
          description: isRTL 
            ? 'يرجى استكمال بياناتك الشخصية وبيانات جواز السفر لتسهيل عملية التقديم على التأشيرة.'
            : 'Please complete your personal and passport details to facilitate your visa application.',
        });
      }, 1500);

      navigate('/profile');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/profile',
      });
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: isRTL ? 'فشل تسجيل الدخول عبر جوجل' : 'Google sign-in failed',
          description: result.error.message,
        });
        setIsLoading(false);
      }
      // On success, browser is redirected by lovable.auth
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: e?.message ?? 'Unexpected error',
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: redirectUrl,
    });
    
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل إرسال الرابط' : 'Failed to send link',
        description: error.message,
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: isRTL ? 'تم إرسال الرابط!' : 'Link sent!',
        description: isRTL 
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
          : 'Password reset link has been sent to your email',
      });
    }
  };

  return (
    <div className={`flex min-h-screen ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isRTL ? 'العودة للرئيسية' : 'Back to home'}
            </Link>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Plane className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold">عطلات رحلاتكم</span>
              </div>
              <CardTitle className="text-2xl">
                {isForgotPassword
                  ? (isRTL ? 'استعادة كلمة المرور' : 'Reset Password')
                  : isSignUp 
                    ? (isRTL ? 'إنشاء حساب جديد' : 'Create an account')
                    : (isRTL ? 'مرحباً بعودتك' : 'Welcome back')
                }
              </CardTitle>
              <CardDescription>
                {isForgotPassword
                  ? (isRTL ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور' : 'Enter your email to receive a password reset link')
                  : isSignUp
                    ? (isRTL ? 'أدخل بياناتك لإنشاء حسابك' : 'Enter your details to create your account')
                    : (isRTL ? 'أدخل بياناتك للوصول إلى حسابك' : 'Enter your credentials to access your account')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {isForgotPassword ? (
                resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold">
                      {isRTL ? 'تم إرسال الرابط!' : 'Link Sent!'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isRTL 
                        ? 'تحقق من بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور'
                        : 'Check your email and follow the link to reset your password'}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetEmailSent(false);
                      }}
                    >
                      {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input 
                        type="email" 
                        placeholder="example@email.com" 
                        dir="ltr"
                        lang="en"
                        autoComplete="email"
                        inputMode="email"
                        onInput={filterArabicChars}
                        style={{ textAlign: 'left' }}
                        {...forgotPasswordForm.register('email')} 
                      />
                      {forgotPasswordForm.formState.errors.email?.message && (
                        <p className="text-sm font-medium text-destructive">
                          {String(forgotPasswordForm.formState.errors.email.message)}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      {isRTL ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(false)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                      </button>
                    </div>
                  </form>
                )
              ) : isSignUp ? (
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
                    <Input placeholder={isRTL ? 'محمد أحمد' : 'John Doe'} {...signUpForm.register('fullName')} />
                    {signUpForm.formState.errors.fullName?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.fullName.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input 
                      type="email" 
                      placeholder="example@email.com" 
                      dir="ltr"
                      lang="en"
                      autoComplete="email"
                      inputMode="email"
                      onInput={filterArabicChars}
                      style={{ textAlign: 'left' }}
                      {...signUpForm.register('email')} 
                    />
                    {signUpForm.formState.errors.email?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.email.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        dir="ltr"
                        lang="en"
                        autoComplete="new-password"
                        onInput={filterArabicChars}
                        style={{ textAlign: 'left' }}
                        className="pr-10"
                        {...signUpForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.password?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.password.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        dir="ltr"
                        lang="en"
                        autoComplete="new-password"
                        onInput={filterArabicChars}
                        style={{ textAlign: 'left' }}
                        className="pr-10"
                        {...signUpForm.register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.confirmPassword?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signUpForm.formState.errors.confirmPassword.message)}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {isRTL ? 'إنشاء الحساب' : 'Create Account'}
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">{isRTL ? 'أو' : 'OR'}</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-11 gap-2" disabled={isLoading} onClick={handleGoogleSignIn}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    {isRTL ? 'التسجيل عبر جوجل' : 'Sign up with Google'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input 
                      type="email" 
                      placeholder="example@email.com" 
                      dir="ltr"
                      lang="en"
                      autoComplete="email"
                      inputMode="email"
                      onInput={filterArabicChars}
                      style={{ textAlign: 'left' }}
                      {...signInForm.register('email')} 
                    />
                    {signInForm.formState.errors.email?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signInForm.formState.errors.email.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        dir="ltr"
                        lang="en"
                        autoComplete="current-password"
                        onInput={filterArabicChars}
                        style={{ textAlign: 'left' }}
                        className="pr-10"
                        {...signInForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signInForm.formState.errors.password?.message && (
                      <p className="text-sm font-medium text-destructive">
                        {String(signInForm.formState.errors.password.message)}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">{isRTL ? 'أو' : 'OR'}</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-11 gap-2" disabled={isLoading} onClick={handleGoogleSignIn}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    {isRTL ? 'الدخول عبر جوجل' : 'Sign in with Google'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  </div>
                </form>
              )}

              {!isForgotPassword && (
                <div className="mt-6 text-center text-sm">
                  {isSignUp ? (
                    <p className="text-muted-foreground">
                      {isRTL ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="font-medium text-primary hover:underline"
                      >
                        {isRTL ? 'تسجيل الدخول' : 'Sign in'}
                      </button>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      {isRTL ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="font-medium text-primary hover:underline"
                      >
                        {isRTL ? 'إنشاء حساب' : 'Sign up'}
                      </button>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 gradient-hero">
          <div className="flex h-full flex-col items-center justify-center px-12 text-center">
            <h2 className="text-4xl font-bold text-white">
              {isRTL ? 'رحلتك تبدأ من هنا' : 'Your Journey Starts Here'}
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/90">
              {isRTL 
                ? 'بسّط عملية تقديم طلب التأشيرة مع منصتنا الموثوقة. سريع، آمن، وخالي من المتاعب.'
                : 'Simplify your visa application process with our trusted platform. Fast, secure, and hassle-free.'
              }
            </p>
            <div className={`mt-12 grid grid-cols-3 gap-8 text-white/80 ${isRTL ? 'direction-rtl' : ''}`}>
              <div>
                <div className="text-3xl font-bold text-white">+50</div>
                <div className="text-sm">{isRTL ? 'دولة' : 'Countries'}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">+10K</div>
                <div className="text-sm">{isRTL ? 'عميل سعيد' : 'Happy Clients'}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-sm">{isRTL ? 'نسبة النجاح' : 'Success Rate'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}