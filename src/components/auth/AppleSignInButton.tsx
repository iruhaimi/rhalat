import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { SignInWithApple, type SignInWithAppleOptions } from '@capacitor-community/apple-sign-in';
import { cn } from '@/lib/utils';
import { APP_PUBLIC_ORIGIN, getExternalAuthOrigin, isNativeMobileApp } from '@/lib/platform';
import { sanitizeRedirect, resolvePostAuthRedirect, stashPendingRedirect } from '@/lib/safeRedirect';

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

type AppleSignInButtonProps = Omit<ButtonProps, 'onClick' | 'type'> & {
  iconOnly?: boolean;
  label?: string;
  redirectPath?: string;
  onStart?: () => void;
};

export default function AppleSignInButton({
  className,
  disabled,
  iconOnly = false,
  label,
  redirectPath,
  onStart,
  variant = 'outline',
  ...props
}: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const buttonLabel = label ?? (isRTL ? 'الدخول عبر Apple' : 'Sign in with Apple');

  if (isNativeMobileApp() && Capacitor.getPlatform() !== 'ios') return null;

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    onStart?.();

    try {
      const resolved = sanitizeRedirect(
        redirectPath ?? resolvePostAuthRedirect() ?? undefined,
        '/profile'
      );
      stashPendingRedirect(resolved);

      // Native iOS: use the on-device Apple Sign-In sheet (required by App Store Guideline 4.8).
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        const options: SignInWithAppleOptions = {
          clientId: 'com.visafaster.app',
          redirectURI: `${APP_PUBLIC_ORIGIN}/auth`,
          scopes: 'email name',
          state: Math.random().toString(36).slice(2),
        };
        const res = await SignInWithApple.authorize(options);
        const idToken = res.response?.identityToken;
        if (!idToken) {
          throw new Error(isRTL ? 'لم يتم استلام رمز Apple' : 'No Apple identity token returned');
        }
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: idToken,
        });
        if (error) {
          toast({
            variant: 'destructive',
            title: isRTL ? 'فشل تسجيل الدخول عبر Apple' : 'Apple sign-in failed',
            description: error.message,
          });
          setIsLoading(false);
          return;
        }
        navigate(resolved);
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${getExternalAuthOrigin()}${resolved}`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: isRTL ? 'فشل تسجيل الدخول عبر Apple' : 'Apple sign-in failed',
          description: error.message,
        });
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      navigate(resolved);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : (isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'),
      });
      setIsLoading(false);
    }
  };

  const button = (
    <Button
      type="button"
      variant={variant}
      className={cn(iconOnly ? 'h-10 w-10 rounded-full p-0' : 'gap-2', className)}
      disabled={disabled || isLoading}
      onClick={handleAppleSignIn}
      aria-label={buttonLabel}
      title={buttonLabel}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon className="h-5 w-5" />}
      {!iconOnly && <span>{buttonLabel}</span>}
    </Button>
  );

  if (!iconOnly) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{buttonLabel}</TooltipContent>
    </Tooltip>
  );
}