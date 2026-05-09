import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, Loader2, Lock, Mail, AlertTriangle, Key } from 'lucide-react';
import { filterArabicChars } from '@/lib/inputFilters';
import logo from '@/assets/logo.jpeg';
import AdvancedCaptcha from '@/components/auth/AdvancedCaptcha';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';
import RecoveryCodesDisplay from '@/components/auth/RecoveryCodesDisplay';
import RecoveryCodeVerification from '@/components/auth/RecoveryCodeVerification';
import UnlockRequestForm from '@/components/auth/UnlockRequestForm';
import { verifyRecoveryCode } from '@/lib/recoveryCodeUtils';

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
        body: { email: userEmail, userId },
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
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
        const { data: roles, error: rolesError } = await supabase
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

        if (!isAdmin && !isAgent) {
          await logLoginAttempt(false, 'Not staff user');
          setError('ليس لديك صلاحية الوصول لهذه اللوحة');
          await supabase.auth.signOut();
          return;
        }

        // Check if user has recovery codes (first time login check)
        const hasRecoveryCodes = await checkRecoveryCodes(data.user.id);

        // Initiate 2FA
        setPendingUserId(data.user.id);
        setPendingSession({ user: data.user, roles: userRoles, isAdmin, isAgent, needsRecoveryCodes: !hasRecoveryCodes });

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

        // Sign out temporarily until 2FA is verified
        await supabase.auth.signOut();

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
      // Verify code via SECURITY DEFINER RPC (server-side hashing, anon-safe).
      // The RPC handles hash comparison and marks the code as used atomically.
      const { data: ok, error: rpcError } = await supabase.rpc('verify_staff_2fa', {
        p_user_id: pendingUserId,
        p_code: code,
      });

      if (rpcError || !ok) {
        return false;
      }

      // Re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        return false;
      }

      // Log successful attempt
      await logLoginAttempt(true);

      // Check if this is first login (needs recovery codes)
      if (pendingSession.needsRecoveryCodes) {
        const codes = await generateAndSaveRecoveryCodes(pendingUserId);
        setGeneratedCodes(codes);
        setShowRecoveryCodes(true);
        setShow2FA(false);
        return true;
      }

      toast.success('تم تسجيل الدخول بنجاح');
      
      if (pendingSession.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/agent');
      }

      return true;
    } catch (err) {
      console.error('2FA verification error:', err);
      return false;
    }
  };

  const resend2FA = async () => {
    if (!pendingUserId) return;
    
    // Sign in temporarily to get user email
    const { data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (data.user) {
      try {
        const { emailSent } = await generate2FACode(data.user.id, data.user.email!);
        if (emailSent) {
          toast.success('تم إعادة إرسال رمز التحقق');
        } else {
          toast.warning('تعذر إرسال رمز التحقق عبر البريد. تواصل مع المسؤول.');
        }
      } finally {
        await supabase.auth.signOut();
      }
    }
  };

  const cancel2FA = () => {
    setShow2FA(false);
    setPendingUserId(null);
    setPendingSession(null);
  };

  // Generate and save recovery codes via secure Edge Function (service-role insert).
  // Direct client inserts are blocked by RLS to prevent privilege escalation.
  const generateAndSaveRecoveryCodes = async (_userId: string): Promise<string[]> => {
    const { data, error } = await supabase.functions.invoke('generate-staff-recovery-codes', {
      body: {},
    });
    if (error) {
      console.error('Failed to generate recovery codes:', error);
      throw new Error('Failed to generate recovery codes');
    }
    if (data?.error) {
      throw new Error(data.error);
    }
    return (data?.codes as string[]) ?? [];
  };

  // Check if user has recovery codes
  const checkRecoveryCodes = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('staff_recovery_codes')
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
      // Get all unused codes for user
      const { data: codes } = await supabase
        .from('staff_recovery_codes')
        .select('*')
        .eq('user_id', pendingUserId)
        .eq('used', false);

      if (!codes || codes.length === 0) return false;

      // Check each code
      for (const codeRecord of codes) {
        const isValid = await verifyRecoveryCode(code, codeRecord.code_hash);
        if (isValid) {
          // Mark as used
          await supabase
            .from('staff_recovery_codes')
            .update({ used: true, used_at: new Date().toISOString() })
            .eq('id', codeRecord.id);

          // Clear failed login attempts
          await supabase.rpc('clear_failed_login_attempts', { target_email: email.trim().toLowerCase() });

          // Re-authenticate
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (signInError) return false;

          await logLoginAttempt(true);
          toast.success('تم تسجيل الدخول بنجاح');

          if (pendingSession.isAdmin) {
            navigate('/admin');
          } else {
            navigate('/agent');
          }

          return true;
        }
      }

      return false;
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
    } else {
      navigate('/agent');
    }
  };

  // Background pattern component
  const BackgroundPattern = () => (
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
    </div>
  );

  // Show recovery codes display
  if (showRecoveryCodes && generatedCodes.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
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
              className="text-slate-400 hover:text-white"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <BackgroundPattern />

      <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <img
                src={logo}
                alt="عطلات رحلاتكم"
                className="h-20 w-20 rounded-full object-cover relative z-10 border-2 border-slate-600"
              />
            </div>
          </div>
          
          {/* Shield icon */}
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl font-bold text-white">
              بوابة الموظفين
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              تسجيل الدخول للمشرفين والوكلاء فقط
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5" dir="rtl">
            {/* Lockout Warning */}
            {isLockedOut && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  الحساب مقفل مؤقتاً. يرجى المحاولة بعد 15 دقيقة.
                </span>
              </div>
            )}

            {error && !isLockedOut && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
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
                  className="pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                  dir="ltr"
                  required
                  disabled={loading || isLockedOut}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
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
                  className="pr-10 pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                  dir="ltr"
                  required
                  disabled={loading || isLockedOut}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-5"
              disabled={loading || isLockedOut || (showCaptcha && !captchaVerified)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a
                href="/auth?reset=true"
                className="text-sm text-slate-400 hover:text-primary transition-colors"
              >
                نسيت كلمة المرور؟
              </a>
            </div>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              🔒 هذه البوابة مخصصة للموظفين المعتمدين فقط. جميع محاولات الدخول مسجلة ومراقبة.
            </p>
          </div>

          {/* Back to main site link */}
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              العودة للموقع الرئيسي ←
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
