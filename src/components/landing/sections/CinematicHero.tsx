'use client';

/**
 * CinematicHero — first impression. The robot floats in a dark void,
 * spotlit. Editorial title on the left, technical metadata bar at the
 * bottom. The whole thing is one viewport tall (no scroll yet).
 *
 * Style notes:
 *  - Title pairs Instrument Serif italic (poster-feel) with DM Sans tag
 *  - "ANYWHERE" word is deliberately oversized — a single visual anchor
 *  - The robot is positioned bottom-right, off-center, the way a
 *    cinematographer would compose it (rule of thirds)
 */

import dynamic from 'next/dynamic';
import { ArrowRight, Flame, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// Lazy-load 3D so it never blocks first paint
const SceneCanvas = dynamic(() => import('../three/SceneCanvas'), { ssr: false });
const RobotModel  = dynamic(() => import('../three/RobotModel'),  { ssr: false });

export default function CinematicHero() {
  return (
    <section className="stage relative min-h-screen w-full overflow-hidden">
      {/* Animated radial backdrop — warm ember at the center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 70% 60%, rgba(224,90,43,0.18) 0%, rgba(224,90,43,0.04) 30%, transparent 60%), #0B0907',
        }}
      />

      {/* Soft scan lines for filmic feel */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* The 3D robot — right half on desktop, full width below */}
      <div className="absolute inset-0 md:left-[35%] lg:left-[40%]">
        <SceneCanvas cameraPosition={[0, 0.4, 4.6]} cameraFov={36}>
          <RobotModel spin={0.16} y={-1.05} scale={0.95} />
        </SceneCanvas>
      </div>

      {/* Cinematic vignette + grain on top of 3D */}
      <div className="cinematic-vignette" />
      <div className="film-grain" />

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-end">
        <div className="px-5 sm:px-8 lg:px-16 pb-14 lg:pb-20 max-w-7xl mx-auto w-full">

          {/* Top tag — animates in first */}
          <div
            className="flex items-center gap-2 mb-5 animate-blur-fade-up"
            style={{ animationDelay: '200ms' }}
          >
            <span className="w-1.5 h-1.5 rounded-full ember-pulse" style={{ background: 'var(--accent)' }} />
            <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>
              FIRECTRL · v0.1 · Edge AI for Fire Safety
            </span>
          </div>

          {/* The hero title — editorial display */}
          <h1
            className="text-[44px] sm:text-6xl lg:text-7xl xl:text-[88px] leading-[0.95] tracking-tight max-w-3xl animate-blur-fade-up"
            style={{
              animationDelay: '350ms',
              letterSpacing: '-0.035em',
              color: 'var(--text-primary)',
            }}
          >
            Fire safety, <span className="font-display" style={{ color: 'var(--accent)' }}>anywhere</span>
            <br />
            it needs to be.
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 text-base sm:text-lg max-w-xl animate-blur-fade-up"
            style={{ animationDelay: '550ms', color: 'var(--text-secondary)' }}
          >
            One plug-and-play system. Three embedded layers. Four operating modes.
            Bolt it to a drone, a kitchen wall, a rover — your data stays local,
            your control stays yours.
          </p>

          {/* CTAs */}
          <div
            className="mt-9 flex flex-wrap items-center gap-3 animate-blur-fade-up"
            style={{ animationDelay: '750ms' }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium hover:translate-x-[2px] transition-transform"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              Enter Command Center
              <ArrowRight size={16} />
            </Link>

            <a
              href="#story"
              className="liquid-glass inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              <Flame size={15} />
              See it in action
            </a>
          </div>

          {/* Bottom metadata strip — gives the cinematic "credits" feel */}
          <div
            className="mt-14 lg:mt-20 flex flex-wrap items-center gap-x-8 gap-y-3 animate-blur-fade-up"
            style={{ animationDelay: '950ms' }}
          >
            {[
              ['03', 'Layers',     'Embedded · Backend · Frontend'],
              ['04', 'Modes',      'Autopilot · Copilot · Surveillance · Training'],
              ['01', 'Box',        'Plug-and-play on a Raspberry Pi'],
            ].map(([n, label, sub]) => (
              <div key={label} className="flex items-baseline gap-3">
                <span className="font-mono-tag" style={{ color: 'var(--accent)' }}>{n}</span>
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-blur-fade-up"
          style={{ animationDelay: '1300ms', color: 'var(--text-muted)' }}
        >
          <span className="font-mono-tag">Scroll</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </div>
    </section>
  );
}