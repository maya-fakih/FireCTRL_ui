// src/app/account/page.tsx
'use client';

import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/lib/auth-provider';
import { User, Mail, LogOut, Calendar } from 'lucide-react';

export default function AccountPage() {
  const { user, signOut } = useAuth();

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const provider = user?.app_metadata?.provider ?? 'email';

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-7" style={{ marginLeft: 220 }}>
        <TopBar title="Account" subtitle="Your profile and session" />

        <div className="max-w-xl">
          <div className="card p-7 animate-in">
            <div className="flex items-center gap-4 mb-7">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                <User size={26} color="#fff" />
              </div>
              <div>
                <div className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.email ?? 'Signed in'}
                </div>
                <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  Signed in with {provider}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</div>
                  <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-primary)' }}>{user?.email ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Member since</div>
                  <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-primary)' }}>{joined}</div>
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="btn w-full mt-6"
              style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
