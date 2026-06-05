'use client';

import { useRef, useEffect, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';

// 4 clips × 150vh each = 600vh total
const SECTION_VH = 1200;
const CLIP_COUNT  = 4;

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

// ── lerp / mapRange helpers — no framer internals ──────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
function mapRange(p: number, i0: number, i1: number, o0: number, o1: number) {
  if (i0 === i1) return o0;
  return lerp(o0, o1, (p - i0) / (i1 - i0));
}

// ── VideoAct — plain <video>, opacity set imperatively ─────────────
function VideoAct({
  clip,
  index,
  progress,
}: {
  clip: Clip;
  index: number;
  progress: MotionValue<number>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  const span    = 1 / CLIP_COUNT;
  const start   = index * span;
  const end     = start + span;
  const overlap = span * 0.15; // brief crossfade between clips

  const getOpacity = useCallback(
    (p: number): number => {
      if (index === 0) {
        // first clip: fully visible until it starts fading at end
        if (p < end - overlap) return 1;
        return mapRange(p, end - overlap, end, 1, 0);
      }
      if (index === CLIP_COUNT - 1) {
        // last clip: fades in, then stays
        if (p < start) return 0;
        if (p < start + overlap) return mapRange(p, start, start + overlap, 0, 1);
        return 1;
      }
      // middle clips: fade in, hold, fade out
      if (p < start) return 0;
      if (p < start + overlap) return mapRange(p, start, start + overlap, 0, 1);
      if (p < end - overlap)   return 1;
      return mapRange(p, end - overlap, end, 1, 0);
    },
    [index, start, end, overlap]
  );

  const apply = useCallback(
    (p: number) => {
      const o = String(getOpacity(p));
      if (videoRef.current) videoRef.current.style.opacity = o;
      if (scrimRef.current) scrimRef.current.style.opacity = o;
    },
    [getOpacity]
  );

  useMotionValueEvent(progress, 'change', apply);
  useEffect(() => { apply(progress.get()); }, [apply, progress]);

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: index === 0 ? 1 : 0 }}
        src={clip.src}
        autoPlay muted loop playsInline preload="auto"
      />
      <div
        ref={scrimRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: index === 0 ? 1 : 0,
          background:
            clip.anchor === 'top-left'
              ? 'linear-gradient(115deg,rgba(11,9,7,0.85) 0%,rgba(11,9,7,0.4) 40%,transparent 70%)'
              : 'linear-gradient(180deg,rgba(11,9,7,0.72) 0%,rgba(11,9,7,0.1) 50%,rgba(11,9,7,0.3) 100%)',
        }}
      />
    </>
  );
}

// ── TypewriterAct — scroll-driven char-by-char type + delete ───────
function TypewriterAct({
  clip,
  index,
  progress,
  isLast,
}: {
  clip: Clip;
  index: number;
  progress: MotionValue<number>;
  isLast: boolean;
}) {
  const lineRef    = useRef<HTMLSpanElement>(null);
  const cursorRef  = useRef<HTMLSpanElement>(null);
  const tagRef     = useRef<HTMLDivElement>(null);
  const payoffRef  = useRef<HTMLParagraphElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);

  const span    = 1 / CLIP_COUNT;
  const start   = index * span;
  const end     = start + span;
  const len     = clip.line.length;

  // Each clip's scroll window is split:
  //   0% – 40% → type in  (0 → len chars)
  //  40% – 60% → hold     (full text visible)
  //  60% – 100% → delete  (len → 0 chars)
  // BUT: last clip never deletes — just holds + shows payoff
  const typeEnd    = start + span * 0.40;
  const holdEnd    = start + span * 0.60;
  // payoff appears during hold phase of last clip
  const payoffStart = start + span * 0.45;
  const payoffEnd   = start + span * 0.65;

  const getChars = useCallback(
    (p: number): number => {
      if (p <= start)    return 0;
      if (p <= typeEnd)  return Math.round(mapRange(p, start, typeEnd, 0, len));
      if (p <= holdEnd)  return len;
      if (isLast)        return len; // last clip never deletes
      // delete phase
      const delEnd = end;
      return Math.round(mapRange(p, holdEnd, delEnd, len, 0));
    },
    [start, end, typeEnd, holdEnd, len, isLast]
  );

  const getWrapOpacity = useCallback(
    (p: number): number => {
      // fade the whole act in just before its window
      const fadeIn = start - span * 0.05;
      if (index === 0) return 1; // first act always visible from top
      if (p < fadeIn)  return 0;
      if (p < start)   return mapRange(p, fadeIn, start, 0, 1);
      if (isLast)      return 1;
      // fade out after delete is done
      const fadeOut = end + span * 0.02;
      if (p < end)     return 1;
      return mapRange(p, end, fadeOut, 1, 0);
    },
    [index, start, end, span, isLast]
  );

  const getPayoffChars = useCallback(
    (p: number): number => {
      if (!isLast) return 0;
      const pLen = PAYOFF.length;
      if (p < payoffStart) return 0;
      if (p < payoffEnd)   return Math.round(mapRange(p, payoffStart, payoffEnd, 0, pLen));
      return pLen;
    },
    [isLast, payoffStart, payoffEnd]
  );

  const apply = useCallback(
    (p: number) => {
      const chars   = getChars(p);
      const wOpacity = getWrapOpacity(p);

      if (lineRef.current)
        lineRef.current.textContent = clip.line.slice(0, chars);

      if (wrapRef.current)
        wrapRef.current.style.opacity = String(wOpacity);

      // blink cursor only while actively typing or deleting
      if (cursorRef.current) {
        const atFull  = chars === len;
        const atZero  = chars === 0;
        const holding = atFull && p <= holdEnd;
        // during hold: solid cursor. typing/deleting: blink via class
        cursorRef.current.style.opacity = (atZero && !isLast) ? '0' : '1';
        cursorRef.current.classList.toggle('animate-pulse', !holding && !atZero);
      }

      if (payoffRef.current && isLast) {
        const pChars = getPayoffChars(p);
        payoffRef.current.textContent = PAYOFF.slice(0, pChars);
        payoffRef.current.style.opacity = pChars > 0 ? '1' : '0';
      }
    },
    [clip.line, len, holdEnd, isLast, getChars, getWrapOpacity, getPayoffChars]
  );

  useMotionValueEvent(progress, 'change', apply);
  useEffect(() => { apply(progress.get()); }, [apply, progress]);

  const anchorClasses =
    clip.anchor === 'top-left'
      ? 'pt-24 lg:pt-28'
      : 'pt-28 lg:pt-32';

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 z-10 flex flex-col px-6 sm:px-10 lg:px-20 ${anchorClasses}`}
      style={{ opacity: index === 0 ? 1 : 0 }}
    >
      <div className="max-w-3xl">
        {/* tag */}
        <div ref={tagRef} className="mb-5 flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: clip.accent ? 'var(--accent)' : 'var(--text-muted)' }}
          />
          <span className="font-mono-tag" style={{ color: '#A59E97' }}>
            {clip.tag}
          </span>
        </div>

        {/* typewriter line */}
        <p
          className="font-display text-3xl leading-[1.08] sm:text-5xl lg:text-6xl"
          style={{ color: '#EDE8E2', letterSpacing: '-0.02em', minHeight: '1.1em' }}>
          <span ref={lineRef} />
          {/* blinking cursor */}
          <span
            ref={cursorRef}
            className="inline-block w-[3px] ml-[2px] rounded-sm align-middle animate-pulse"
            style={{
              height: '0.85em',
              background: clip.accent ? 'var(--accent)' : '#EDE8E2',
              verticalAlign: 'middle',
              opacity: index === 0 ? 1 : 0,
            }}
          />
        </p>

        {/* payoff — last clip only, also typewritten */}
        {isLast && (
          <p
            ref={payoffRef}
            className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl"
            style={{
              color: 'var(--accent)',
              letterSpacing: '-0.02em',
              opacity: 0,
              minHeight: '1.1em',
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Progress ticks ──────────────────────────────────────────────────
function Tick({
  index,
  progress,
}: {
  index: number;
  progress: MotionValue<number>;
}) {
  const tickRef = useRef<HTMLSpanElement>(null);
  const span    = 1 / CLIP_COUNT;
  const cl      = (v: number) => Math.min(1, Math.max(0, v));

  const apply = useCallback(
    (p: number) => {
      if (!tickRef.current) return;
      const start = index * span;
      const mid   = start + span * 0.5;
      const end   = start + span;
      let o: number;
      if (p < start) o = 0.25;
      else if (p < mid) o = mapRange(p, start, mid, 0.25, 1);
      else if (p < end) o = mapRange(p, mid, end, 1, 0.25);
      else o = 0.25;
      tickRef.current.style.opacity = String(cl(o));
    },
    [index, span]
  );

  useMotionValueEvent(progress, 'change', apply);
  useEffect(() => { apply(progress.get()); }, [apply, progress]);

  return (
    <span ref={tickRef} className="h-1 w-6 rounded-full" style={{ opacity: 0.25 }}>
      <span className="block h-full w-full rounded-full" style={{ background: 'var(--accent)' }} />
    </span>
  );
}

// ── CoverageSequence ────────────────────────────────────────────────
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
      style={{ height: `${SECTION_VH}vh`, background: '#0B0907', isolation: 'isolate' }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Videos — imperative opacity only, no motion.video */}
        {CLIPS.map((clip, i) => (
          <VideoAct
            key={clip.src}
            clip={clip}
            index={i}
            progress={scrollYProgress}
          />
        ))}

        {/* Typewriter text layers */}
        {CLIPS.map((clip, i) => (
          <TypewriterAct
            key={clip.src + '-type'}
            clip={clip}
            index={i}
            progress={scrollYProgress}
            isLast={i === CLIP_COUNT - 1}
          />
        ))}

        <div className="cinematic-vignette" />
        <div className="film-grain" />

        {/* Progress ticks */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {CLIPS.map((_, i) => (
            <Tick key={i} index={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}