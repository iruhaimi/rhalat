import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';
import { useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import IdleWarningDialog from '@/components/admin/security/IdleWarningDialog';
import NoIndex from '@/components/seo/NoIndex';

const agentNavItems = [
  { path: '/agent', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/agent/applications', label: 'طلباتي', icon: FileText },
];

export default function AgentLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const idle = useIdleTimeout();

  const handleSignOut = async () => {
    await signOut(true); // Pass true to indicate staff logout
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NoIndex />
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-semibold">لوحة الوكيل</span>
        <NotificationBell />
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 right-0 z-40 w-64 transform border-l bg-card transition-transform duration-200 lg:relative lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-center border-b">
            <Link to="/agent" className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">لوحة الوكيل</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {agentNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
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

          {/* User Section */}
          <div className="border-t p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">وكيل</p>
              </div>
              <div className="hidden lg:block">
                <NotificationBell />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
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
