'use client';

import { motion } from 'framer-motion';
import { Bone, Cpu, Flame, Wifi } from 'lucide-react';

// ─── Illustrations ────────────────────────────────────────────────────────────
// Each is a self-contained SVG with CSS animations baked in.
// No external deps, no 3D, no GLB.

const DroneIllustration = () => (
  <svg viewBox="0 0 220 160" className="w-full h-full" aria-hidden>
    <defs>
      <radialGradient id="drone-glow" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stopColor="#E05A2B" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#E05A2B" stopOpacity="0" />
      </radialGradient>
      <filter id="drone-blur">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>

    {/* ambient glow underneath */}
    <ellipse cx="110" cy="130" rx="70" ry="18" fill="url(#drone-glow)" />

    {/* altitude dashes */}
    {[0,1,2,3].map(i => (
      <line key={i}
        x1={110} y1={138 - i * 10} x2={110} y2={133 - i * 10}
        stroke="#E05A2B" strokeWidth="1.5" opacity={0.6 - i * 0.15}
        strokeLinecap="round"
      />
    ))}

    {/* arm struts — X pattern */}
    <line x1="90" y1="72" x2="44" y2="44"  stroke="#6B6560" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="130" y1="72" x2="176" y2="44" stroke="#6B6560" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="90" y1="88" x2="44" y2="116"  stroke="#6B6560" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="130" y1="88" x2="176" y2="116" stroke="#6B6560" strokeWidth="2.5" strokeLinecap="round" />

    {/* motor housings */}
    {[[44,44],[176,44],[44,116],[176,116]].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r="9" fill="#1C1816" stroke="#443D39" strokeWidth="1.5" />
    ))}

    {/* spinning rotors — CSS animation */}
    <style>{`
      @keyframes spin-r { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .r1 { transform-origin: 44px 44px; animation: spin-r 0.35s linear infinite; }
      .r2 { transform-origin: 176px 44px; animation: spin-r 0.35s linear infinite reverse; }
      .r3 { transform-origin: 44px 116px; animation: spin-r 0.35s linear infinite reverse; }
      .r4 { transform-origin: 176px 116px; animation: spin-r 0.35s linear infinite; }
      @keyframes drone-hover { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      .drone-body { animation: drone-hover 3s ease-in-out infinite; }
    `}</style>

    <g className="r1"><line x1="26" y1="44" x2="62" y2="44" stroke="#EDE8E2" strokeWidth="2" strokeLinecap="round" opacity="0.7" /></g>
    <g className="r2"><line x1="158" y1="44" x2="194" y2="44" stroke="#EDE8E2" strokeWidth="2" strokeLinecap="round" opacity="0.7" /></g>
    <g className="r3"><line x1="26" y1="116" x2="62" y2="116" stroke="#EDE8E2" strokeWidth="2" strokeLinecap="round" opacity="0.7" /></g>
    <g className="r4"><line x1="158" y1="116" x2="194" y2="116" stroke="#EDE8E2" strokeWidth="2" strokeLinecap="round" opacity="0.7" /></g>

    {/* body — hovering */}
    <g className="drone-body">
      {/* main chassis */}
      <rect x="82" y="62" width="56" height="36" rx="8" fill="#272220" stroke="#443D39" strokeWidth="1.5" />
      {/* camera gimbal */}
      <circle cx="110" cy="98" r="7" fill="#1C1816" stroke="#443D39" strokeWidth="1" />
      <circle cx="110" cy="98" r="3.5" fill="#2A2020" stroke="#E05A2B" strokeWidth="0.8" />
      {/* FIRECTRL module */}
      <rect x="91" y="69" width="38" height="16" rx="3" fill="#1C1816" stroke="#E05A2B" strokeWidth="0.8" />
      {/* status LED */}
      <circle cx="120" cy="77" r="2.5" fill="#E05A2B">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
      {/* label */}
      <text x="97" y="81" fontSize="5" fill="#A59E97" fontFamily="monospace" letterSpacing="0.5">FIRECTRL</text>
    </g>
  </svg>
);

const WallMountIllustration = () => (
  <svg viewBox="0 0 220 160" className="w-full h-full" aria-hidden>
    <defs>
      <radialGradient id="wall-scan" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#B8860B" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#B8860B" stopOpacity="0" />
      </radialGradient>
      <clipPath id="wall-clip">
        <rect x="0" y="0" width="220" height="160" />
      </clipPath>
    </defs>
    <style>{`
      @keyframes sweep {
        0%   { transform: rotate(-40deg); opacity: 0.7; }
        50%  { transform: rotate(40deg);  opacity: 0.9; }
        100% { transform: rotate(-40deg); opacity: 0.7; }
      }
      @keyframes ping {
        0%,100% { r: 12; opacity: 0.8; }
        50%     { r: 32; opacity: 0; }
      }
      .scan-arm { transform-origin: 110px 72px; animation: sweep 3s ease-in-out infinite; }
      .scan-ping { animation: ping 2s ease-out infinite; }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
    `}</style>

    {/* wall surface — subtle brick-like texture */}
    {[0,1,2,3,4,5,6].map(i => (
      <line key={i} x1="30" y1={20 + i*20} x2="190" y2={20 + i*20}
        stroke="#2A2420" strokeWidth="1" opacity="0.6" />
    ))}
    {[0,1,2,3,4].map(i => (
      <line key={i} x1={50 + i*36} y1="20" x2={50 + i*36} y2="140"
        stroke="#2A2420" strokeWidth="0.5" opacity="0.3" />
    ))}

    {/* scan field */}
    <ellipse cx="110" cy="72" rx="70" ry="55" fill="url(#wall-scan)" clipPath="url(#wall-clip)" />

    {/* scan sweep beam */}
    <g className="scan-arm" clipPath="url(#wall-clip)">
      <line x1="110" y1="72" x2="110" y2="20" stroke="#B8860B" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <line x1="110" y1="72" x2="165" y2="30" stroke="#B8860B" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />
    </g>

    {/* ping rings */}
    <circle cx="110" cy="72" r="12" fill="none" stroke="#B8860B" strokeWidth="1" className="scan-ping" />
    <circle cx="110" cy="72" r="12" fill="none" stroke="#B8860B" strokeWidth="0.6" style={{animation:'ping 2s ease-out infinite 0.6s'}} />

    {/* mount bracket */}
    <rect x="96" y="8" width="28" height="14" rx="3" fill="#272220" stroke="#443D39" strokeWidth="1.5" />
    <rect x="108" y="22" width="4" height="12" fill="#443D39" />

    {/* device body */}
    <rect x="82" y="54" width="56" height="42" rx="6" fill="#272220" stroke="#443D39" strokeWidth="1.5" />
    {/* lens */}
    <circle cx="110" cy="72" r="12" fill="#1C1816" stroke="#443D39" strokeWidth="1.5" />
    <circle cx="110" cy="72" r="7" fill="#161210" stroke="#B8860B" strokeWidth="0.8" />
    <circle cx="106" cy="68" r="2" fill="#443D39" opacity="0.6" />
    {/* status strip */}
    <rect x="88" y="88" width="44" height="4" rx="2" fill="#1C1816" />
    <rect x="88" y="88" width="20" height="4" rx="2" fill="#E05A2B">
      <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
    </rect>
    {/* label */}
    <text x="89" y="81" fontSize="4.5" fill="#A59E97" fontFamily="monospace">FIRECTRL·WALL</text>
  </svg>
);

const RoverIllustration = () => (
  <svg viewBox="0 0 220 160" className="w-full h-full" aria-hidden>
    <defs>
      <linearGradient id="rover-ground" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#3A7D5C" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#3A7D5C" stopOpacity="0" />
      </linearGradient>
    </defs>
    <style>{`
      @keyframes roll { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes rover-move { 0%,100%{transform:translateX(0)} 50%{transform:translateX(6px)} }
      .wheel-fl { transform-origin: 56px 118px; animation: roll 1.4s linear infinite; }
      .wheel-ml { transform-origin: 110px 122px; animation: roll 1.4s linear infinite; }
      .wheel-rl { transform-origin: 164px 118px; animation: roll 1.4s linear infinite; }
      .rover-chassis { animation: rover-move 3s ease-in-out infinite; }
      @keyframes mast-ping { 0%,100%{opacity:1;r:3} 50%{opacity:0.1;r:8} }
    `}</style>

    {/* terrain */}
    <path d="M10 140 Q40 132 70 138 Q100 144 130 136 Q160 128 190 134 L210 140 L10 140 Z"
      fill="url(#rover-ground)" />
    <path d="M10 138 Q55 128 100 136 Q145 128 210 134"
      stroke="#3A7D5C" strokeWidth="1" fill="none" opacity="0.5" />

    {/* tread marks */}
    {[0,1,2,3,4,5].map(i => (
      <line key={i} x1={30 + i*28} y1="140" x2={36 + i*28} y2="140"
        stroke="#3A7D5C" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
    ))}

    <g className="rover-chassis">
      {/* main body */}
      <rect x="48" y="72" width="124" height="42" rx="7" fill="#272220" stroke="#443D39" strokeWidth="1.5" />
      {/* upper deck */}
      <rect x="62" y="54" width="96" height="22" rx="5" fill="#1C1816" stroke="#443D39" strokeWidth="1" />
      {/* FIRECTRL box */}
      <rect x="78" y="44" width="44" height="14" rx="3" fill="#272220" stroke="#E05A2B" strokeWidth="0.8" />
      <text x="82" y="54" fontSize="4.5" fill="#A59E97" fontFamily="monospace">FIRECTRL</text>

      {/* mast */}
      <line x1="148" y1="54" x2="148" y2="28" stroke="#A59E97" strokeWidth="2" strokeLinecap="round" />
      <circle cx="148" cy="26" r="5" fill="#272220" stroke="#443D39" strokeWidth="1" />
      {/* mast sensor ping */}
      <circle cx="148" cy="26" r="3" fill="#E05A2B">
        <animate attributeName="r" values="3;9;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="148" cy="26" r="3" fill="#E05A2B" />

      {/* solar panel */}
      <rect x="62" y="57" width="36" height="16" rx="2" fill="#1A2030" stroke="#443D39" strokeWidth="1" />
      {[0,1,2].map(i => (
        <line key={i} x1={68 + i*10} y1="57" x2={68 + i*10} y2="73"
          stroke="#2A3848" strokeWidth="1" />
      ))}

      {/* camera eye */}
      <circle cx="172" cy="90" r="9" fill="#1C1816" stroke="#443D39" strokeWidth="1.5" />
      <circle cx="172" cy="90" r="5" fill="#161210" stroke="#3A7D5C" strokeWidth="0.8" />

      {/* suspension arms */}
      <line x1="56" y1="100" x2="56" y2="116" stroke="#6B6560" strokeWidth="3" strokeLinecap="round" />
      <line x1="110" y1="114" x2="110" y2="122" stroke="#6B6560" strokeWidth="3" strokeLinecap="round" />
      <line x1="164" y1="100" x2="164" y2="116" stroke="#6B6560" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* wheels */}
    <g className="wheel-fl">
      <circle cx="56" cy="118" r="16" fill="#1C1816" stroke="#6B6560" strokeWidth="2" />
      <circle cx="56" cy="118" r="8" fill="#272220" />
      <line x1="56" y1="102" x2="56" y2="134" stroke="#443D39" strokeWidth="1.5" />
      <line x1="40" y1="118" x2="72" y2="118" stroke="#443D39" strokeWidth="1.5" />
    </g>
    <g className="wheel-ml">
      <circle cx="110" cy="122" r="14" fill="#1C1816" stroke="#6B6560" strokeWidth="2" />
      <circle cx="110" cy="122" r="7" fill="#272220" />
      <line x1="110" y1="108" x2="110" y2="136" stroke="#443D39" strokeWidth="1.5" />
      <line x1="96" y1="122" x2="124" y2="122" stroke="#443D39" strokeWidth="1.5" />
    </g>
    <g className="wheel-rl">
      <circle cx="164" cy="118" r="16" fill="#1C1816" stroke="#6B6560" strokeWidth="2" />
      <circle cx="164" cy="118" r="8" fill="#272220" />
      <line x1="164" y1="102" x2="164" y2="134" stroke="#443D39" strokeWidth="1.5" />
      <line x1="148" y1="118" x2="180" y2="118" stroke="#443D39" strokeWidth="1.5" />
    </g>
  </svg>
);

const WorkbenchIllustration = () => (
  <svg viewBox="0 0 220 160" className="w-full h-full" aria-hidden>
    <defs>
      <linearGradient id="bench-glow" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0%" stopColor="#6B7DB3" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#6B7DB3" stopOpacity="0" />
      </linearGradient>
    </defs>
    <style>{`
      @keyframes arm1 {
        0%,100% { transform: rotate(0deg); }
        40%     { transform: rotate(18deg); }
        60%     { transform: rotate(18deg); }
      }
      @keyframes arm2 {
        0%,100% { transform: rotate(0deg); }
        40%     { transform: rotate(-22deg); }
        60%     { transform: rotate(-22deg); }
      }
      @keyframes data-pulse { 0%,100%{opacity:0.2} 50%{opacity:1} }
      .seg1 { transform-origin: 72px 120px; animation: arm1 4s ease-in-out infinite; }
      .seg2 { transform-origin: 72px 72px; animation: arm2 4s ease-in-out infinite 0.1s; }
    `}</style>

    {/* bench surface */}
    <rect x="20" y="118" width="180" height="6" rx="3" fill="#272220" stroke="#443D39" strokeWidth="1" />
    <rect x="20" y="124" width="180" height="20" rx="2" fill="#1C1816" />

    {/* grid on bench */}
    {[0,1,2,3,4,5,6].map(i => (
      <line key={`h${i}`} x1="20" y1={130 + i*2} x2="200" y2={130 + i*2}
        stroke="#2A2420" strokeWidth="0.5" />
    ))}

    {/* bench glow */}
    <rect x="20" y="60" width="180" height="60" fill="url(#bench-glow)" />

    {/* data flow lines on desk */}
    {[0,1,2,3].map(i => (
      <line key={i} x1={40 + i*36} y1="118" x2={40 + i*36} y2="96"
        stroke="#6B7DB3" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0.1;0.5;0.1" dur={`${1.5+i*0.3}s`} repeatCount="indefinite" />
      </line>
    ))}

    {/* arm base */}
    <circle cx="72" cy="120" r="10" fill="#272220" stroke="#443D39" strokeWidth="1.5" />
    <circle cx="72" cy="120" r="5" fill="#1C1816" stroke="#6B7DB3" strokeWidth="0.8" />

    {/* arm segment 1 */}
    <g className="seg1">
      <rect x="68" y="48" width="8" height="74" rx="4" fill="#272220" stroke="#443D39" strokeWidth="1.5" />
      <circle cx="72" cy="72" r="7" fill="#1C1816" stroke="#443D39" strokeWidth="1.5" />
      {/* joint indicator */}
      <circle cx="72" cy="72" r="3" fill="#6B7DB3" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* arm segment 2 */}
      <g className="seg2">
        <rect x="68" y="24" width="8" height="50" rx="4" fill="#272220" stroke="#443D39" strokeWidth="1.5" />
        <circle cx="72" cy="48" r="6" fill="#1C1816" stroke="#443D39" strokeWidth="1.5" />
        <circle cx="72" cy="48" r="2.5" fill="#6B7DB3" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* end effector — FIRECTRL module */}
        <rect x="56" y="14" width="32" height="22" rx="4" fill="#272220" stroke="#E05A2B" strokeWidth="1" />
        <circle cx="72" cy="25" r="5" fill="#1C1816" stroke="#E05A2B" strokeWidth="0.8" />
        <circle cx="72" cy="25" r="2.5" fill="#E05A2B">
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <text x="60" y="33" fontSize="4" fill="#A59E97" fontFamily="monospace">MODULE</text>
      </g>
    </g>

    {/* laptop / monitor on bench */}
    <rect x="120" y="78" width="72" height="44" rx="4" fill="#1C1816" stroke="#443D39" strokeWidth="1.5" />
    <rect x="124" y="82" width="64" height="36" rx="2" fill="#161210" />
    {/* screen content — training data viz */}
    {[0,1,2,3,4].map(i => (
      <rect key={i} x={127 + i*12} y={100 - i*5} width="8" height={10 + i*5}
        rx="1" fill="#6B7DB3" opacity="0.6">
        <animate attributeName="height" values={`${10+i*5};${14+i*5};${10+i*5}`}
          dur={`${0.8+i*0.2}s`} repeatCount="indefinite" />
        <animate attributeName="y" values={`${100-i*5};${96-i*5};${100-i*5}`}
          dur={`${0.8+i*0.2}s`} repeatCount="indefinite" />
      </rect>
    ))}
    <text x="127" y="91" fontSize="4" fill="#6B7DB3" fontFamily="monospace" opacity="0.8">TRAINING</text>
    {/* screen reflection */}
    <rect x="124" y="82" width="64" height="36" rx="2" fill="white" opacity="0.02" />
  </svg>
);

// ─── Section data ─────────────────────────────────────────────────────────────

const CONTEXTS = [
  {
    tag: 'AERIAL',
    title: 'A drone',
    body: 'Hovering above an incident. Real-time vision, thermals, autonomous suppression bursts.',
    accent: '#E05A2B',
    illustration: <DroneIllustration />,
  },
  {
    tag: 'FIXED',
    title: 'A wall mount',
    body: 'In a kitchen, a server room, a factory floor. Always-on watch with local logging.',
    accent: '#B8860B',
    illustration: <WallMountIllustration />,
  },
  {
    tag: 'MOBILE',
    title: 'A rover',
    body: 'Exploring debris, post-incident sites, places too dangerous for a person. Mapping as it goes.',
    accent: '#3A7D5C',
    illustration: <RoverIllustration />,
  },
  {
    tag: 'WORKBENCH',
    title: 'Your own robot',
    body: 'R&D platform. Hook in your sensors, train models on your data, deploy in a single click.',
    accent: '#6B7DB3',
    illustration: <WorkbenchIllustration />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnywhereSection() {
  return (
    <section id="anywhere" className="stage py-28 lg:py-36 px-5 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">

        {/* header */}
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

        {/* cards */}
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
              {/* illustration backdrop */}
              <div className="absolute inset-0 opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700">
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <div className="w-full h-[62%]">{c.illustration}</div>
                </div>
              </div>

              {/* gradient fade so text stays readable */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, var(--bg-card) 32%, transparent 75%)' }}
              />

              {/* text */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-1 rounded-full" style={{ background: c.accent }} />
                  <span className="font-mono-tag" style={{ color: c.accent }}>{c.tag}</span>
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

        {/* marquee */}
        <div className="mt-20 lg:mt-28 overflow-hidden no-scrollbar" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <div className="marquee-track">
            {[...Array(2)].map((_, k) => (
              <div key={k} className="flex items-center gap-12 pr-12">
                {['ANYWHERE', 'ANY ROBOT', 'ANY DEPLOYMENT', 'ANY SCALE', 'ANYWHERE', 'ANY ROBOT', 'ANY DEPLOYMENT', 'ANY SCALE'].map((w, j) => (
                  <span key={`${k}-${j}`} className="flex items-center gap-12">
                    <span className="font-display text-5xl lg:text-6xl" style={{ color: 'var(--text-secondary)' }}>{w}</span>
                    <Wifi size={18} style={{ color: 'var(--accent)' }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* stat row */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8">
          {[
            { icon: Cpu,   k: 'Local-first',       v: 'Everything runs on the Pi. The cloud never touches your data.' },
            { icon: Bone,  k: 'Hardware-agnostic', v: 'I²C, UART, USB, GPIO — whatever your robot speaks, the box hears.' },
            { icon: Flame, k: 'Fire-aware',         v: 'Thermal, RGB, and acoustic fusion tuned for combustion signatures.' },
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