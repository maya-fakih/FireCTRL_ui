'use client';

/**
 * PlatformSection — the technical beat. Shows the three layers stacked
 * vertically with a "running on a Pi" anchor on the side. This is the
 * left-brain breather between the cinematic story and the modes cards.
 */

import { motion } from 'framer-motion';
import { Cpu, Database, Layout, Lock, Wifi, GitBranch } from 'lucide-react';

const LAYERS = [
  {
    n: '01',
    title: 'Embedded',
    sub:   'On the Pi',
    body:  'Vision, thermal, and acoustic models run on-device. Inference under 80ms. No round-trip to the cloud, no dependency on connectivity.',
    icon:  Cpu,
    chips: ['MQTT', 'GPIO', 'CSI camera', 'I²C bus'],
  },
  {
    n: '02',
    title: 'Backend',
    sub:   'Local-only API',
    body:  'A FastAPI service binds the embedded layer to your data. Database connections are configured at setup, so logs, runs, and model weights live entirely on your hardware.',
    icon:  Database,
    chips: ['FastAPI', 'Postgres', 'Local FS', 'Auth tunnel'],
  },
  {
    n: '03',
    title: 'Frontend',
    sub:   'Your command center',
    body:  'A polished web UI for monitoring, dispatch, training runs, and data review — reachable only through a tunneled link that you own.',
    icon:  Layout,
    chips: ['Next.js', 'Supabase', 'Tunneled', 'Real-time'],
  },
];

export default function PlatformSection() {
  return (
    <section id="platform" className="stage py-28 lg:py-36 px-5 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-16"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>
              03 · How it&apos;s built
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]" style={{ letterSpacing: '-0.035em' }}>
            Three layers,
            <br />
            <span className="font-display" style={{ color: 'var(--accent)' }}>one box.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            The hobbyist can flash an SD card and be live in fifteen minutes.
            The serious operator can hook into our training pipeline and
            evaluate models against their own footage. Same box.
          </p>
        </motion.div>

        {/* Layers grid + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Layer cards */}
          <div className="space-y-4">
            {LAYERS.map((l, i) => (
              <motion.div
                key={l.n}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="card p-6 lg:p-8 group hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-start gap-6">
                  {/* Big number + icon */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <span className="font-display text-4xl" style={{ color: 'var(--accent)' }}>{l.n}</span>
                    <span
                      className="w-12 h-12 rounded-xl inline-flex items-center justify-center"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      <l.icon size={20} />
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4 flex-wrap">
                      <h3 className="text-2xl sm:text-3xl tracking-tight" style={{ letterSpacing: '-0.025em' }}>
                        {l.title}
                      </h3>
                      <span className="font-mono-tag" style={{ color: 'var(--text-muted)' }}>{l.sub}</span>
                    </div>
                    <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                      {l.body}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {l.chips.map(c => (
                        <span
                          key={c}
                          className="font-mono-tag px-2.5 py-1 rounded-md"
                          style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* The Pi sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="card p-6 lg:p-8 lg:sticky lg:top-28 h-fit"
          >
            <div className="font-mono-tag mb-4" style={{ color: 'var(--text-muted)' }}>
              The host
            </div>

            {/* stylized Pi illustration */}
            <div className="relative aspect-[5/4] mb-6 rounded-lg overflow-hidden" style={{ background: '#0a0807' }}>
              <svg viewBox="0 0 240 200" className="w-full h-full">
                <rect x="20"  y="30"  width="200" height="140" rx="6" fill="#0f5a2c" />
                <rect x="20"  y="30"  width="200" height="140" rx="6" fill="none" stroke="#1c8047" />
                {/* CPU */}
                <rect x="50"  y="60"  width="40"  height="40" rx="2" fill="#1a1a1a" />
                <text x="70" y="85" textAnchor="middle" fill="#A59E97" fontFamily="JetBrains Mono" fontSize="8">CPU</text>
                {/* GPIO pins */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <rect key={i} x={108 + i * 5} y="36" width="3" height="8" fill="#d4a657" />
                ))}
                {/* USB */}
                <rect x="200" y="60"  width="16" height="22" fill="#0a0807" />
                <rect x="200" y="92"  width="16" height="22" fill="#0a0807" />
                {/* Ethernet */}
                <rect x="200" y="125" width="16" height="22" fill="#0a0807" />
                {/* FIRECTRL hat */}
                <rect x="60"  y="118" width="120" height="38" rx="3" fill="#272220" stroke="#E05A2B" strokeWidth="1.2" />
                <text x="120" y="142" textAnchor="middle" fill="#E05A2B" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="2">FIRECTRL · v0.1</text>
                <circle cx="75" cy="135" r="2" fill="#E05A2B">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            <div className="text-base font-medium mb-1">Raspberry Pi 5</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              ARM Cortex-A76 · 8GB RAM · 4 TOPS NPU optional
            </div>

            {/* mini feature list */}
            <ul className="mt-5 space-y-2.5">
              {[
                [Lock,      'Data never leaves your hardware'],
                [Wifi,      'Tunneled remote access, no port forwarding'],
                [GitBranch, 'Training & eval pipeline included'],
              ].map(([Icon, txt], i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Icon size={14} style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5" />
                  <span>{txt as string}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
