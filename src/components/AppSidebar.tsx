// src/components/AppSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { Flame, Folder, Book, User, LogOut, Wrench } from 'lucide-react';

const NAV = [
  { href: '/projects', label: 'Projects', icon: Folder },
  { href: '/docs',     label: 'Docs',     icon: Book },
  { href: '/docs/assembly', label: 'Assembly', icon: Wrench },
  { href: '/account',  label: 'Account',  icon: User },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col justify-between z-50"
      style={{
        width: 220,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <Flame size={16} color="#fff" />
          </div>
          <div>
            <div
              className="text-[13px] font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              FIRE<span style={{ color: 'var(--accent)' }}>CTRL</span>
            </div>
            <div
              className="text-[9px] uppercase tracking-[0.1em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Command Center
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150"
                style={{
                  background: active ? 'var(--sidebar-active)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-5">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] w-full transition-all duration-150 cursor-pointer"
          style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}