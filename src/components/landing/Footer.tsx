'use client';

/**
 * Footer — restrained, end-credits style. Big oversized "FIRECTRL" mark
 * for visual punctuation, then a quiet links + copyright row.
 */

import Link from 'next/link';
import { Flame} from 'lucide-react';

const GithubIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Anywhere',     href: '#anywhere' },
      { label: 'The story',    href: '#story' },
      { label: 'Modes',        href: '#modes' },
      { label: 'Platform',     href: '#platform' },
    ],
  },
  {
    title: 'For builders',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Training pipeline', href: '/docs' },
      { label: 'Model registry',    href: '/docs' },
      { label: 'API reference',     href: '/docs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact',  href: '#contact' },
      { label: 'Sign in',  href: '/login' },
      { label: 'Roadmap',  href: '#' },
      { label: 'License',  href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="stage relative pt-24 pb-12 px-5 sm:px-8 lg:px-16"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top: brand + columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(3,1fr)] gap-10 lg:gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <span
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center ember-glow"
                style={{ background: 'var(--accent)' }}
              >
                <Flame size={16} color="#fff" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                FIRE<span style={{ color: 'var(--accent)' }}>CTRL</span>
              </span>
            </Link>
            <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Edge-AI fire safety. Local-first. Built to bolt onto anything.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg inline-flex items-center justify-center transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <GithubIcon size={15} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.title}>
              <div className="font-mono-tag mb-4" style={{ color: 'var(--text-muted)' }}>
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm transition-colors hover:text-[var(--text-primary)]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The big mark — end-credits punctuation */}
        <div
          className="relative overflow-hidden"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div
            className="font-display select-none pointer-events-none leading-none whitespace-nowrap text-center"
            style={{
              fontSize: 'clamp(7rem, 22vw, 22rem)',
              letterSpacing: '-0.06em',
              background: 'linear-gradient(180deg, rgba(224,90,43,0.22) 0%, rgba(224,90,43,0.04) 65%, transparent 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              paddingTop: '0.1em',
              marginTop: '0.5rem',
            }}
            aria-hidden="true"
          >
            FIRECTRL
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 -mt-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} FIRECTRL · Built locally, deployed everywhere.
          </div>
          <div className="flex items-center gap-2 font-mono-tag" style={{ color: 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full ember-pulse" style={{ background: 'var(--success-text)' }} />
            All systems nominal
          </div>
        </div>
      </div>
    </footer>
  );
}
