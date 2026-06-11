import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Shield, Loader2, LogIn, UserPlus, Eye, EyeOff, Mail, KeyRound, User } from 'lucide-react';

const filterArabicChars = (value: string): string =>
  value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');

function GoogleButton() {
  const { direction } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isRTL = direction === 'rtl';

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.href,
      });
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: isRTL ? 'فشل تسجيل الدخول' : 'Login Failed',
          description: result.error.message,
        });
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="lg" className="w-full h-12 gap-2" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {isRTL ? 'المتابعة عبر Google' : 'Continue with Google'}
    </Button>
  );
}

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
        emailRedirectTo: window.location.href,
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

        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
            {isRTL ? 'أو' : 'OR'}
          </span>
        </div>

        <GoogleButton />
      </DialogContent>
    </Dialog>
  );
}