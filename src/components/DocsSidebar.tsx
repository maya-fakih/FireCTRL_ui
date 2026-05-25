'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { Flame, ArrowLeft, BookOpen, Terminal, List, Wrench, Cpu, Sun, Moon } from 'lucide-react';

const SECTIONS = [
  {
    label: 'Getting started',
    items: [
      { href: '/docs',           label: 'Overview',       icon: BookOpen },
      { href: '/docs/guide',     label: 'Full guide',     icon: List },
      { href: '/docs/quick-ref', label: 'Quick reference', icon: Terminal },
    ],
  },
  {
    label: 'Hardware',
    items: [
      { href: '/docs/assembly', label: 'Arm assembly', icon: Wrench },
      { href: '/docs/wiring',   label: 'Wiring',       icon: Cpu },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col justify-between z-50 overflow-y-auto"
      style={{
        width: 220,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <Flame size={16} color="#fff" />
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              FIRE<span style={{ color: 'var(--accent)' }}>CTRL</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              Docs
            </div>
          </div>
        </div>

        {/* Back */}
        <Link
          href="/projects"
          className="flex items-center gap-2 px-5 py-2 mb-3 text-[11px] transition-colors"
          style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          <ArrowLeft size={12} /> Back to projects
        </Link>

        {/* Nav */}
        <nav className="px-3">
          {SECTIONS.map(section => (
            <div key={section.label} className="mb-4">
              <div
                className="text-[9px] uppercase tracking-[0.12em] px-3 mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {section.label}
              </div>
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 mb-0.5"
                    style={{
                      background: active ? 'var(--sidebar-active)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: active ? 500 : 400,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-5">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] w-full cursor-pointer"
          style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
