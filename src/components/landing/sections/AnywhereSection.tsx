'use client';

/**
 * AnywhereSection — bridges the hero into the story. The premise: "the
 * box is the same. The body changes." Each card is a different host
 * (drone / wall / kitchen / rover) so the next section's narrative has
 * already been seeded.
 *
 * I'm using SVG illustrations rather than 3D here — the section needs
 * to scroll past quickly. 3D is reserved for the storytelling beats.
 */

import { motion } from 'framer-motion';
import { Bone, Cpu, Flame, Wifi } from 'lucide-react';

const CONTEXTS = [
  {
    tag: 'AERIAL',
    title: 'A drone',
    body: 'Hovering above an incident. Real-time vision, thermals, autonomous suppression bursts.',
    accent: '#E05A2B',
    illustration: (
      <svg viewBox="0 0 200 140" className="w-full h-full">
        <defs>
          <linearGradient id="dr1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#E05A2B" stopOpacity="0.35" />
            <stop offset="1" stopColor="#E05A2B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="110" r="45" fill="url(#dr1)" />
        {/* drone arms */}
        <line x1="60"  y1="60" x2="40"  y2="40" stroke="#A59E97" strokeWidth="2" />
        <line x1="140" y1="60" x2="160" y2="40" stroke="#A59E97" strokeWidth="2" />
        <line x1="60"  y1="80" x2="40"  y2="100" stroke="#A59E97" strokeWidth="2" />
        <line x1="140" y1="80" x2="160" y2="100" stroke="#A59E97" strokeWidth="2" />
        {/* rotors */}
        <ellipse cx="40"  cy="40"  rx="18" ry="3" fill="#EDE8E2" opacity="0.6">
          <animate attributeName="rx" values="18;3;18" dur="0.4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="160" cy="40"  rx="18" ry="3" fill="#EDE8E2" opacity="0.6">
          <animate attributeName="rx" values="18;3;18" dur="0.4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="40"  cy="100" rx="18" ry="3" fill="#EDE8E2" opacity="0.6">
          <animate attributeName="rx" values="18;3;18" dur="0.4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="160" cy="100" rx="18" ry="3" fill="#EDE8E2" opacity="0.6">
          <animate attributeName="rx" values="18;3;18" dur="0.4s" repeatCount="indefinite" />
        </ellipse>
        {/* body */}
        <rect x="80" y="60" width="40" height="22" rx="4" fill="#272220" stroke="#443D39" />
        {/* FIRECTRL box */}
        <rect x="88" y="82" width="24" height="10" rx="2" fill="#E05A2B" />
        <circle cx="100" cy="87" r="1.5" fill="#fff" />
      </svg>
    ),
  },
  {
    tag: 'FIXED',
    title: 'A wall mount',
    body: 'In a kitchen, a server room, a factory floor. Always-on watch with local logging.',
    accent: '#B8860B',
    illustration: (
      <svg viewBox="0 0 200 140" className="w-full h-full">
        <defs>
          <linearGradient id="w1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#B8860B" stopOpacity="0.25" />
            <stop offset="1" stopColor="#B8860B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="20" y="20" width="160" height="100" rx="4" fill="url(#w1)" />
        {/* wall pattern */}
        <line x1="20" y1="50" x2="180" y2="50" stroke="#3A3430" strokeDasharray="2 4" />
        <line x1="20" y1="90" x2="180" y2="90" stroke="#3A3430" strokeDasharray="2 4" />
        {/* mounted box */}
        <rect x="80" y="55" width="40" height="30" rx="3" fill="#272220" stroke="#443D39" />
        <circle cx="100" cy="70" r="6" fill="none" stroke="#E05A2B" strokeWidth="1.5" />
        <circle cx="100" cy="70" r="2" fill="#E05A2B">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* sensor sweep */}
        <path d="M 100 70 L 60 100" stroke="#E05A2B" strokeWidth="1" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" from="-30 100 70" to="30 100 70" dur="3s" repeatCount="indefinite" />
        </path>
      </svg>
    ),
  },
  {
    tag: 'MOBILE',
    title: 'A rover',
    body: 'Exploring debris, post-incident sites, places too dangerous for a person. Mapping as it goes.',
    accent: '#3A7D5C',
    illustration: (
      <svg viewBox="0 0 200 140" className="w-full h-full">
        <defs>
          <linearGradient id="r1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3A7D5C" stopOpacity="0.3" />
            <stop offset="1" stopColor="#3A7D5C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="115" rx="60" ry="6" fill="url(#r1)" />
        {/* rover body */}
        <rect x="50" y="65" width="100" height="35" rx="5" fill="#272220" stroke="#443D39" />
        <rect x="65" y="50" width="70" height="20" rx="3" fill="#322C29" stroke="#443D39" />
        {/* FIRECTRL box on top */}
        <rect x="85" y="42" width="30" height="10" rx="2" fill="#E05A2B" />
        {/* wheels */}
        <circle cx="65"  cy="105" r="8" fill="#1C1816" stroke="#A59E97" />
        <circle cx="100" cy="105" r="8" fill="#1C1816" stroke="#A59E97" />
        <circle cx="135" cy="105" r="8" fill="#1C1816" stroke="#A59E97" />
        {/* terrain line */}
        <path d="M 10 130 Q 50 122 100 128 T 190 124" stroke="#3A3430" fill="none" />
      </svg>
    ),
  },
  {
    tag: 'WORKBENCH',
    title: 'Your own robot',
    body: 'R&D platform. Hook in your sensors, train models on your data, deploy in a single click.',
    accent: '#6B7DB3',
    illustration: (
      <svg viewBox="0 0 200 140" className="w-full h-full">
        <defs>
          <linearGradient id="b1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#6B7DB3" stopOpacity="0.3" />
            <stop offset="1" stopColor="#6B7DB3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="20" y="100" width="160" height="6" fill="url(#b1)" />
        <line x1="20" y1="103" x2="180" y2="103" stroke="#443D39" />
        {/* arm — segmented */}
        <line x1="60" y1="103" x2="60" y2="70" stroke="#A59E97" strokeWidth="3" />
        <line x1="60" y1="70" x2="100" y2="50" stroke="#A59E97" strokeWidth="3" />
        <line x1="100" y1="50" x2="140" y2="65" stroke="#A59E97" strokeWidth="3" />
        <circle cx="60"  cy="70" r="4" fill="#272220" stroke="#443D39" />
        <circle cx="100" cy="50" r="4" fill="#272220" stroke="#443D39" />
        <rect x="135" y="58" width="14" height="14" rx="2" fill="#E05A2B" />
        <circle cx="60" cy="103" r="6" fill="#272220" stroke="#443D39" />
        {/* training grid */}
        <g opacity="0.4">
          <line x1="20"  y1="120" x2="180" y2="120" stroke="#443D39" strokeDasharray="1 3" />
          <line x1="40"  y1="100" x2="40"  y2="130" stroke="#443D39" strokeDasharray="1 3" />
          <line x1="80"  y1="100" x2="80"  y2="130" stroke="#443D39" strokeDasharray="1 3" />
          <line x1="120" y1="100" x2="120" y2="130" stroke="#443D39" strokeDasharray="1 3" />
          <line x1="160" y1="100" x2="160" y2="130" stroke="#443D39" strokeDasharray="1 3" />
        </g>
      </svg>
    ),
  },
];

export default function AnywhereSection() {
  return (
    <section id="anywhere" className="stage py-28 lg:py-36 px-5 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-16 lg:mb-24"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>
              01 · The plug-and-play premise
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight" style={{ letterSpacing: '-0.035em' }}>
            One box.
            <br />
            <span className="font-display" style={{ color: 'var(--accent)' }}>Infinite</span> hosts.
          </h2>

          <p className="mt-6 text-base sm:text-lg max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            FIRECTRL is a hardware-agnostic safety stack. The Raspberry Pi
            inside doesn&apos;t care what it&apos;s bolted to — it just runs the
            three layers, locally, talking to your screen over a tunneled link.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {CONTEXTS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 40, filter: 'blur(16px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="card group relative overflow-hidden p-6 cursor-default"
              style={{ minHeight: 340 }}
            >
              {/* Illustration backdrop */}
              <div className="absolute inset-0 opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[55%] mt-auto">{c.illustration}</div>
                </div>
              </div>

              {/* Gradient fade so text stays readable */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, var(--bg-card) 30%, transparent 80%)',
                }}
              />

              {/* Text */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: c.accent }}
                  />
                  <span className="font-mono-tag" style={{ color: c.accent }}>
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-2xl font-medium tracking-tight mt-auto" style={{ letterSpacing: '-0.02em' }}>
                  {c.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {c.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Marquee strip of "ANYWHERE" — visual punctuation */}
        <div className="mt-20 lg:mt-28 overflow-hidden no-scrollbar" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <div className="marquee-track">
            {[...Array(2)].map((_, k) => (
              <div key={k} className="flex items-center gap-12 pr-12">
                {['ANYWHERE', 'ANY ROBOT', 'ANY DEPLOYMENT', 'ANY SCALE', 'ANYWHERE', 'ANY ROBOT', 'ANY DEPLOYMENT', 'ANY SCALE'].map((w, i) => (
                  <span key={`${k}-${i}`} className="flex items-center gap-12">
                    <span className="font-display text-5xl lg:text-6xl" style={{ color: 'var(--text-secondary)' }}>{w}</span>
                    <Wifi size={18} style={{ color: 'var(--accent)' }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stat row — supporting the premise */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8">
          {[
            { icon: Cpu,   k: 'Local-first',  v: 'Everything runs on the Pi. The cloud never touches your data.' },
            { icon: Bone,  k: 'Hardware-agnostic', v: 'I²C, UART, USB, GPIO — whatever your robot speaks, the box hears.' },
            { icon: Flame, k: 'Fire-aware',   v: 'Thermal, RGB, and acoustic fusion tuned for combustion signatures.' },
          ].map((s, i) => (
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="flex gap-4 p-5 rounded-xl"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              <s.icon size={20} style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">{s.k}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.v}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
