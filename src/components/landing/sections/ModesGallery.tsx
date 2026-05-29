'use client';

/**
 * ModesGallery — four operation modes as overlapping tilted cards
 * (the "vinyl record" rack effect). On hover, the card straightens,
 * lifts, and dims its neighbors.
 *
 * The CSS heavy lifting is in globals.css under `.tilt-card`.
 * I drive the resting rotation from inline transforms so each card
 * gets a distinct angle.
 */

import { motion } from 'framer-motion';
import { Compass, Hand, Eye, Brain, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

interface Mode {
  n:        string;
  tag:      string;
  title:    string;
  body:     string;
  bullets:  string[];
  icon:     React.ComponentType<{ size?: number }>;
  tone:     string;        // accent color for this card
  pattern: React.ReactNode; // unique decorative SVG
}

const MODES: Mode[] = [
  {
    n:     '01',
    tag:   'AUTOPILOT',
    title: 'Hands off',
    body:  'Let the system decide. Continuous patrol routes, automatic suppression triggers, full incident logs. You watch, it works.',
    bullets: ['Closed-loop detection → response', 'Configurable safety envelopes', 'Audit log of every decision'],
    icon:  Compass,
    tone:  '#E05A2B',
    pattern: (
      <svg viewBox="0 0 400 500" className="w-full h-full">
        <defs>
          <radialGradient id="ap1" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#E05A2B" stopOpacity="0.5" />
            <stop offset="1" stopColor="#E05A2B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="500" fill="#1a0e0a" />
        <circle cx="200" cy="220" r="160" fill="url(#ap1)" />
        {/* radar sweeps */}
        {[60, 100, 140].map(r => (
          <circle key={r} cx="200" cy="220" r={r} fill="none" stroke="#E05A2B" strokeOpacity="0.3" strokeDasharray="2 6" />
        ))}
        {/* path */}
        <path
          d="M 80 380 Q 200 280 200 220 T 320 80"
          stroke="#E05A2B"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="3 4"
        />
        <circle cx="80"  cy="380" r="4" fill="#E05A2B" />
        <circle cx="320" cy="80"  r="4" fill="#E05A2B" />
      </svg>
    ),
  },
  {
    n:     '02',
    tag:   'COPILOT',
    title: 'You + the box',
    body:  'You stay in the loop. The system surfaces what matters, suggests responses, and waits for your confirm. Built for operators with judgment.',
    bullets: ['Human-in-the-loop confirmation', 'Suggested actions with confidence', 'One-tap override'],
    icon:  Hand,
    tone:  '#D4A65A',
    pattern: (
      <svg viewBox="0 0 400 500" className="w-full h-full">
        <rect width="400" height="500" fill="#1a140a" />
        {/* two hands meeting */}
        <g stroke="#D4A65A" strokeWidth="1.5" fill="none" opacity="0.6">
          <path d="M 60 250 Q 140 250 180 220" />
          <path d="M 60 280 Q 140 280 180 250" />
          <path d="M 340 250 Q 260 250 220 220" />
          <path d="M 340 280 Q 260 280 220 250" />
        </g>
        {/* central handshake node */}
        <circle cx="200" cy="240" r="30" fill="none" stroke="#D4A65A" />
        <circle cx="200" cy="240" r="6"  fill="#D4A65A" />
        {/* notification dots */}
        <circle cx="90"  cy="120" r="3" fill="#D4A65A">
          <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="310" cy="380" r="3" fill="#D4A65A">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite" />
        </circle>
        {/* axis labels */}
        <text x="40"  y="200" fill="#D4A65A" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="2">YOU</text>
        <text x="320" y="200" fill="#D4A65A" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="2">SYS</text>
      </svg>
    ),
  },
  {
    n:     '03',
    tag:   'SURVEILLANCE',
    title: 'Watch only',
    body:  'No automation, no suggestions. Just sensors streaming to your screen, with logs and rewind. Useful for documentation, audits, and quiet hours.',
    bullets: ['Multi-camera grid', 'Searchable event timeline', 'Cold storage to your DB'],
    icon:  Eye,
    tone:  '#6B7DB3',
    pattern: (
      <svg viewBox="0 0 400 500" className="w-full h-full">
        <rect width="400" height="500" fill="#0a0e1a" />
        {/* grid of camera feeds */}
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 3 }).map((_, c) => (
            <g key={`${r}-${c}`}>
              <rect
                x={40 + c * 110}
                y={60 + r * 100}
                width="100"
                height="80"
                fill="#0d1426"
                stroke="#6B7DB3"
                strokeOpacity="0.4"
              />
              <circle cx={50 + c * 110} cy={70 + r * 100} r="2" fill={(r + c) % 2 ? '#3A7D5C' : '#6B7DB3'}>
                {(r + c) % 3 === 0 && <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />}
              </circle>
              {/* fake "image" — gradient lines */}
              <line x1={50 + c * 110} y1={120 + r * 100} x2={130 + c * 110} y2={120 + r * 100} stroke="#6B7DB3" strokeOpacity="0.2" />
              <line x1={50 + c * 110} y1={130 + r * 100} x2={120 + c * 110} y2={130 + r * 100} stroke="#6B7DB3" strokeOpacity="0.15" />
            </g>
          ))
        )}
      </svg>
    ),
  },
  {
    n:     '04',
    tag:   'TRAINING',
    title: 'R&D mode',
    body:  'Turn FIRECTRL into a research bench. Capture annotated data, run experiments, evaluate model versions side-by-side, and ship the winner to production.',
    bullets: ['Annotation pipeline included', 'Versioned model registry', 'A/B evals on your footage'],
    icon:  Brain,
    tone:  '#3A7D5C',
    pattern: (
      <svg viewBox="0 0 400 500" className="w-full h-full">
        <rect width="400" height="500" fill="#0a1a14" />
        {/* loss curves */}
        <g fill="none" strokeWidth="2">
          <path d="M 40 380 Q 100 360 150 300 T 280 200 T 360 140" stroke="#3A7D5C" />
          <path d="M 40 400 Q 110 380 160 340 T 280 240 T 360 180" stroke="#3A7D5C" strokeOpacity="0.5" />
          <path d="M 40 420 Q 110 400 160 380 T 280 280 T 360 220" stroke="#3A7D5C" strokeOpacity="0.3" />
        </g>
        {/* axes */}
        <line x1="40" y1="60" x2="40"  y2="440" stroke="#3A7D5C" strokeOpacity="0.4" />
        <line x1="40" y1="440" x2="380" y2="440" stroke="#3A7D5C" strokeOpacity="0.4" />
        {/* annotations */}
        <text x="320" y="130" fill="#3A7D5C" fontFamily="JetBrains Mono" fontSize="10">v3</text>
        <text x="320" y="170" fill="#3A7D5C" fontFamily="JetBrains Mono" fontSize="10" opacity="0.5">v2</text>
        <text x="320" y="210" fill="#3A7D5C" fontFamily="JetBrains Mono" fontSize="10" opacity="0.3">v1</text>
        {/* sample points */}
        {[[90, 360], [150, 300], [220, 240], [290, 190]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#3A7D5C" />
        ))}
      </svg>
    ),
  },
];

export default function ModesGallery() {
  const [hovered, setHovered] = useState<number | null>(null);

  // Resting tilt angles — chosen for a record-rack feel
  const tilts = [-8, -3, 3, 8];

  return (
    <section id="modes" className="stage py-28 lg:py-40 px-5 sm:px-8 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9 }}
          className="max-w-3xl mb-16 lg:mb-24"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>
              04 · Operation modes
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]" style={{ letterSpacing: '-0.035em' }}>
            Four ways
            <br />
            to <span className="font-display" style={{ color: 'var(--accent)' }}>operate.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Hover a card to bring it forward. The same hardware can switch
            between modes in a single setting — even mid-shift.
          </p>
        </motion.div>

        {/* Gallery — 4 tilted cards */}
        <div
          className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4"
          onMouseLeave={() => setHovered(null)}
        >
          {MODES.map((m, i) => {
            const isOther = hovered !== null && hovered !== i;
            return (
              <motion.div
                key={m.n}
                initial={{ opacity: 0, y: 60, rotate: tilts[i] }}
                whileInView={{ opacity: 1, y: 0, rotate: tilts[i] }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHovered(i)}
                className="tilt-card relative rounded-2xl overflow-hidden cursor-default"
                style={{
                  aspectRatio: '0.78',
                  border: `1px solid ${m.tone}33`,
                  boxShadow: `0 12px 40px ${m.tone}22, 0 2px 8px rgba(0,0,0,0.4)`,
                  filter: isOther ? 'brightness(0.55) saturate(0.7)' : undefined,
                  zIndex: 10 - Math.abs(i - 1.5),
                }}
              >
                {/* decorative pattern background */}
                <div className="absolute inset-0">{m.pattern}</div>

                {/* top-bottom gradient for legibility */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.9) 100%)',
                  }}
                />

                {/* glass corner badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className="font-mono-tag" style={{ color: m.tone }}>{m.n} · {m.tag}</span>
                  <span
                    className="w-8 h-8 rounded-full inline-flex items-center justify-center liquid-glass"
                    style={{ color: m.tone }}
                  >
                    <m.icon size={14} />
                  </span>
                </div>

                {/* main content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <h3 className="text-2xl sm:text-3xl tracking-tight font-medium mb-2" style={{ letterSpacing: '-0.025em' }}>
                    {m.title}
                  </h3>
                  <p className="text-xs sm:text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {m.body}
                  </p>

                  {/* bullets — only visible on the active card */}
                  <ul
                    className={`space-y-1.5 transition-all duration-500 ${
                      hovered === i
                        ? 'opacity-100 max-h-32 mt-2'
                        : 'opacity-0 max-h-0 overflow-hidden'
                    }`}
                  >
                    {m.bullets.map(b => (
                      <li key={b} className="flex items-start gap-2 text-[11px]" style={{ color: 'var(--text-primary)' }}>
                        <ArrowUpRight size={11} style={{ color: m.tone }} className="mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Helper hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-14 font-mono-tag"
          style={{ color: 'var(--text-muted)' }}
        >
          ↑ Hover to straighten · click in your repo to switch modes
        </motion.p>
      </div>
    </section>
  );
}
