import { useEffect, type ReactNode } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import DynamicPortalRoute from "@/components/DynamicPortalRoute";
import GTagMonitor from "@/components/analytics/GTagMonitor";
import NotFound from "@/pages/NotFound";
import { enforceNativeUrlSafety } from "@/lib/nativeSafety";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import {
  CAMPAIGN_TAG_MANAGER_SCRIPT,
  CLICKJACKING_SCRIPT,
  CONSENT_DEFAULTS_SCRIPT,
  GOOGLE_ADS_SCRIPT,
  ORGANIZATION_JSON_LD,
} from "@/lib/headScripts";
import appCss from "../styles.css?url";

const SITE_TITLE = "عطلات رحلاتكم — تجهيز ومراجعة ملفات طلبات التأشيرة";
const SITE_DESCRIPTION = "وكالة سفر خاصة تقدم خدمات تجهيز ومراجعة ملفات طلبات التأشيرة والمساعدة في المواعيد وخدمات السفر. لسنا جهة حكومية ولا نصدر التأشيرات.";
const SOCIAL_DESCRIPTION = "وكالة سفر خاصة: تجهيز ومراجعة ملفات طلبات التأشيرة والمساعدة في المواعيد وخدمات السفر. لا نصدر التأشيرات.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" },
      { httpEquiv: "Content-Security-Policy", content: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://accounts.google.com https://apis.google.com https://cdn.onesignal.com https://onesignal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://images.unsplash.com https://pagead2.googlesyndication.com https://visafaster.com https://www.visafaster.com https://hgxvwziiumjxifpgpjce.supabase.co https://flagcdn.com https://*.googleusercontent.com https://www.google-analytics.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net; connect-src 'self' https://pagead2.googlesyndication.com https://hgxvwziiumjxifpgpjce.supabase.co wss://hgxvwziiumjxifpgpjce.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://accounts.google.com https://onesignal.com https://api.onesignal.com https://api.ipify.org; frame-src https://accounts.google.com https://appleid.apple.com https://td.doubleclick.net; form-action 'self' https://appleid.apple.com; object-src 'none'; base-uri 'none'; manifest-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "author", content: "عطلات رحلاتكم" },
      { name: "google-site-verification", content: "_VrNO8ya-g2i4T7L3X2a_oEFdbehc7ZQayUc9Kmj6KY" },
      { name: "theme-color", content: "#1a1a2e" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "عطلات رحلاتكم" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SOCIAL_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "عطلات رحلاتكم" },
      { property: "og:locale", content: "ar_SA" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "عطلات رحلاتكم — خدمات التأشيرات" },
      { name: "twitter:description", content: SOCIAL_DESCRIPTION },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://hgxvwziiumjxifpgpjce.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://hgxvwziiumjxifpgpjce.supabase.co" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@300;400;500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" },
      { rel: "dns-prefetch", href: "https://flagcdn.com" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
    scripts: [
      { children: CLICKJACKING_SCRIPT },
      { children: CONSENT_DEFAULTS_SCRIPT },
      { children: CAMPAIGN_TAG_MANAGER_SCRIPT },
      { children: GOOGLE_ADS_SCRIPT },
      { type: "application/ld+json", children: ORGANIZATION_JSON_LD },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <DynamicPortalRoute fallback={<NotFound />} />,
  errorComponent: RootError,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // ported from main.tsx
  useEffect(() => {
    enforceNativeUrlSafety();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <GTagMonitor />
              <Outlet />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function RootError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">This page didn't load</h1>
        <p className="text-muted-foreground">تعذر تحميل الصفحة. حاول مرة أخرى.</p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => { router.invalidate(); reset(); }}
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2">Go home</a>
        </div>
      </div>
    </div>
  );
}
