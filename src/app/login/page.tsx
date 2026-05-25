// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Flame, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/projects` },
      });
      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="animate-in" style={{ width: 380 }}>
        {/* Logo */}
        <div className="text-center mb-9">
          <div
            className="w-14 h-14 rounded-xl inline-flex items-center justify-center mb-4"
            style={{ background: 'var(--accent)' }}
          >
            <Flame size={28} color="#fff" />
          </div>
          <div
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            FIRE<span style={{ color: 'var(--accent)' }}>CTRL</span>
          </div>
          <div
            className="text-[10px] uppercase tracking-[0.15em] mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Command Center
          </div>
        </div>

        {/* Card */}
        <div className="card p-7">
          {sent ? (
            <div className="text-center">
              <div
                className="p-4 rounded-lg mb-4"
                style={{ background: 'var(--success-soft)', color: 'var(--success-text)' }}
              >
                <Mail size={24} className="mx-auto mb-2" />
                <p className="text-sm font-medium">Check your email</p>
                <p className="text-xs mt-1 opacity-80">
                  We sent a login link to {email}
                </p>
              </div>
              <button
                onClick={() => setSent(false)}
                className="btn btn-ghost w-full text-xs"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* GitHub */}
              <button
                onClick={handleGitHub}
                disabled={loading}
                className="btn w-full text-sm py-3 mb-3"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span
                  className="text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* Email */}
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none mb-3"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleMagicLink}
                disabled={loading || !email}
                className="btn btn-primary w-full text-sm py-3"
                style={{ opacity: loading || !email ? 0.5 : 1 }}
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>

              {error && (
                <div
                  className="mt-4 p-3 rounded-lg text-xs"
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="text-center mt-5 text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          No password needed — we&apos;ll email you a login link.
        </div>
      </div>
    </div>
  );
}