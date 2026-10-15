import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, Loader2, Lock, Mail, AlertTriangle, Key } from 'lucide-react';
import { filterArabicChars } from '@/lib/inputFilters';
import { motion } from 'framer-motion';
import logoAsset from '@/assets/logo.png.asset.json';
import { assetUrl } from '@/lib/assetUrl';
const logo = assetUrl(logoAsset.url);
import AdvancedCaptcha from '@/components/auth/AdvancedCaptcha';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';
import RecoveryCodesDisplay from '@/components/auth/RecoveryCodesDisplay';
import NoIndex from '@/components/seo/NoIndex';
import RecoveryCodeVerification from '@/components/auth/RecoveryCodeVerification';
import UnlockRequestForm from '@/components/auth/UnlockRequestForm';
import { verifyRecoveryCode } from '@/lib/recoveryCodeUtils';


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

export default function SecureStaffAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Security states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(true); // Always show CAPTCHA for security
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<any>(null);
  const tempAuthClientRef = useRef<EphemeralAuthClient | null>(null);

  const resetTempAuthClient = () => {
    tempAuthClientRef.current = createEphemeralAuthClient();
    return tempAuthClientRef.current;
  };

  const getTempAuthClient = () => {
    if (!tempAuthClientRef.current) {
      tempAuthClientRef.current = createEphemeralAuthClient();
    }
    return tempAuthClientRef.current;
  };
  
  // Recovery codes states
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showRecoveryVerification, setShowRecoveryVerification] = useState(false);
  const [showUnlockRequest, setShowUnlockRequest] = useState(false);

  // Check lockout status on email change
  useEffect(() => {
    const checkLockout = async () => {
      if (!email) return;
      
      try {
        const { data, error } = await supabase.rpc('is_email_locked_out', {
          check_email: email.trim().toLowerCase()
        });
        
        if (!error && data) {
          setIsLockedOut(true);
          setLockoutTime(new Date(Date.now() + 15 * 60 * 1000));
        } else {
          setIsLockedOut(false);
          setLockoutTime(null);
        }

        // Check failed attempts for CAPTCHA
        const { data: countData } = await supabase.rpc('get_failed_attempts_count', {
          check_email: email.trim().toLowerCase()
        });
        
        if (countData && countData >= 3) {
          setShowCaptcha(true);
          setFailedAttempts(countData);
        }
      } catch (err) {
        console.error('Error checking lockout:', err);
      }
    };

    const debounce = setTimeout(checkLockout, 500);
    return () => clearTimeout(debounce);
  }, [email]);

  const logLoginAttempt = async (success: boolean, reason?: string) => {
    try {
      // Use SECURITY DEFINER RPC so the row is actually inserted
      // (RLS blocks direct inserts from anon/authenticated clients).
      await supabase.rpc('record_login_attempt', {
        p_email: email.trim().toLowerCase(),
        p_success: success,
        p_failure_reason: reason || null,
        p_user_agent: navigator.userAgent,
      });
    } catch (err) {
      console.error('Error logging attempt:', err);
    }
  };

  // Generate 2FA code via Edge Function (uses service_role for DB insert).
  // SECURITY: the plaintext code is NEVER returned to the client.
  const generate2FACode = async (userId: string, userEmail: string, accessToken?: string): Promise<{ emailSent: boolean }> => {
    try {
      // Explicitly attach the access token: in some race conditions immediately
      // after signInWithPassword, the global invoke client hasn't picked up the
      // session yet and would call the function without an Authorization header,
      // which the platform rejects with 401.
      const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error('No active session');
      }

      const { data, error: sendError } = await supabase.functions.invoke('send-staff-2fa', {
        body: { email: userEmail, userId, accessToken: token },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (sendError) {
        console.error('Failed to generate 2FA code:', sendError);
        throw new Error('Failed to create verification code');
      }
      
      if (data?.error && !data?.success) {
        console.error('2FA generation error:', data.error);
        throw new Error(data.error);
      }
      
      const emailSent = data?.emailSent === true;
      return { emailSent };
    } catch (err) {
      console.error('Error in generate2FACode:', err);
      throw err;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check lockout
    if (isLockedOut) {
      setError('الحساب مقفل مؤقتاً. يرجى المحاولة بعد 15 دقيقة.');
      return;
    }

    // Check CAPTCHA if required
    if (showCaptcha && !captchaVerified) {
      setError('يرجى حل اختبار التحقق الأمني أولاً');
      return;
    }

    setLoading(true);

    try {
      // Use an isolated auth client for the pre-2FA password check so staff
      // accounts never become a public-site session before the second factor passes.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      const authClient = resetTempAuthClient();
      const { data, error: signInError } = await authClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        await logLoginAttempt(false, signInError.message);
        
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setShowCaptcha(true);
          setCaptchaVerified(false);
        }
        
        if (newAttempts >= 5) {
          setIsLockedOut(true);
          setLockoutTime(new Date(Date.now() + 15 * 60 * 1000));
          setError('تم قفل الحساب مؤقتاً بسبب كثرة المحاولات الفاشلة. يرجى المحاولة بعد 15 دقيقة.');
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError(`بيانات الدخول غير صحيحة (محاولة ${newAttempts}/5)`);
        } else {
          setError('حدث خطأ في تسجيل الدخول');
        }
        return;
      }

      if (data.user) {
        // Check if user has admin or agent role
        const { data: roles, error: rolesError } = await authClient
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        if (rolesError) {
          await logLoginAttempt(false, 'Failed to fetch roles');
          setError('حدث خطأ في التحقق من الصلاحيات');
          await supabase.auth.signOut();
          return;
        }

        const userRoles = roles?.map(r => r.role) || [];
        const isAdmin = userRoles.includes('admin');
        const isAgent = userRoles.includes('agent');
        const isTourOperator = userRoles.includes('tour_operator');

        if (!isAdmin && !isAgent && !isTourOperator) {
          await logLoginAttempt(false, 'Not staff user');
          setError('ليس لديك صلاحية الوصول لهذه اللوحة');
          await supabase.auth.signOut();
          return;
        }

        // Check if user has recovery codes (first time login check)
        const hasRecoveryCodes = await checkRecoveryCodes(data.user.id, authClient);

        // Initiate 2FA
        sessionStorage.setItem('staff_2fa_pending_user_id', data.user.id);
        sessionStorage.removeItem('staff_2fa_verified_user_id');
        setPendingUserId(data.user.id);
        setPendingSession({
          user: data.user,
          roles: userRoles,
          isAdmin,
          isAgent,
          isTourOperator,
          needsRecoveryCodes: !hasRecoveryCodes,
          accessToken: data.session?.access_token,
          refreshToken: data.session?.refresh_token,
        });

        // Generate and send 2FA code BEFORE signing out (edge function requires auth)
        try {
          const { emailSent } = await generate2FACode(
            data.user.id,
            data.user.email!,
            data.session?.access_token
          );

          if (emailSent) {
            toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
          } else {
            toast.warning('تعذر إرسال رمز التحقق عبر البريد. تواصل مع المسؤول.', {
              duration: 10000,
            });
          }
        } catch (sendError) {
          console.error('Failed to generate 2FA code:', sendError);
          await supabase.auth.signOut();
          setError('حدث خطأ في إنشاء رمز التحقق. يرجى المحاولة مرة أخرى.');
          return;
        }

        // Keep the verified password session only in the isolated client until 2FA passes.
        setShow2FA(true);
      }
    } catch (err) {
      console.error('Login error:', err);
      await logLoginAttempt(false, 'Unexpected error');
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    if (!pendingUserId || !pendingSession) return false;

    try {
      const authClient = getTempAuthClient();

      if (pendingSession.accessToken && pendingSession.refreshToken) {
        const { error: restoreError } = await authClient.auth.setSession({
          access_token: pendingSession.accessToken,
          refresh_token: pendingSession.refreshToken,
        });

        if (restoreError) {
          console.error('Failed to restore isolated staff session before 2FA:', restoreError);
          const { data: freshLogin, error: signInError } = await authClient.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (signInError || !freshLogin.session) {
            console.error('Failed to re-authenticate isolated staff session before 2FA:', signInError);
            throw new Error('تم التحقق من كلمة المرور، لكن تعذر إكمال الجلسة. يرجى تسجيل الدخول وطلب رمز جديد.');
          }

          pendingSession.accessToken = freshLogin.session.access_token;
          pendingSession.refreshToken = freshLogin.session.refresh_token;
        }
      }

      // Verify code with the isolated authenticated session, then activate the real app session only after success.
      const { data: ok, error: rpcError } = await authClient.rpc('verify_staff_2fa', {
        p_user_id: pendingUserId,
        p_code: code,
      });

      if (rpcError || !ok) {
        console.error('2FA RPC rejected code:', rpcError);
        return false;
      }

      const { error: activateError } = await supabase.auth.setSession({
        access_token: pendingSession.accessToken,
        refresh_token: pendingSession.refreshToken,
      });

      if (activateError) {
        console.error('Failed to activate staff session after 2FA:', activateError);
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          console.error('Failed to re-authenticate real staff session after 2FA:', signInError);
          throw new Error('تم قبول الرمز، لكن تعذر فتح جلسة الدخول. يرجى المحاولة مرة أخرى.');
        }
      }

      await logLoginAttempt(true);
      sessionStorage.setItem('staff_2fa_verified_user_id', pendingUserId);
      sessionStorage.removeItem('staff_2fa_pending_user_id');

      if (pendingSession.needsRecoveryCodes) {
        const codes = await generateAndSaveRecoveryCodes(pendingUserId);
        if (codes.length > 0) {
          setGeneratedCodes(codes);
          setShowRecoveryCodes(true);
          setShow2FA(false);
          return true;
        }
        // Codes already exist for this account — continue normal login.
      }

      toast.success('تم تسجيل الدخول بنجاح');
      
      if (pendingSession.isAdmin) {
        navigate('/admin');
      } else if (pendingSession.isTourOperator && !pendingSession.isAgent) {
        navigate('/tourism-portal');
      } else {
        navigate('/agent');
      }

      return true;
    } catch (err) {
      console.error('2FA verification error:', err);
      throw err instanceof Error ? err : new Error('حدث خطأ في التحقق');
    }
  };

  const resend2FA = async () => {
    if (!pendingUserId) return;

    const authClient = getTempAuthClient();
    let { data: { session } } = await authClient.auth.getSession();

    if (!session) {
      const { data, error } = await authClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session || !data.user) {
        setError('تعذر إعادة إنشاء جلسة آمنة. يرجى تسجيل الدخول من جديد.');
        return;
      }
      session = data.session;
      setPendingSession((current: any) => current ? {
        ...current,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      } : current);
    }

    const { emailSent } = await generate2FACode(pendingUserId, email.trim(), session.access_token);
    if (emailSent) {
      toast.success('تم إعادة إرسال رمز التحقق');
    } else {
      toast.warning('تعذر إرسال رمز التحقق عبر البريد. تواصل مع المسؤول.');
    }
  };

  const cancel2FA = () => {
    sessionStorage.removeItem('staff_2fa_pending_user_id');
    sessionStorage.removeItem('staff_2fa_verified_user_id');
    setShow2FA(false);
    setPendingUserId(null);
    setPendingSession(null);
    tempAuthClientRef.current = null;
  };

  // Generate and save recovery codes via secure Edge Function (service-role insert).
  // Direct client inserts are blocked by RLS to prevent privilege escalation.
  const generateAndSaveRecoveryCodes = async (_userId: string): Promise<string[]> => {
    const { data, error } = await supabase.functions.invoke('generate-staff-recovery-codes', {
      body: {},
    });
    if (error) {
      const status = (error as any)?.context?.status;
      if (status === 409) return []; // already issued earlier
      console.error('Failed to generate recovery codes:', error);
      throw new Error('Failed to generate recovery codes');
    }
    if (data?.error) {
      throw new Error(data.error);
    }
    return (data?.codes as string[]) ?? [];
  };

  // Check if user has recovery codes
  const checkRecoveryCodes = async (userId: string, client: any = supabase): Promise<boolean> => {
    const { data } = await client
      .from('staff_recovery_codes_status')
      .select('id')
      .eq('user_id', userId)
      .eq('used', false)
      .limit(1);
    
    return !!data && data.length > 0;
  };

  // Verify recovery code
  const verifyRecoveryCodeHandler = async (code: string): Promise<boolean> => {
    if (!pendingUserId || !pendingSession) return false;

    try {
      const authClient = getTempAuthClient();
      if (pendingSession.accessToken && pendingSession.refreshToken) {
        await authClient.auth.setSession({
          access_token: pendingSession.accessToken,
          refresh_token: pendingSession.refreshToken,
        });
      }

      // Server-side atomic verification (rate-limited + audited)
      const { data: ok, error: rpcError } = await authClient.rpc('verify_staff_recovery_code', {
        p_user_id: pendingUserId,
        p_code: code,
      });

      if (rpcError) {
        console.error('Recovery RPC error:', rpcError);
        if ((rpcError as any).message?.includes('rate_limited')) {
          toast.error('عدد محاولات كبير. حاول لاحقاً.');
        }
        return false;
      }
      if (!ok) return false;

      const { error: activateError } = await supabase.auth.setSession({
            access_token: pendingSession.accessToken,
            refresh_token: pendingSession.refreshToken,
          });

          if (activateError) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });

            if (signInError) return false;
          }

          await logLoginAttempt(true);
          sessionStorage.setItem('staff_2fa_verified_user_id', pendingUserId);
          sessionStorage.removeItem('staff_2fa_pending_user_id');
          toast.success('تم تسجيل الدخول بنجاح');

          if (pendingSession.isAdmin) {
            navigate('/admin');
          } else if (pendingSession.isTourOperator && !pendingSession.isAgent) {
            navigate('/tourism-portal');
          } else {
            navigate('/agent');
          }

          return true;
    } catch (err) {
      console.error('Recovery code verification error:', err);
      return false;
    }
  };

  // Handle unlock request
  const handleUnlockRequest = () => {
    setShowRecoveryVerification(false);
    setShowUnlockRequest(true);
  };

  const cancelRecoveryVerification = () => {
    setShowRecoveryVerification(false);
    setShow2FA(true);
  };

  const cancelUnlockRequest = () => {
    setShowUnlockRequest(false);
    setShow2FA(true);
  };

  const handleUnlockSuccess = () => {
    setShowUnlockRequest(false);
    setShow2FA(false);
    setPendingUserId(null);
    setPendingSession(null);
  };

  const handleRecoveryCodesComplete = async () => {
    setShowRecoveryCodes(false);
    toast.success('تم تسجيل الدخول بنجاح');
    if (pendingSession?.isAdmin) {
      navigate('/admin');
    } else if (pendingSession?.isTourOperator && !pendingSession?.isAgent) {
      navigate('/tourism-portal');
    } else {
      navigate('/agent');
    }
  };

  // Soft light background with subtle grid + blue glows
  const BackgroundPattern = () => (
    <>
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23bfdbfe' stroke-width='1'%3E%3Cpath d='M0 .5H40M.5 0V40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
    </>
  );

  const pageWrapper =
    'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 p-4 relative overflow-hidden';

  // Show recovery codes display
  if (showRecoveryCodes && generatedCodes.length > 0) {
    return (
      <div className={pageWrapper}>
        <BackgroundPattern />
        <div className="w-full max-w-lg relative z-10">
          <RecoveryCodesDisplay
            codes={generatedCodes}
            onComplete={handleRecoveryCodesComplete}
          />
        </div>
      </div>
    );
  }

  // Show recovery code verification
  if (showRecoveryVerification && pendingUserId) {
    return (
      <div className={pageWrapper}>
        <BackgroundPattern />
        <div className="w-full max-w-md relative z-10">
          <RecoveryCodeVerification
            email={email}
            onVerify={verifyRecoveryCodeHandler}
            onCancel={cancelRecoveryVerification}
            onRequestUnlock={handleUnlockRequest}
          />
        </div>
      </div>
    );
  }

  // Show unlock request form
  if (showUnlockRequest && pendingUserId) {
    return (
      <div className={pageWrapper}>
        <BackgroundPattern />
        <div className="w-full max-w-md relative z-10">
          <UnlockRequestForm
            email={email}
            userId={pendingUserId}
            onSuccess={handleUnlockSuccess}
            onCancel={cancelUnlockRequest}
          />
        </div>
      </div>
    );
  }

  // Show 2FA verification screen
  if (show2FA) {
    return (
      <div className={pageWrapper}>
        <BackgroundPattern />
        <div className="w-full max-w-md relative z-10">
          <TwoFactorVerification
            email={email}
            onVerify={verify2FA}
            onResend={resend2FA}
            onCancel={cancel2FA}
          />
          {/* Recovery code option */}
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => {
                setShow2FA(false);
                setShowRecoveryVerification(true);
              }}
            >
              <Key className="h-4 w-4 ml-2" />
              استخدام رمز الاسترداد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrapper}>
      <NoIndex />
      <BackgroundPattern />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
      <Card className="border border-blue-100 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(59,130,246,0.25)] rounded-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/30 blur-2xl rounded-full" />
              <img
                src={logo}
                alt="عطلات رحلاتكم"
                className="h-20 w-20 rounded-full object-cover relative z-10 ring-4 ring-white shadow-lg"
              />
            </div>
          </div>

          {/* Security badge */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">دخول آمن مُشفّر</span>
            </motion.div>
          </div>

          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              بوابة الموظفين
            </CardTitle>
            <CardDescription className="text-slate-500 mt-2">
              تسجيل الدخول للمشرفين والوكلاء فقط
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5" dir="rtl">
            {/* Lockout Warning */}
            {isLockedOut && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  الحساب مقفل مؤقتاً. يرجى المحاولة بعد 15 دقيقة.
                </span>
              </div>
            )}

            {error && !isLockedOut && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(filterArabicChars(e.target.value))}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = filterArabicChars(input.value);
                  }}
                  placeholder="admin@example.com"
                  className="pr-10 h-12 rounded-xl bg-white/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 transition"
                  dir="ltr"
                  required
                  disabled={loading || isLockedOut}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(filterArabicChars(e.target.value))}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = filterArabicChars(input.value);
                  }}
                  placeholder="••••••••"
                  className="pr-10 pl-10 h-12 rounded-xl bg-white/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 transition"
                  dir="ltr"
                  required
                  disabled={loading || isLockedOut}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            {showCaptcha && (
              <AdvancedCaptcha onVerified={setCaptchaVerified} />
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all"
              disabled={loading || isLockedOut || (showCaptcha && !captchaVerified)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a
                href="/auth?reset=true"
                className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
              >
                نسيت كلمة المرور؟
              </a>
            </div>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              🔒 هذه البوابة مخصصة للموظفين المعتمدين فقط. جميع محاولات الدخول مسجلة ومراقبة.
            </p>
          </div>

          {/* Back to main site link */}
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              العودة للموقع الرئيسي ←
            </a>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
