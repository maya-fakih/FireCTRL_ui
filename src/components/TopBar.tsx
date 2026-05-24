// src/components/TopBar.tsx
'use client';

import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // right-side actions
}

export default function TopBar({ title, subtitle, children }: TopBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1
          className="text-lg font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <button
          onClick={toggle}
          className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  );
}
