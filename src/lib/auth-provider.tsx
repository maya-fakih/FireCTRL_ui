// src/lib/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from './supabase';
import type { User } from '@supabase/supabase-js';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  signOut: async () => {},
});

const PUBLIC_ROUTES = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);

      if (u) {
        // Logged in — if on login page, go to projects
        if (pathname === '/login' || pathname === '/') {
          router.replace('/projects');
        }
      } else if (!PUBLIC_ROUTES.includes(pathname)) {
        // Not logged in — go to login
        router.replace('/login');
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null;
        setUser(u);

        if (event === 'SIGNED_IN' && u) {
          router.replace('/projects');
        }
        if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="pulse-soft" style={{ color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
