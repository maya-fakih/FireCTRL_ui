'use client';

/**
 * CoverageSequence
 * Scroll-driven video crossfade: wildfire → drones → home → corporate
 * 
 * FIX: uses plain <video> with useMotionValueEvent to set inline opacity.
 * Avoids motion.video entirely — framer-motion's animate() on <video>
 * triggers "Offsets must be monotonically non-decreasing" in some versions.
 */

import { useRef, useEffect, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';

const SECTION_VH = 420;

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

/** Linear interpolation */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Map progress p through input range to output range — no framer needed */
function mapRange(
  p: number,
  inputs: number[],
  outputs: number[]
): number {
  if (p <= inputs[0]) return outputs[0];
  if (p >= inputs[inputs.length - 1]) return outputs[outputs.length - 1];
  for (let i = 0; i < inputs.length - 1; i++) {
    if (p >= inputs[i] && p <= inputs[i + 1]) {
      const t = (p - inputs[i]) / (inputs[i + 1] - inputs[i]);
      return lerp(outputs[i], outputs[i + 1], t);
    }
  }
  return outputs[outputs.length - 1];
}

// ─────────────────────────────────────────────────────────────────────
// VideoAct — plain <video> tag, opacity set imperatively via ref
// so framer-motion never tries to animate the video element directly.
// ─────────────────────────────────────────────────────────────────────
function VideoAct({
  clip,
  index,
  count,
  progress,
}: {
  clip: Clip;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  const span  = 1 / count;
  const start = index * span;
  const end   = start + span;
  const fade  = span * 0.28;

  const getOpacity = useCallback((p: number) => {
    if (index === 0) {
      return mapRange(p, [0, end, Math.min(1, end + fade)], [1, 1, 0]);
    }
    if (index === count - 1) {
      return mapRange(p, [Math.max(0, start - fade), start, 1], [0, 1, 1]);
    }
    return mapRange(
      p,
      [Math.max(0, start - fade), start, end, Math.min(1, end + fade)],
      [0, 1, 1, 0]
    );
  }, [index, count, start, end, fade]);

  useMotionValueEvent(progress, 'change', (p) => {
    const o = getOpacity(p);
    if (videoRef.current) videoRef.current.style.opacity = String(o);
    if (scrimRef.current) scrimRef.current.style.opacity = String(o);
  });

  // Set initial opacity on mount
  useEffect(() => {
    const o = getOpacity(progress.get());
    if (videoRef.current) videoRef.current.style.opacity = String(o);
    if (scrimRef.current) scrimRef.current.style.opacity = String(o);
  }, [getOpacity, progress]);

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: index === 0 ? 1 : 0 }}
        src={clip.src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div
        ref={scrimRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: index === 0 ? 1 : 0,
          background:
            clip.anchor === 'top-left'
              ? 'linear-gradient(115deg, rgba(11,9,7,0.82) 0%, rgba(11,9,7,0.35) 40%, transparent 70%)'
              : 'linear-gradient(180deg, rgba(11,9,7,0.7) 0%, rgba(11,9,7,0.15) 45%, rgba(11,9,7,0.25) 100%)',
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CopyAct — text overlay, still uses motion.div (fine for divs)
// ─────────────────────────────────────────────────────────────────────
function CopyAct({
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
  const span  = 1 / count;
  const start = index * span;
  const end   = start + span;
  const fade  = span * 0.28;

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  const copyOpacity = useTransform(
    progress,
    [
      clamp(start + fade * 0.2),
      clamp(start + fade * 0.8),
      clamp(end   - fade * 0.8),
      clamp(end   - fade * 0.2),
    ],
    [0, 1, 1, 0]
  );

  const copyY = useTransform(
    progress,
    [clamp(start), clamp(end)],
    [24, -24]
  );

  const payoffOpacity = useTransform(
    progress,
    [clamp(start + span * 0.45), clamp(start + span * 0.65)],
    [0, 1]
  );

  const anchorClasses =
    clip.anchor === 'top-left'
      ? 'items-start justify-start text-left pt-24 lg:pt-28'
      : 'items-start justify-start text-left pt-28 lg:pt-32';

  return (
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
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tick
// ─────────────────────────────────────────────────────────────────────
function Tick({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const span  = 1 / count;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const active = useTransform(
    progress,
    [clamp(index * span), clamp(index * span + span * 0.5), clamp((index + 1) * span)],
    [0.25, 1, 0.25]
  );
  return (
    <motion.span style={{ opacity: active }} className="h-1 w-6 rounded-full">
      <span className="block h-full w-full rounded-full" style={{ background: 'var(--accent)' }} />
    </motion.span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CoverageSequence
// ─────────────────────────────────────────────────────────────────────
export default function CoverageSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: `${SECTION_VH}vh`, background: '#0B0907' }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Videos — plain elements, opacity driven imperatively */}
        {CLIPS.map((clip, i) => (
          <VideoAct
            key={clip.src}
            clip={clip}
            index={i}
            count={CLIPS.length}
            progress={scrollYProgress}
          />
        ))}

        {/* Copy — motion.div is fine */}
        {CLIPS.map((clip, i) => (
          <CopyAct
            key={clip.src + '-copy'}
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
  );
}