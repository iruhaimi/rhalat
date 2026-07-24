import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getExternalAuthOrigin, isNativeMobileApp, isIOSApp, isAndroidApp } from '@/lib/platform';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import AppleSignInButton from '@/components/auth/AppleSignInButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Shield, Loader2, LogIn, UserPlus, Eye, EyeOff, Mail, KeyRound, User } from 'lucide-react';

const filterArabicChars = (value: string): string =>
  value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');

function SignInPanel({ defaultEmail }: { defaultEmail?: string }) {
  const { direction } = useLanguage();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const isRTL = direction === 'rtl';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    email: z.string().email(isRTL ? 'بريد إلكتروني غير صحيح' : 'Invalid email'),
    password: z.string().min(6, isRTL ? 'كلمة المرور 6 أحرف على الأقل' : 'Password too short'),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail || '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل تسجيل الدخول' : 'Login Failed',
        description: error.message,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gate-signin-email" className="flex items-center gap-2"><Mail className="w-4 h-4" />{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
        <Input
          id="gate-signin-email"
          type="email"
          {...register('email')}
          onInput={(e) => {
            const v = filterArabicChars(e.currentTarget.value);
            if (v !== e.currentTarget.value) { e.currentTarget.value = v; setValue('email', v); }
          }}
          dir="ltr"
          className="h-12 text-left"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="gate-signin-password" className="flex items-center gap-2"><KeyRound className="w-4 h-4" />{isRTL ? 'كلمة المرور' : 'Password'}</Label>
        <div className="relative">
          <Input id="gate-signin-password" type={showPassword ? 'text' : 'password'} {...register('password')} dir="ltr" className="h-12 text-left pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        {isRTL ? 'تسجيل الدخول' : 'Sign In'}
      </Button>
    </form>
  );
}

function SignUpPanel({ defaultEmail, defaultName }: { defaultEmail?: string; defaultName?: string }) {
  const { direction } = useLanguage();
  const { toast } = useToast();
  const isRTL = direction === 'rtl';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    fullName: z.string().min(3, isRTL ? 'الاسم مطلوب' : 'Name required'),
    email: z.string().email(isRTL ? 'بريد إلكتروني غير صحيح' : 'Invalid email'),
    password: z.string().min(8, isRTL ? 'كلمة المرور 8 أحرف على الأقل' : 'Min 8 chars'),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: defaultName || '', email: defaultEmail || '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${getExternalAuthOrigin()}${window.location.pathname}${window.location.search}`,
        data: { full_name: data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: isRTL ? 'فشل إنشاء الحساب' : 'Sign-up failed', description: error.message });
      return;
    }
    toast({
      title: isRTL ? 'تم إنشاء الحساب' : 'Account created',
      description: isRTL ? 'تحقق من بريدك لتأكيد الحساب ثم سجّل دخولك للمتابعة' : 'Check your email to confirm, then sign in to continue',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gate-signup-name" className="flex items-center gap-2"><User className="w-4 h-4" />{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
        <Input id="gate-signup-name" {...register('fullName')} className="h-12" />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="gate-signup-email" className="flex items-center gap-2"><Mail className="w-4 h-4" />{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
        <Input
          id="gate-signup-email"
          type="email"
          {...register('email')}
          onInput={(e) => {
            const v = filterArabicChars(e.currentTarget.value);
            if (v !== e.currentTarget.value) { e.currentTarget.value = v; setValue('email', v); }
          }}
          dir="ltr"
          className="h-12 text-left"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="gate-signup-password" className="flex items-center gap-2"><KeyRound className="w-4 h-4" />{isRTL ? 'كلمة المرور' : 'Password'}</Label>
        <div className="relative">
          <Input id="gate-signup-password" type={showPassword ? 'text' : 'password'} {...register('password')} dir="ltr" className="h-12 text-left pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isRTL ? 'إنشاء حساب والمتابعة' : 'Create account & continue'}
      </Button>
    </form>
  );
}

export default function AuthGateModal() {
  const { direction } = useLanguage();
  const { showAuthGate, setShowAuthGate, applicationData } = useApplication();
  const isRTL = direction === 'rtl';

  return (
    <Dialog open={showAuthGate} onOpenChange={setShowAuthGate}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {isRTL ? 'لحماية بياناتك، أنشئ حساباً' : 'Protect your data — create an account'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isRTL
              ? 'قبل رفع جواز السفر والمستندات نحتاج للتحقق من هويتك. سنحفظ تقدمك تلقائياً.'
              : 'Before uploading your passport and documents, we need to verify your identity. Your progress is saved.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signup" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="w-4 h-4" />
              {isRTL ? 'حساب جديد' : 'Sign Up'}
            </TabsTrigger>
            <TabsTrigger value="signin" className="gap-2">
              <LogIn className="w-4 h-4" />
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <SignUpPanel defaultEmail={applicationData.email} defaultName={applicationData.fullName} />
          </TabsContent>
          <TabsContent value="signin">
            <SignInPanel defaultEmail={applicationData.email} />
          </TabsContent>
        </Tabs>

        {(!isNativeMobileApp() || isIOSApp() || isAndroidApp()) && (
          <>
            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                {isRTL ? 'أو' : 'OR'}
              </span>
            </div>

            <div className="space-y-3">
              {(!isNativeMobileApp() || isIOSApp()) && (
                <AppleSignInButton
                  className="w-full h-12 bg-black text-white hover:bg-black/90 border-black"
                  redirectPath={`${window.location.pathname}${window.location.search}`}
                />
              )}
              <GoogleSignInButton
                className="w-full h-12"
                redirectPath={`${window.location.pathname}${window.location.search}`}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}