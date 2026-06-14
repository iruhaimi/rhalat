import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { Profile, UserRole, AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isCustomer: boolean;
  isTourOperator: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    options?: { emailRedirectTo?: string }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: (isStaff?: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Staff (admin/agent/tour_operator) must complete the 2FA step every browser
// session. The marker lives in sessionStorage and is cleared on tab close. If a
// staff JWT is restored from localStorage without that marker (e.g., attacker
// extracted the token, or the user just reopened the browser), force a sign-out
// so backend APIs cannot be called with a token that bypassed 2FA enforcement.
const STAFF_ROLES: AppRole[] = ['admin', 'agent', 'tour_operator'];
function enforceStaff2FAOnRestore(event: string, userId: string, nextRoles: AppRole[]) {
  // Only act on session restore / token refresh, not on a fresh password sign-in
  // (the SecureStaffAuth flow sets the marker right after the 2FA step).
  if (event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED') return;
  const isStaff = nextRoles.some((r) => STAFF_ROLES.includes(r));
  if (!isStaff) return;
  if (sessionStorage.getItem('staff_2fa_verified_user_id') === userId) return;
  console.warn('Staff session restored without 2FA marker — signing out');
  supabase.auth.signOut();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<AppRole[]> => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      const { data: profileData, error: profileError } = profileRes;
      const { data: rolesData, error: rolesError } = rolesRes;

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
      } else {
        setProfile(profileData as Profile);
      }

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setRoles([]);
        return [];
      }

      const nextRoles = (rolesData as UserRole[]).map(r => r.role);
      setRoles(nextRoles);
      return nextRoles;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
      setRoles([]);
      return [];
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer profile fetch to avoid deadlock
        if (currentSession?.user) {
          setIsLoading(true);
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then((nextRoles) => {
              enforceStaff2FAOnRestore(event, currentSession.user.id, nextRoles);
            }).finally(() => setIsLoading(false));
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
        }

        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem('staff_2fa_verified_user_id');
          sessionStorage.removeItem('staff_2fa_pending_user_id');
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then((nextRoles) => {
          enforceStaff2FAOnRestore('INITIAL_SESSION', existingSession.user.id, nextRoles);
        }).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    options?: { emailRedirectTo?: string }
  ) => {
    const redirectUrl = options?.emailRedirectTo ?? `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async (isStaff: boolean = false) => {
    sessionStorage.removeItem('staff_2fa_verified_user_id');
    sessionStorage.removeItem('staff_2fa_pending_user_id');
    await supabase.auth.signOut();
    if (isStaff) {
      // Do NOT embed the staff portal path in client code.
      // Staff are sent to the public home; they reach the portal via the
      // out-of-band secret URL they already know.
      window.location.href = '/';
    }
  };

  const isAdmin = roles.includes('admin');
  const isAgent = roles.includes('agent');
  const isCustomer = roles.includes('customer');
  const isTourOperator = roles.includes('tour_operator' as AppRole);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAdmin,
        isAgent,
        isCustomer,
        isTourOperator,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default state instead of throwing to prevent crashes during initial render
    return {
      user: null,
      session: null,
      profile: null,
      roles: [] as AppRole[],
      isLoading: true,
      isAdmin: false,
      isAgent: false,
      isCustomer: false,
      isTourOperator: false,
      signUp: async () => ({ error: new Error('Auth not initialized') }),
      signIn: async () => ({ error: new Error('Auth not initialized') }),
      signOut: async () => {},
      refreshProfile: async () => {},
    };
  }
  return context;
}
