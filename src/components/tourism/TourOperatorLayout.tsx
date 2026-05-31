import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  Map,
  CalendarCheck,
  LogOut,
  Menu,
  X,
  Plane,
} from 'lucide-react';
import { useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import IdleWarningDialog from '@/components/admin/security/IdleWarningDialog';
import NoIndex from '@/components/seo/NoIndex';

const navItems = [
  { path: '/tourism-portal', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { path: '/tourism-portal/company', label: 'ملف الشركة', icon: Building2 },
  { path: '/tourism-portal/programs', label: 'برامجي السياحية', icon: Map },
  { path: '/tourism-portal/bookings', label: 'الحجوزات', icon: CalendarCheck },
];

export default function TourOperatorLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const idle = useIdleTimeout();

  const handleSignOut = async () => {
    await signOut(true);
  };

  const isActiveItem = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NoIndex />
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-semibold">بوابة الوكيل السياحي</span>
        <NotificationBell />
      </header>

      <div className="flex">
        <aside
          className={cn(
            'fixed inset-y-0 right-0 z-40 w-64 transform border-l bg-card transition-transform duration-200 lg:relative lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex h-16 items-center justify-center border-b">
            <Link to="/tourism-portal" className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">بوابة وكيل السياحة</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const active = isActiveItem(item.path, item.end);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium truncate max-w-[140px]">{user?.email}</p>
                <p className="text-xs text-muted-foreground">وكيل سياحي</p>
              </div>
              <div className="hidden lg:block">
                <NotificationBell />
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <IdleWarningDialog
        open={idle.showWarning}
        onExtend={idle.extendSession}
        onLogout={() => idle.performLogout('تم تسجيل الخروج.')}
      />
    </div>
  );
}