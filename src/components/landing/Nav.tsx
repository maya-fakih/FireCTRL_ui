'use client';

/**
 * Landing-only navigation bar. Sticky, liquid-glass, with the FIRECTRL
 * brand mark on the left and the CTA on the right. Anchor links scroll
 * to in-page sections.
 */

import Link from 'next/link';
import { Flame, ArrowRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Anywhere',  href: '#anywhere'  },
  { label: 'The Story', href: '#story'     },
  { label: 'Modes',     href: '#modes'     },
  { label: 'Platform',  href: '#platform'  },
  { label: 'Contact',   href: '#contact'   },
];

export default function LandingNav() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScroll] = useState(false);

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'pt-3 px-3 sm:pt-4 sm:px-6' : 'pt-5 px-4 sm:pt-6 sm:px-8'
        }`}
      >
        <nav
          className={`liquid-glass mx-auto flex items-center justify-between rounded-2xl transition-all duration-500
                      ${scrolled ? 'max-w-5xl px-4 py-2' : 'max-w-6xl px-5 py-3'}`}
        >
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group animate-blur-fade-up"
            style={{ animationDelay: '0ms' }}
          >
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

          {/* Desktop links */}
          <ul className="hidden lg:flex items-center gap-7 text-[13px]">
            {NAV_LINKS.map((l, i) => (
              <li
                key={l.href}
                className="animate-blur-fade-up"
                style={{ animationDelay: `${100 + i * 60}ms` }}
              >
                <a
                  href={l.href}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium animate-blur-fade-up
                         hover:translate-x-[2px] transition-transform"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                animationDelay: '450ms',
                boxShadow: '0 0 24px var(--accent-glow)',
              }}
            >
              Enter Command Center
              <ArrowRight size={14} />
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setOpen(v => !v)}
              className="lg:hidden liquid-glass w-10 h-10 rounded-full inline-flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu size={16} className={`absolute transition-all duration-500 ${open ? 'opacity-0 rotate-180 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
              <X    size={16} className={`absolute transition-all duration-500 ${open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'}`} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-x-3 z-40 lg:hidden transition-all duration-500 ease-out top-[78px]
                    ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
      >
        <div className="liquid-glass-strong rounded-2xl p-3">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-lg text-sm hover:bg-white/5 transition-colors"
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            className="sm:hidden mt-2 flex items-center justify-center gap-1.5 w-full py-3 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Enter Command Center
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
