import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'agent' | 'customer' | 'tour_operator')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isAgent, isCustomer, isTourOperator } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const requiresStaff2FA = allowedRoles.some(
    role => role === 'admin' || role === 'agent' || role === 'tour_operator'
  );
  if (requiresStaff2FA && sessionStorage.getItem('staff_2fa_verified_user_id') !== user.id) {
    return <Navigate to="/" replace />;
  }

  const hasAccess = allowedRoles.some(role => {
    if (role === 'admin') return isAdmin;
    if (role === 'agent') return isAgent;
    if (role === 'customer') return isCustomer;
    if (role === 'tour_operator') return isTourOperator;
    return false;
  });

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
