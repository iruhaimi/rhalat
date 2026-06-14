import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, LayoutDashboard, FileText, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import MobileNavDrawer from './MobileNavDrawer';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import logo from '@/assets/logo.png.asset.json';

export default function HeaderArabic() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, isAgent, signOut } = useAuth();
  const { language, setLanguage, t, direction } = useLanguage();
  const navigate = useNavigate();

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.destinations'), href: '/destinations' },
    { name: 'العروض', href: '/offers' },
    { name: 'البرامج السياحية', href: '/tourism' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: t('nav.track'), href: '/track' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isAgent) return '/agent';
    return '/my-applications';
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40" style={{ paddingTop: 'var(--safe-area-top, 0px)' }}>
        {/* Main Navigation */}
        <nav className="container-section flex h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={logo.url} 
              alt="عطلات رحلاتكم" 
              className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary group flex items-center gap-2"
              >
                {item.name}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 h-10 rounded-full border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {profile?.full_name || t('nav.profile')}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      {profile?.full_name && (
                        <p className="font-medium text-sm">{profile.full_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {(isAdmin || isAgent) && (
                        <p className="text-xs font-medium text-primary">
                          {isAdmin ? 'مشرف' : 'وكيل'}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Staff Menu Items (Admin/Agent) */}
                  {(isAdmin || isAgent) ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={getDashboardLink()} className="cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          <span className="mr-2">{t('nav.dashboard')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={isAdmin ? '/admin/applications' : '/agent/applications'} className="cursor-pointer">
                          <FileText className="h-4 w-4" />
                          <span className="mr-2">إدارة الطلبات</span>
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin/users" className="cursor-pointer">
                            <User className="h-4 w-4" />
                            <span className="mr-2">إدارة المستخدمين</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : (
                    /* Customer Menu Items */
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="h-4 w-4" />
                          <span className="mr-2">{t('nav.profile')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/my-applications" className="cursor-pointer">
                          <FileText className="h-4 w-4" />
                          <span className="mr-2">{t('nav.myApplications')}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span className="mr-2">{t('nav.signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild className="rounded-full">
                  <Link to="/auth">{t('nav.signIn')}</Link>
                </Button>
                <Button asChild className="rounded-full px-6 shadow-md hover:shadow-lg transition-shadow">
                  <Link to="/apply">{t('nav.startApplication')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden gap-2 items-center">
            {user && <NotificationBell />}
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="h-9 w-9 p-0">
              <Globe className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
