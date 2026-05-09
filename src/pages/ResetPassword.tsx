import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, Shield, Lock, KeyRound, XCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.jpeg';

// Password strength checker
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 6) score += 20;
  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  if (score < 30) return { score, label: 'ضعيفة', color: 'bg-destructive' };
  if (score < 50) return { score, label: 'متوسطة', color: 'bg-orange-500' };
  if (score < 75) return { score, label: 'جيدة', color: 'bg-yellow-500' };
  return { score, label: 'قوية', color: 'bg-green-500' };
};

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Password requirements component
function PasswordRequirements({ password, isRTL }: { password: string; isRTL: boolean }) {
  const requirements = useMemo(() => [
    { 
      met: password.length >= 6, 
      text: isRTL ? '6 أحرف على الأقل' : 'At least 6 characters' 
    },
    { 
      met: /[a-z]/.test(password), 
      text: isRTL ? 'حرف صغير واحد على الأقل' : 'At least one lowercase letter' 
    },
    { 
      met: /[A-Z]/.test(password), 
      text: isRTL ? 'حرف كبير واحد على الأقل' : 'At least one uppercase letter' 
    },
    { 
      met: /[0-9]/.test(password), 
      text: isRTL ? 'رقم واحد على الأقل' : 'At least one number' 
    },
  ], [password, isRTL]);

  if (!password) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2 mt-3 p-3 bg-muted/50 rounded-lg"
    >
      {requirements.map((req, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center gap-2 text-sm ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}
        >
          {req.met ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{req.text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  // Filter to remove Arabic characters from password fields
  const filterArabicChars = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = input.value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    if (filtered !== input.value) {
      input.value = filtered;
    }
  };

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this is a recovery session (user came from email link)
      if (session) {
        setIsValidSession(true);
      } else {
        // Listen for auth state change (user might be redirected with tokens in URL)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsValidSession(true);
          } else if (event === 'SIGNED_IN' && session) {
            setIsValidSession(true);
          }
        });

        // Give it a moment to process URL tokens
        setTimeout(() => {
          if (isValidSession === null) {
            setIsValidSession(false);
          }
        }, 2000);

        return () => subscription.unsubscribe();
      }
    };

    checkSession();
  }, []);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = form.watch('password');
  const watchedConfirmPassword = form.watch('confirmPassword');
  const passwordStrength = getPasswordStrength(watchedPassword);
  const passwordsMatch = watchedPassword && watchedConfirmPassword && watchedPassword === watchedConfirmPassword;

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    
    const { data: updated, error } = await supabase.auth.updateUser({
      password: data.password,
    });
    
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل تحديث كلمة المرور' : 'Failed to update password',
        description: error.message,
      });
      return;
    }

    // Security: if the recovered user is staff, force sign-out so they can't
    // bypass the secret staff portal + 2FA via the password-reset session.
    const recoveredUserId = updated?.user?.id;
    if (recoveredUserId) {
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', recoveredUserId)
        .in('role', ['admin', 'agent']);
      if (Array.isArray(roleRows) && roleRows.length > 0) {
        await supabase.auth.signOut();
        toast({
          title: isRTL ? 'تم تحديث كلمة المرور' : 'Password updated',
          description: isRTL
            ? 'لأسباب أمنية، يجب على فريق العمل تسجيل الدخول من بوابة الموظفين السرية وإكمال خطوة التحقق الثنائي.'
            : 'For security, staff must sign in via the secure staff portal and complete two-factor verification.',
        });
        setTimeout(() => navigate('/'), 1500);
        return;
      }
    }

      setIsSuccess(true);
      toast({
        title: isRTL ? 'تم تحديث كلمة المرور!' : 'Password updated!',
        description: isRTL 
          ? 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
          : 'Your password has been changed successfully. You can now sign in.',
      });
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Shield className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground font-medium">
              {isRTL ? 'جاري التحقق من الرابط...' : 'Verifying link...'}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show error if no valid session
  if (isValidSession === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-full max-w-md border-destructive/20">
            <CardHeader className="text-center pb-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
              </motion.div>
              <CardTitle className="text-xl">
                {isRTL ? 'رابط غير صالح أو منتهي' : 'Invalid or Expired Link'}
              </CardTitle>
              <CardDescription className="mt-2">
                {isRTL 
                  ? 'قد يكون الرابط قد انتهت صلاحيته أو تم استخدامه مسبقاً. يرجى طلب رابط جديد لإعادة تعيين كلمة المرور.'
                  : 'This link may have expired or already been used. Please request a new password reset link.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full h-12">
                <Link to="/auth?mode=forgot-password">
                  <KeyRound className="h-4 w-4 me-2" />
                  {isRTL ? 'طلب رابط جديد' : 'Request New Link'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">
                  {isRTL ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
                  {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <motion.div 
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isRTL ? 'العودة للرئيسية' : 'Back to home'}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-none sm:border sm:shadow-lg">
              <CardHeader className="space-y-1 px-0 sm:px-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
                    <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xl font-bold">عطلات رحلاتكم</span>
                </div>
                
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CardTitle className="text-2xl text-green-600">
                        {isRTL ? '🎉 تم بنجاح!' : '🎉 Success!'}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Your password has been changed successfully'}
                      </CardDescription>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Lock className="h-6 w-6 text-primary" />
                        {isRTL ? 'كلمة مرور جديدة' : 'New Password'}
                      </CardTitle>
                      <CardDescription>
                        {isRTL ? 'أنشئ كلمة مرور قوية وآمنة لحسابك' : 'Create a strong and secure password'}
                      </CardDescription>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardHeader>
              
              <CardContent className="px-0 sm:px-6">
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div 
                      key="success-content"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center space-y-6"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="flex justify-center"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                          </div>
                        </div>
                      </motion.div>
                      
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          {isRTL 
                            ? 'يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول إلى حسابك'
                            : 'You can now use your new password to sign in to your account'}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Button asChild className="w-full h-12" size="lg">
                          <Link to="/auth">
                            {isRTL ? 'تسجيل الدخول الآن' : 'Sign In Now'}
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/">
                            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form 
                      key="form-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={form.handleSubmit(handleSubmit)} 
                      className="space-y-5"
                    >
                      {/* New Password Field */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4" />
                          {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            dir="ltr"
                            lang="en"
                            autoComplete="new-password"
                            onInput={filterArabicChars}
                            style={{ textAlign: 'left' }}
                            className="h-12 pe-10"
                            {...form.register('password')}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Password Strength Indicator */}
                        {watchedPassword && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {isRTL ? 'قوة كلمة المرور:' : 'Password strength:'}
                              </span>
                              <span className={`font-medium ${
                                passwordStrength.score < 30 ? 'text-destructive' :
                                passwordStrength.score < 50 ? 'text-orange-500' :
                                passwordStrength.score < 75 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {isRTL ? passwordStrength.label : 
                                  passwordStrength.score < 30 ? 'Weak' :
                                  passwordStrength.score < 50 ? 'Fair' :
                                  passwordStrength.score < 75 ? 'Good' : 'Strong'
                                }
                              </span>
                            </div>
                            <Progress 
                              value={passwordStrength.score} 
                              className={`h-2 ${passwordStrength.color}`}
                            />
                          </motion.div>
                        )}
                        
                        {/* Password Requirements */}
                        <PasswordRequirements password={watchedPassword} isRTL={isRTL} />
                        
                        {form.formState.errors.password?.message && (
                          <p className="text-sm font-medium text-destructive">
                            {String(form.formState.errors.password.message)}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                        </Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            dir="ltr"
                            lang="en"
                            autoComplete="new-password"
                            onInput={filterArabicChars}
                            style={{ textAlign: 'left' }}
                            className={`h-12 pe-10 ${
                              watchedConfirmPassword && (passwordsMatch 
                                ? 'border-green-500 focus-visible:ring-green-500' 
                                : 'border-destructive focus-visible:ring-destructive')
                            }`}
                            {...form.register('confirmPassword')}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Match indicator */}
                        {watchedConfirmPassword && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`flex items-center gap-2 text-sm ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}
                          >
                            {passwordsMatch ? (
                              <>
                                <Check className="h-4 w-4" />
                                <span>{isRTL ? 'كلمات المرور متطابقة' : 'Passwords match'}</span>
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4" />
                                <span>{isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}</span>
                              </>
                            )}
                          </motion.div>
                        )}
                        
                        {form.formState.errors.confirmPassword?.message && (
                          <p className="text-sm font-medium text-destructive">
                            {String(form.formState.errors.confirmPassword.message)}
                          </p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12" 
                        size="lg"
                        disabled={isLoading || !passwordsMatch}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                            {isRTL ? 'جاري التحديث...' : 'Updating...'}
                          </>
                        ) : (
                          <>
                            <Shield className="me-2 h-4 w-4" />
                            {isRTL ? 'تحديث كلمة المرور' : 'Update Password'}
                          </>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Right side - Image/Branding (Desktop only) */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 gradient-hero">
          <div className="flex h-full flex-col items-center justify-center px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mx-auto">
                  <Shield className="h-12 w-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-white">
                {isRTL ? 'تأمين حسابك' : 'Securing Your Account'}
              </h2>
              <p className="mt-4 max-w-md text-lg text-white/90">
                {isRTL 
                  ? 'أنشئ كلمة مرور قوية وآمنة لحماية حسابك ومعلوماتك الشخصية.'
                  : 'Create a strong and secure password to protect your account and personal information.'
                }
              </p>
              
              <div className={`mt-12 space-y-4 text-white/80 text-start ${isRTL ? 'text-right' : 'text-left'}`}>
                <motion.div 
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>{isRTL ? 'استخدم 6 أحرف على الأقل' : 'Use at least 6 characters'}</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>{isRTL ? 'امزج بين الأحرف الكبيرة والصغيرة' : 'Mix uppercase and lowercase letters'}</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>{isRTL ? 'أضف أرقام ورموز خاصة' : 'Add numbers and special symbols'}</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
