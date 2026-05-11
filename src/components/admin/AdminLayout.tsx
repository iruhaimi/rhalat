import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import IdleWarningDialog from '@/components/admin/security/IdleWarningDialog';
import { useAdminUIPrefs } from '@/hooks/useAdminUIPrefs';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Gift,
  RotateCcw,
  Image,
   ShieldAlert,
   UserCheck,
   ArrowLeftRight,
   Crown,
   Shield,
   FileSearch,
   PanelBottom,
   ScrollText,
    KeyRound,
     Mail,
     ShieldCheck,
     SlidersHorizontal,
     Plane
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function AdminLayout() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { profile, isAdmin, isAgent, signOut } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const { prefs } = useAdminUIPrefs();
  const [sidebarOpen, setSidebarOpen] = useState(!prefs.sidebarCollapsedDefault);
  const idle = useIdleTimeout();

  const menuGroups: Array<{
    label: string;
    items: Array<{ title: string; icon: any; href: string; show: boolean }>;
  }> = [
    {
      label: 'الرئيسية',
      items: [
        {
          title: 'لوحة التحكم',
          icon: LayoutDashboard,
          href: isAdmin ? '/admin' : '/agent',
          show: true,
        },
        {
          title: 'الطلبات',
          icon: FileText,
          href: isAdmin ? '/admin/applications' : '/agent/applications',
          show: isAdmin ? hasPermission('manage_applications') : true,
        },
      ],
    },
    {
      label: 'العملاء والمحتوى',
      items: [
        {
          title: 'المستخدمين',
          icon: Users,
          href: '/admin/users',
          show: isAdmin && hasPermission('manage_users'),
        },
        {
          title: 'العروض الخاصة',
          icon: Gift,
          href: '/admin/offers',
          show: isAdmin && hasPermission('manage_offers'),
        },
        {
          title: 'طلبات الاسترداد',
          icon: RotateCcw,
          href: '/admin/refunds',
          show: isAdmin && hasPermission('process_refunds'),
        },
        {
          title: 'إدارة Hero',
          icon: Image,
          href: '/admin/hero',
          show: isAdmin && hasPermission('manage_hero'),
        },
        {
          title: 'برامج السياحة',
          icon: Plane,
          href: '/admin/tour-programs',
          show: isAdmin,
        },
      ],
    },
    {
      label: 'الموظفون والوكلاء',
      items: [
        {
          title: 'طلبات الوكلاء',
          icon: ArrowLeftRight,
          href: '/admin/agent-requests',
          show: isAdmin && hasPermission('manage_applications'),
        },
        {
          title: 'سجل محاولات الدخول',
          icon: ShieldAlert,
          href: '/admin/login-attempts',
          show: isAdmin && hasPermission('manage_staff'),
        },
        {
          title: 'طلبات فك القفل',
          icon: UserCheck,
          href: '/admin/unlock-requests',
          show: isAdmin && hasPermission('manage_unlock_requests'),
        },
      ],
    },
    {
      label: 'الأمان والتدقيق',
      items: [
        {
          title: 'العمليات الحساسة',
          icon: Shield,
          href: '/admin/sensitive-operations',
          show: isAdmin && isSuperAdmin,
        },
        {
          title: 'سجلات وصول المستندات',
          icon: FileSearch,
          href: '/admin/document-logs',
          show: isAdmin && isSuperAdmin,
        },
        {
          title: 'سجل التدقيق',
          icon: ScrollText,
          href: '/admin/audit-log',
          show: isAdmin && isSuperAdmin,
        },
        {
          title: 'أمان البوابة',
          icon: KeyRound,
          href: '/admin/portal-security',
          show: isAdmin && isSuperAdmin,
        },
        {
          title: 'حالة الأمان وRLS',
          icon: ShieldCheck,
          href: '/admin/security-status',
          show: isAdmin && isSuperAdmin,
        },
      ],
    },
    {
      label: 'الاتصالات',
      items: [
        {
          title: 'سجل الإيميلات',
          icon: Mail,
          href: '/admin/email-logs',
          show: isAdmin,
        },
      ],
    },
    {
      label: 'الإعدادات',
      items: [
        {
          title: 'إعدادات سريعة',
          icon: SlidersHorizontal,
          href: '/admin/quick-settings',
          show: isAdmin,
        },
        {
          title: 'إدارة الـ Footer',
          icon: PanelBottom,
          href: '/admin/footer',
          show: isAdmin && isSuperAdmin,
        },
        {
          title: 'إعدادات المالك',
          icon: Crown,
          href: '/admin/owner-settings',
          show: isAdmin && isSuperAdmin,
        },
        {
          title: 'الإعدادات',
          icon: Settings,
          href: '/admin/settings',
          show: isAdmin && (hasPermission('manage_settings') || hasPermission('manage_countries')),
        },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut(true); // Pass true to redirect to staff portal
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("flex min-h-screen bg-muted/30", isRTL && "flex-row-reverse")}>
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 z-40 h-screen bg-card border-e transition-all duration-300",
            isRTL ? "right-0" : "left-0",
            sidebarOpen ? "w-64" : "w-16"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {sidebarOpen && (
            <Link to="/" className="text-xl font-bold text-primary">
              عطلات رحلاتكم
            </Link>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? "left" : "right"}>
                {sidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-3 pb-24 overflow-y-auto h-[calc(100vh-8rem)]">
            {menuGroups.map((group, gi) => {
              const visible = group.items.filter(i => i.show);
              if (visible.length === 0) return null;
              return (
                <div key={group.label} className={cn(gi > 0 && "mt-3")}>
                  {sidebarOpen ? (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                      {group.label}
                    </p>
                  ) : (
                    gi > 0 && <div className="mx-2 my-2 border-t border-border/60" />
                  )}
                  <div className="flex flex-col gap-1">
                    {visible.map((item) => {
                      const isActive = location.pathname === item.href;
                      const linkContent = (
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {sidebarOpen && <span className="truncate">{item.title}</span>}
                        </Link>
                      );
                      if (!sidebarOpen) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side={isRTL ? "left" : "right"}>
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return <div key={item.href}>{linkContent}</div>;
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            {sidebarOpen && (
              <div className="mb-3 text-sm">
                <p className="font-medium flex items-center gap-2">
                  {profile?.full_name || 'المستخدم'}
                  {isSuperAdmin && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      مدير عام
                    </Badge>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isAdmin ? 'مشرف' : 'وكيل'}
                </p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start gap-3", !sidebarOpen && "justify-center")}
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  {sidebarOpen && <span>تسجيل الخروج</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side={isRTL ? "left" : "right"}>
                  تسجيل الخروج
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            isRTL 
              ? (sidebarOpen ? "mr-64" : "mr-16")
              : (sidebarOpen ? "ml-64" : "ml-16")
          )}
        >
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            <h1 className="text-lg font-semibold">
              {isAdmin ? 'لوحة تحكم المشرف' : 'لوحة تحكم الوكيل'}
            </h1>
          </header>

          {/* Page Content */}
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <IdleWarningDialog
        open={idle.showWarning}
        onExtend={idle.extendSession}
        onLogout={() => idle.performLogout('تم تسجيل الخروج.')}
      />
    </TooltipProvider>
  );
}
