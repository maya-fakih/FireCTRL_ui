// src/lib/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isSupabaseConfigured, createClient } from './supabase';
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
    // If Supabase isn't configured, skip auth entirely — just show pages
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { user: u } } = await supabase.auth.getUser();
        setUser(u);

        if (u) {
          if (pathname === '/login' || pathname === '/') {
            router.replace('/projects');
          }
        } else if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace('/login');
        }

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (event === 'SIGNED_IN' && currentUser) router.replace('/projects');
          if (event === 'SIGNED_OUT') router.replace('/login');
        });
        subscription = data.subscription;
      } catch {
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => subscription?.unsubscribe();
  }, [pathname, router]);

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* silent */ }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {loading ? (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="pulse-soft" style={{ color: 'var(--text-muted)' }}>
            Loading...
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
