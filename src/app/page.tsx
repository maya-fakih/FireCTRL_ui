'use client';

/**
 * CoverageSequence — the section directly under the hero.
 *
 * A sticky, scroll-driven sequence of four ambient video clips, each
 * carrying one beat of the "we've got you covered, everywhere" story:
 *
 *   wildfire   → "From wildfires raging across a ridge…"
 *   drones     → "…to the hobbyist flying at dusk…"
 *   home       → "…to the family aasleep at home…"
 *   corporate  → "…to the tower that never sleeps."
 *
 * HOW IT WORKS
 *  - The outer container is tall (≈ 4 viewports). Inside it, one sticky
 *    stage pins to the screen while you scroll.
 *  - scrollYProgress (0→1) maps onto 4 equal "acts". Each act fades its
 *    video + copy in, holds, then fades out as the next takes over.
 *  - All four <video> elements are mounted at once (cheap — they're small,
 *    muted, looping) and we just animate opacity. No unmount/remount jank.
 *
 * TUNING NOTES (for you, Maya)
 *  - Adjust SECTION_VH to make the scroll feel slower/faster.
 *  - The text anchor per clip is set in CLIPS[].anchor — corporate is
 *    pinned top-left because that clip is the only busy one (dark corner).
 *  - If you regenerate the city clip later, just drop the new file in as
 *    /corporate.mp4 and flip anchor back to 'default' if it has open sky.
 */

import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

// ── How tall the scroll region is. 4 acts × ~100vh of scroll travel. ──
const SECTION_VH = 420;

type Anchor = 'default' | 'top-left';

interface Clip {
  src: string;
  tag: string;        // small mono label, top
  line: string;       // the editorial line
  accent?: boolean;   // tint the tag dot / emphasis in ember
  anchor: Anchor;     // where the copy sits (avoids busy areas)
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
    anchor: 'top-left', // busy clip; dark corner is top-left
  },
];

// Closing payoff line that lives over the last clip, slightly delayed.
const PAYOFF = "we've got you covered.";

// ─────────────────────────────────────────────────────────────────────
// One act: a full-bleed video + its overlay copy, opacity driven by the
// shared scroll progress. `index` says which quarter of the scroll owns
// this act.
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
  const fade = span * 0.28; // crossfade overlap

  // Safe non-decreasing bounds for Video Opacity
  const videoIn  = index === 0 ? 0 : Math.max(0, start - fade);
  const videoOut = isLast ? 1 : Math.min(1, end + fade);

  const videoOpacity = useTransform(
    progress,
    [videoIn, start, end, videoOut],
    [index === 0 ? 1 : 0, 1, 1, isLast ? 1 : 0]
  );

  // Safe non-decreasing bounds for Copy Opacity
  const copyInStart  = Math.max(0, start - fade * 0.5);
  const copyInEnd    = start + fade * 0.4;
  const copyOutStart = end - fade * 0.4;
  const copyOutEnd   = Math.min(1, end + fade * 0.5);

  const copyOpacity = useTransform(
    progress,
    [copyInStart, copyInEnd, copyOutStart, copyOutEnd],
    [0, 1, 1, 0]
  );

  // Safe non-decreasing bounds for Copy Parallax (Y-axis)
  const yStart = Math.max(0, start - fade);
  const yEnd   = Math.min(1, end + fade);

  const copyY = useTransform(
    progress,
    [yStart, yEnd],
    [28, -28]
  );

  // Payoff line over the last clip — appears safely in the back half
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
      {/* video layer */}
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

      {/* readability scrim — darker where the text sits */}
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

      {/* copy layer */}
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
      {/* sticky stage that stays pinned while the section scrolls past */}
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

        {/* film grain + vignette to match the hero's filmic treatment */}
        <div className="cinematic-vignette" />
        <div className="film-grain" />

        {/* tiny progress ticks bottom-center so the user knows it's a sequence */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {CLIPS.map((_, i) => (
            <Tick key={i} index={i} count={CLIPS.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
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
  
  // Safe bounded ranges for the progress dots
  const tickIn   = Math.max(0, index * span - 0.02);
  const tickMid  = index * span + span * 0.5;
  const tickOut  = Math.min(1, (index + 1) * span + 0.02);

  const active = useTransform(
    progress,
    [tickIn, tickMid, tickOut],
    [0.25, 1, 0.25]
  );

  return (
    <motion.span
      style={{ opacity: active }}
      className="h-1 w-6 rounded-full"
    >
      <span className="block h-full w-full rounded-full" style={{ background: 'var(--accent)' }} />
    </motion.span>
  );
}
