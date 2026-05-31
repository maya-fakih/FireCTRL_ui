'use client';

/**
 * FireCTRL Dashboard & Presentation Layer
 * 
 * SEQUENCE DESIGN:
 *  - Section 1 (Top): Bounded, slow, smooth scroll cinematic sequence (600vh).
 *  - Section 2 (Bottom): Interactive dashboard layout, 3D model staging workspace, 
 *    and configuration control grid.
 */

import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

// ── Increased to 600vh to ensure slow, luxurious crossfades ──
const SECTION_VH = 600;

type Anchor = 'default' | 'top-left';

interface Clip {
  src: string;
  tag: string;        
  line: string;       
  accent?: boolean;   
  anchor: Anchor;     
}

const CLIPS: Clip[] = [
  {
    src: '/wildfire.mp4',
    tag: 'WILDLAND',
    line: 'From wildfires tearing across a ridge,',
    accent: true,
    anchor: 'default',
  },
  {
    src: '/drones.mp4',
    tag: 'AIRBORNE',
    line: 'to the hobbyist flying at dusk,',
    anchor: 'default',
  },
  {
    src: '/home.mp4',
    tag: 'RESIDENTIAL',
    line: 'to the family asleep at home,',
    anchor: 'default',
  },
  {
    src: '/corporate.mp4',
    tag: 'ENTERPRISE',
    line: 'to the tower that never sleeps —',
    anchor: 'top-left', 
  },
];

const PAYOFF = "we've got you covered.";

// ─────────────────────────────────────────────────────────────────────
// Cinematic Sequence Component (Pre-Hero Narrative)
// ─────────────────────────────────────────────────────────────────────
function Act({
  clip,
  index,
  count,
  progress,
  isLast,
}: {
  clip: Clip;
  index: number;
  count: number;
  progress: MotionValue<number>;
  isLast: boolean;
}) {
  const span = 1 / count;
  const start = index * span;
  const end = start + span;
  const fade = span * 0.28; 

  const videoIn  = index === 0 ? 0 : Math.max(0, start - fade);
  const videoOut = isLast ? 1 : Math.min(1, end + fade);

  const videoOpacity = useTransform(
    progress,
    [videoIn, start, end, videoOut],
    [index === 0 ? 1 : 0, 1, 1, isLast ? 1 : 0]
  );

  const copyInStart  = Math.max(0, start - fade * 0.5);
  const copyInEnd    = start + fade * 0.4;
  const copyOutStart = end - fade * 0.4;
  const copyOutEnd   = Math.min(1, end + fade * 0.5);

  const copyOpacity = useTransform(
    progress,
    [copyInStart, copyInEnd, copyOutStart, copyOutEnd],
    [0, 1, 1, 0]
  );

  const yStart = Math.max(0, start - fade);
  const yEnd   = Math.min(1, end + fade);

  const copyY = useTransform(
    progress,
    [yStart, yEnd],
    [28, -28]
  );

  const payoffInStart = start + span * 0.45;
  const payoffInEnd   = Math.min(1, start + span * 0.65);

  const payoffOpacity = useTransform(
    progress,
    [payoffInStart, payoffInEnd],
    [0, 1]
  );

  const anchorClasses =
    clip.anchor === 'top-left'
      ? 'items-start justify-start text-left pt-24 lg:pt-28'
      : 'items-start justify-start text-left pt-28 lg:pt-32';

  return (
    <>
      <motion.video
        style={{ opacity: videoOpacity }}
        className="absolute inset-0 h-full w-full object-cover"
        src={clip.src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      <motion.div
        style={{ opacity: videoOpacity }}
        className="absolute inset-0"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              clip.anchor === 'top-left'
                ? 'linear-gradient(115deg, rgba(11,9,7,0.82) 0%, rgba(11,9,7,0.35) 40%, transparent 70%)'
                : 'linear-gradient(180deg, rgba(11,9,7,0.7) 0%, rgba(11,9,7,0.15) 45%, rgba(11,9,7,0.25) 100%)',
          }}
        />
      </motion.div>

      <motion.div
        style={{ opacity: copyOpacity, y: copyY }}
        className={`absolute inset-0 z-10 flex flex-col px-6 sm:px-10 lg:px-20 ${anchorClasses}`}
      >
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: clip.accent ? 'var(--accent)' : 'var(--text-muted)' }}
            />
            <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>
              {clip.tag}
            </span>
          </div>

          <p
            className="font-display text-3xl leading-[1.08] sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            {clip.line}
          </p>

          {isLast && (
            <motion.p
              style={{ opacity: payoffOpacity }}
              className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl"
            >
              <span style={{ color: 'var(--accent)' }}>{PAYOFF}</span>
            </motion.p>
          )}
        </div>
      </motion.div>
    </>
  );
}

function Tick({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const span = 1 / count;
  const tickIn   = Math.max(0, index * span - 0.02);
  const tickMid  = index * span + span * 0.5;
  const tickOut  = Math.min(1, (index + 1) * span + 0.02);

  const active = useTransform(
    progress,
    [tickIn, tickMid, tickOut],
    [0.25, 1, 0.25]
  );

  return (
    <motion.span style={{ opacity: active }} className="h-1 w-6 rounded-full">
      <span className="block h-full w-full rounded-full" style={{ background: 'var(--accent)' }} />
    </motion.span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Application & Dashboard Page
// ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ['start start', 'end end'],
  });

  return (
    <main className="min-h-screen w-full bg-[#0B0907] text-white selection:bg-[#E2583E]/30">
      
      {/* SECTION 1: Cinematic Ambient Video Sequence */}
      <section
        ref={scrollRef}
        className="relative w-full"
        style={{ height: `${SECTION_VH}vh` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {CLIPS.map((clip, i) => (
            <Act
              key={clip.src}
              clip={clip}
              index={i}
              count={CLIPS.length}
              progress={scrollYProgress}
              isLast={i === CLIPS.length - 1}
            />
          ))}

          <div className="cinematic-vignette" />
          <div className="film-grain" />

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {CLIPS.map((_, i) => (
              <Tick key={i} index={i} count={CLIPS.length} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Core Robotics Framework Dashboard & 3D Staging Space */}
      <section className="relative z-30 w-full bg-[#0B0907] px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          
          {/* Header Title Area */}
          <div className="mb-16 border-b border-white/10 pb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              FireCTRL System Staging
            </h1>
            <p className="mt-2 text-lg text-neutral-400">
              Configurable automated AI robotics hardware control grid.
            </p>
          </div>

          {/* Grid Interface Workspace */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            
            {/* Left/Center: 3D Robotics Model Staging Area */}
            <div className="lg:col-span-2">
              <div className="relative flex h-[500px] w-full items-center justify-center rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-md">
                <div className="absolute inset-0 opacity-25 grid-pattern" />
                
                {/* PLACEHOLDER FOR THREE.JS / RECT-THREE-FIBER 3D HARDWARE MODEL */}
                <div className="text-center z-10 px-4">
                  <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-[#E2583E]/20 flex items-center justify-center border border-[#E2583E]/40">
                    <span className="text-[#E2583E] text-xs font-mono">3D</span>
                  </div>
                  <h3 className="text-lg font-medium text-white">Autonomous Nozzle Simulation</h3>
                  <p className="mt-1 text-sm text-neutral-400 max-w-sm mx-auto">
                    Real-time Inverse Kinematics (IK) coordinate positioning map viewport.
                  </p>
                </div>
                
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="rounded-2xl border border-white/10 bg-neutral-900/30 p-6 backdrop-blur-md">
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#E2583E] mb-4">
                  System Parameters
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-sm text-neutral-400">YOLOv8 Analysis Layer</span>
                    <span className="font-mono text-sm text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-sm text-neutral-400">Temporal Persistence</span>
                    <span className="font-mono text-sm">94.2% stability</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">Suppression Mode</span>
                    <span className="font-mono text-sm text-red-400">Engaged</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
