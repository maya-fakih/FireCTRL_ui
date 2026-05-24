// src/components/ProjectSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import {
  Flame, ArrowLeft, LayoutDashboard, Camera, Bell,
  Sliders, Droplets, ChartLine, Activity, List,
  Brain, ChartBar, Settings, Cpu, Wifi, LogOut,
} from 'lucide-react';

const SECTIONS = [
  {
    label: 'Monitor',
    items: [
      { href: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
      { href: 'camera',        label: 'Camera feed',    icon: Camera },
      { href: 'notifications', label: 'Notifications',  icon: Bell },
    ],
  },
  {
    label: 'Control',
    items: [
      { href: 'controls',    label: 'Mode & controls', icon: Sliders },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: 'predictions',   label: 'Predictions',    icon: ChartLine },
      { href: 'sensors',       label: 'Sensor history', icon: Activity },
      { href: 'events',        label: 'Event log',      icon: List },
    ],
  },
  {
    label: 'AI',
    items: [
      { href: 'training',      label: 'Training',       icon: Brain },
      { href: 'model-stats',   label: 'Model stats',    icon: ChartBar },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: 'config',       label: 'Configuration',  icon: Settings },
      { href: 'connection',   label: 'Connection',     icon: Wifi },
    ],
  },
];

interface ProjectSidebarProps {
  projectId: string;
  projectName: string;
  isOnline: boolean;
}

export default function ProjectSidebar({ projectId, projectName, isOnline }: ProjectSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const basePath = `/project/${projectId}`;

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
        {/* Back */}
        <Link
          href="/projects"
          className="flex items-center gap-2 px-5 pt-5 pb-2 text-[11px] transition-colors"
          style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          <ArrowLeft size={12} />
          Back to projects
        </Link>

        {/* Project header */}
        <div
          className="px-5 pb-4 mb-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="text-[14px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {projectName}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: isOnline ? 'var(--success-text)' : 'var(--text-muted)' }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Nav sections */}
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
                const fullHref = `${basePath}/${href}`;
                const active = pathname === fullHref;
                return (
                  <Link
                    key={href}
                    href={fullHref}
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
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] w-full transition-all duration-150 cursor-pointer"
          style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
