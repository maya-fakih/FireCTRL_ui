'use client';

/**
 * StorySection — the cinematic centerpiece. A 4-viewport-tall container
 * with a sticky inner stage; scroll progress drives which "act" is visible.
 *
 * Acts:
 *   Intro  (0.00–0.10) — title card "One System. Many Worlds."
 *   Act I  (0.10–0.38) — Front Line. Night city, drone overhead, firefighter POV.
 *   Act II (0.38–0.66) — Home. Kitchen interior, the robot watches the stove.
 *   Act III(0.66–1.00) — Workshop. Black-hole portal warp, then Iron Man helmet.
 *
 * IMPORTANT — tuning notes for the user:
 *  - The scroll heights here are approximate; you'll likely want to tune
 *    the [number]vh and the act windows after seeing it run.
 *  - The "drone" and "kitchen" environments are 2D for now; if you
 *    optimize city.glb + apartment.glb later, drop them into the
 *    <ActOne>/<ActTwo> backdrops.
 */

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useMotionTemplate, type MotionValue } from 'framer-motion';

const SceneCanvas    = dynamic(() => import('../three/SceneCanvas'),    { ssr: false });
const RobotModel     = dynamic(() => import('../three/RobotModel'),     { ssr: false });
const IronManModel   = dynamic(() => import('../three/IronManModel'),   { ssr: false });

// ─────────────────────────────────────────────────────────────────────
// Shared helper: smoothly fade an act in/out across a window of scroll
// progress (0..1). Returns opacity, scale, and a reactive blur filter
// string motion value (string motion values are required for CSS
// filter to actually update on scroll).
// ─────────────────────────────────────────────────────────────────────
function useActVisibility(progress: MotionValue<number>, start: number, end: number) {
  const fade = 0.04;
  const opacity = useTransform(
    progress,
    [start - fade, start, end, end + fade],
    [0, 1, 1, 0]
  );
  const scale = useTransform(
    progress,
    [start - fade, start, end, end + fade],
    [1.08, 1, 1, 0.95]
  );
  const blurPx = useTransform(
    progress,
    [start - fade, start, end, end + fade],
    [16, 0, 0, 12]
  );
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  return { opacity, scale, filter };
}

export default function StorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  // ── Intro title fades out as you start scrolling
  const introOpacity = useTransform(scrollYProgress, [0, 0.08, 0.12], [1, 1, 0]);
  const introY       = useTransform(scrollYProgress, [0, 0.12], [0, -60]);

  // ── Act windows
  const act1 = useActVisibility(scrollYProgress, 0.12, 0.36);
  const act2 = useActVisibility(scrollYProgress, 0.40, 0.62);
  const act3 = useActVisibility(scrollYProgress, 0.70, 0.96);

  // ── Robot rotates as you scroll through Act II (drives RobotModel)
  const robotRotation = useTransform(scrollYProgress, [0.40, 0.62], [-0.6, 0.6]);

  // ── Iron Man scale grows as you scroll through Act III
  const ironScale = useTransform(scrollYProgress, [0.66, 0.85, 1], [0.4, 1, 1.05]);
  const ironRotY  = useTransform(scrollYProgress, [0.66, 1],       [-0.8, 0.6]);

  // ── Black-hole portal between Act II and Act III (the TV warp)
  const portalScale   = useTransform(scrollYProgress, [0.60, 0.70], [0.001, 80]);
  const portalOpacity = useTransform(scrollYProgress, [0.60, 0.66, 0.70, 0.74], [0, 1, 1, 0]);

  return (
    <section id="story" ref={ref} className="relative" style={{ height: '500vh' }}>
      {/* sticky stage — fills the viewport while the section scrolls past */}
      <div className="sticky top-0 h-screen w-full overflow-hidden stage">

        {/* ─── Intro title card ─────────────────────────────────────── */}
        <motion.div
          style={{ opacity: introOpacity, y: introY }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full ember-pulse" style={{ background: 'var(--accent)' }} />
            <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>
              02 · A story in three acts
            </span>
          </div>
          <h2 className="text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight max-w-4xl" style={{ letterSpacing: '-0.04em' }}>
            One system.
            <br />
            <span className="font-display" style={{ color: 'var(--accent)' }}>Many</span> worlds.
          </h2>
          <p className="mt-6 max-w-xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Scroll to follow the same box through three lives — the front line,
            the home, the workshop.
          </p>
        </motion.div>

        {/* ─── ACT I — Front Line ────────────────────────────────────── */}
        <motion.div
          style={{ opacity: act1.opacity, scale: act1.scale, filter: act1.filter }}
          className="absolute inset-0"
        >
          <ActOne />
        </motion.div>

        {/* ─── ACT II — Home ─────────────────────────────────────────── */}
        <motion.div
          style={{ opacity: act2.opacity, scale: act2.scale, filter: act2.filter }}
          className="absolute inset-0"
        >
          <ActTwo rotation={robotRotation} />
        </motion.div>

        {/* ─── PORTAL WARP between Act II and Act III ────────────────── */}
        <motion.div
          style={{ opacity: portalOpacity }}
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            style={{ scale: portalScale }}
            className="w-12 h-12 rounded-full"
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(224,90,43,0.6) 35%, rgba(224,90,43,0.2) 55%, transparent 75%)',
                boxShadow:
                  '0 0 80px 20px rgba(224,90,43,0.5), inset 0 0 40px rgba(0,0,0,0.9)',
              }}
            />
          </motion.div>
        </motion.div>

        {/* ─── ACT III — Workshop ────────────────────────────────────── */}
        <motion.div
          style={{ opacity: act3.opacity, scale: act3.scale, filter: act3.filter }}
          className="absolute inset-0"
        >
          <ActThree scale={ironScale} rotation={ironRotY} />
        </motion.div>

        {/* persistent film grain + vignette */}
        <div className="cinematic-vignette z-40" />
        <div className="film-grain z-40" />

        {/* persistent scroll progress indicator */}
        <div className="absolute top-1/2 right-4 sm:right-8 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3">
          {['I', 'II', 'III'].map((n, i) => {
            const ranges = [[0.12, 0.36], [0.40, 0.62], [0.70, 0.96]];
            return (
              <ActDot key={n} label={n} progress={scrollYProgress} start={ranges[i][0]} end={ranges[i][1]} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// ACT I — Front line. Night city silhouette, drone above, fire glowing
// in one of the windows. Caption tells the firefighter narrative.
// ────────────────────────────────────────────────────────────────────
function ActOne() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* night sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #060508 0%, #0a0a14 35%, #1a0e0a 75%, #2a1410 100%)',
        }}
      />

      {/* distant stars */}
      <div className="absolute inset-0 opacity-60">
        {[...Array(40)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width:  Math.random() < 0.8 ? 1 : 2,
              height: Math.random() < 0.8 ? 1 : 2,
              left:   `${Math.random() * 100}%`,
              top:    `${Math.random() * 55}%`,
              opacity: 0.3 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

      {/* City silhouette — pure CSS / SVG. Replace with a 3D city scene
          once city.glb is optimized. */}
      <svg
        viewBox="0 0 1400 500"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 w-full h-[55%]"
      >
        <defs>
          <linearGradient id="cityG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0d0a08" />
            <stop offset="1" stopColor="#040303" />
          </linearGradient>
          <radialGradient id="fireG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0"   stopColor="#ffb066" stopOpacity="1" />
            <stop offset="0.4" stopColor="#E05A2B" stopOpacity="0.8" />
            <stop offset="1"   stopColor="#E05A2B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* back row */}
        <g fill="url(#cityG)" opacity="0.7">
          {Array.from({ length: 24 }).map((_, i) => {
            const x = i * 60;
            const h = 120 + ((i * 53) % 180);
            return <rect key={i} x={x} y={500 - h} width={50} height={h} />;
          })}
        </g>

        {/* front row, taller */}
        <g fill="#08070a">
          {Array.from({ length: 16 }).map((_, i) => {
            const x = i * 90 + 10;
            const h = 200 + ((i * 71) % 220);
            return (
              <g key={i}>
                <rect x={x} y={500 - h} width={80} height={h} />
                {/* lit windows */}
                {Array.from({ length: Math.floor(h / 22) }).map((_, r) =>
                  Array.from({ length: 4 }).map((_, c) => {
                    const lit = (i * 13 + r * 7 + c * 5) % 5 < 2;
                    if (!lit) return null;
                    return (
                      <rect
                        key={`${r}-${c}`}
                        x={x + 8 + c * 16}
                        y={500 - h + 10 + r * 22}
                        width="10"
                        height="10"
                        fill="#E0B85A"
                        opacity={0.55}
                      />
                    );
                  })
                )}
              </g>
            );
          })}
        </g>

        {/* THE BURNING BUILDING — center, with pulsing fire */}
        <g>
          <rect x="640" y="160" width="110" height="340" fill="#0a0807" />
          {/* fire windows */}
          <rect x="668" y="200" width="20" height="20" fill="#ffd58a">
            <animate attributeName="opacity" values="0.9;1;0.7;1" dur="0.8s" repeatCount="indefinite" />
          </rect>
          <rect x="698" y="200" width="20" height="20" fill="#ff9050">
            <animate attributeName="opacity" values="0.7;1;0.8;1" dur="1.1s" repeatCount="indefinite" />
          </rect>
          <rect x="668" y="230" width="20" height="20" fill="#ff7030">
            <animate attributeName="opacity" values="1;0.6;1;0.8" dur="0.6s" repeatCount="indefinite" />
          </rect>
          <rect x="698" y="230" width="20" height="20" fill="#ffa860">
            <animate attributeName="opacity" values="0.8;1;0.7;1" dur="0.9s" repeatCount="indefinite" />
          </rect>
          {/* glow */}
          <ellipse cx="695" cy="225" rx="120" ry="60" fill="url(#fireG)">
            <animate attributeName="rx" values="100;140;100" dur="3s" repeatCount="indefinite" />
            <animate attributeName="ry" values="50;75;50" dur="3s" repeatCount="indefinite" />
          </ellipse>
        </g>
      </svg>

      {/* The drone — small SVG, hovering with subtle float */}
      <div className="absolute top-[28%] left-[60%] sm:left-[58%] animate-[float_4s_ease-in-out_infinite]">
        <svg width="160" height="80" viewBox="0 0 200 100" className="drop-shadow-2xl">
          <line x1="50"  y1="50" x2="20"  y2="20" stroke="#A59E97" strokeWidth="2" />
          <line x1="150" y1="50" x2="180" y2="20" stroke="#A59E97" strokeWidth="2" />
          <line x1="50"  y1="50" x2="20"  y2="80" stroke="#A59E97" strokeWidth="2" />
          <line x1="150" y1="50" x2="180" y2="80" stroke="#A59E97" strokeWidth="2" />
          <ellipse cx="20"  cy="20" rx="22" ry="3" fill="#fff" opacity="0.4">
            <animate attributeName="rx" values="22;4;22" dur="0.3s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="180" cy="20" rx="22" ry="3" fill="#fff" opacity="0.4">
            <animate attributeName="rx" values="22;4;22" dur="0.3s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="20"  cy="80" rx="22" ry="3" fill="#fff" opacity="0.4">
            <animate attributeName="rx" values="22;4;22" dur="0.3s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="180" cy="80" rx="22" ry="3" fill="#fff" opacity="0.4">
            <animate attributeName="rx" values="22;4;22" dur="0.3s" repeatCount="indefinite" />
          </ellipse>
          <rect x="80" y="40" width="40" height="20" rx="4" fill="#272220" stroke="#443D39" />
          <rect x="90" y="60" width="20" height="6" rx="1" fill="#E05A2B" />
          {/* scan line from drone */}
          <line x1="100" y1="65" x2="100" y2="160" stroke="#E05A2B" strokeWidth="1" opacity="0.4" strokeDasharray="2 3">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
          </line>
        </svg>
      </div>

      {/* Caption */}
      <ActCaption
        roman="I"
        title="The front line"
        body="A drone hovers above the incident. Onboard, the FIRECTRL box is feeding thermal and vision data to a firefighter two blocks away — who's deciding what the drone does next."
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50%      { transform: translateY(-6px) translateX(4px); }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// ACT II — Home / Kitchen. Warm interior, the robot 3D model watches.
// Rotation is driven by scroll progress to give the "camera rotates"
// feel mentioned in the brief.
// ────────────────────────────────────────────────────────────────────
function ActTwo({ rotation }: { rotation: MotionValue<number> }) {
  // We pull a primitive number out of rotation each frame in the model
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* warm interior gradient — kitchen at dusk */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #1a0e08 0%, #2a1812 40%, #1c1108 100%)',
        }}
      />

      {/* lampshade glow upper-left */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,180,80,0.25) 0%, rgba(255,180,80,0.04) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Kitchen silhouette — counter, hood, stove */}
      <svg
        viewBox="0 0 1400 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-90"
      >
        {/* far wall tiles */}
        <g opacity="0.15">
          {Array.from({ length: 10 }).map((_, r) =>
            Array.from({ length: 18 }).map((_, c) => (
              <rect
                key={`${r}-${c}`}
                x={c * 80 - 40}
                y={120 + r * 60}
                width="78"
                height="58"
                fill="none"
                stroke="#E05A2B"
                strokeWidth="0.5"
              />
            ))
          )}
        </g>
        {/* counter */}
        <rect x="0"   y="560" width="1400" height="240" fill="#0d0806" />
        <line x1="0" y1="560" x2="1400" y2="560" stroke="#3A3430" />
        {/* range hood */}
        <rect x="240" y="0"   width="280" height="180" fill="#0d0806" />
        <rect x="270" y="160" width="220" height="40"  fill="#1a120e" />
        {/* stove top */}
        <rect x="280" y="510" width="200" height="60"  fill="#0a0604" stroke="#3A3430" />
        <circle cx="320" cy="540" r="14" fill="none" stroke="#E05A2B" strokeOpacity="0.5" />
        <circle cx="380" cy="540" r="14" fill="none" stroke="#E05A2B" strokeOpacity="0.5" />
        <circle cx="440" cy="540" r="14" fill="none" stroke="#E05A2B" strokeOpacity="0.5" />
        {/* flicker on one burner — small fire signal */}
        <circle cx="380" cy="540" r="6" fill="#E05A2B">
          <animate attributeName="opacity" values="0.4;1;0.5;1" dur="1.2s" repeatCount="indefinite" />
        </circle>

        {/* upper cabinets */}
        <rect x="700" y="120" width="600" height="320" fill="#0a0605" stroke="#3A3430" />
        <line x1="1000" y1="120" x2="1000" y2="440" stroke="#3A3430" />

        {/* TV on right wall — we'll zoom INTO this */}
        <g transform="translate(1080, 220)">
          <rect width="220" height="130" rx="6" fill="#000" stroke="#443D39" />
          <rect x="10" y="10" width="200" height="110" fill="#0a0810" />
          {/* news ticker on TV */}
          <rect x="10" y="100" width="200" height="20" fill="#E05A2B" />
          <text x="20" y="115" fill="#fff" fontSize="11" fontFamily="DM Sans">LIVE · STUDIO 4</text>
          {/* host head silhouette */}
          <circle cx="80"  cy="60" r="18" fill="#1a1a1a" />
          <rect   x="55" y="78" width="50" height="22" fill="#1a1a1a" />
          {/* fake graphic */}
          <rect x="130" y="40" width="60" height="40" fill="#272220" />
          <rect x="135" y="45" width="50" height="6" fill="#E05A2B" opacity="0.7" />
          {/* blinking record light */}
          <circle cx="208" cy="20" r="3" fill="#E05A2B">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* The robot, 3D, sitting on the counter */}
      <div className="absolute left-[12%] sm:left-[20%] top-[35%] bottom-[15%] w-[40%] sm:w-[34%] z-10">
        <SceneCanvas cameraPosition={[0, 0.3, 4.2]} cameraFov={34}>
          <RobotModelDriven rotation={rotation} />
        </SceneCanvas>
      </div>

      {/* a thin ambient overlay so the robot reads against the kitchen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 30% 60%, transparent 0%, rgba(0,0,0,0.4) 70%)',
        }}
      />

      <ActCaption
        roman="II"
        title="The home"
        body="The same box. Now bolted to a kitchen wall, watching the stove a homeowner forgot to turn off. Local-first means: no cloud knows what's happening here — only the people on the tunneled link."
      />
    </div>
  );
}

// Helper that subscribes RobotModel to a motion value for rotation.
// We pass `.get` as a callback — the model polls it inside useFrame, so
// it reads the live, scroll-updated value on every frame.
function RobotModelDriven({ rotation }: { rotation: MotionValue<number> }) {
  return (
    <RobotModel
      spin={0}
      getRotationY={() => rotation.get()}
      y={-1.0}
      scale={1.0}
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// ACT III — Workshop. The Iron Man helmet emerges from the black hole.
// ────────────────────────────────────────────────────────────────────
function ActThree({ scale, rotation }: { scale: MotionValue<number>; rotation: MotionValue<number> }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Pure black void with deep ember ambient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 55%, rgba(224,90,43,0.18) 0%, rgba(224,90,43,0.05) 25%, transparent 55%), #000',
        }}
      />

      {/* Concentric expanding rings — a "stark industries" feel */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="absolute rounded-full border border-[var(--accent)]/20"
            style={{
              width:  `${(i + 1) * 280}px`,
              height: `${(i + 1) * 280}px`,
              animation: `pulse-ring ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* The 3D Iron Man helmet */}
      <div className="absolute inset-0">
        <SceneCanvas cameraPosition={[0, 0, 4]} cameraFov={30}>
          <IronManDriven scale={scale} rotation={rotation} />
        </SceneCanvas>
      </div>

      {/* a hint of holographic HUD frames on top */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 1400 800">
        <g stroke="#E05A2B" fill="none" strokeWidth="1">
          <path d="M 50 50 L 150 50 L 150 80" />
          <path d="M 1350 50 L 1250 50 L 1250 80" />
          <path d="M 50 750 L 150 750 L 150 720" />
          <path d="M 1350 750 L 1250 750 L 1250 720" />
          <text x="60" y="70" fill="#E05A2B" fontFamily="JetBrains Mono" fontSize="10" letterSpacing="2">SYS//R&amp;D</text>
          <text x="1260" y="70" fill="#E05A2B" fontFamily="JetBrains Mono" fontSize="10" letterSpacing="2">LOCAL//ONLY</text>
        </g>
      </svg>

      <ActCaption
        roman="III"
        title="The workshop"
        body="And one more: an R&D platform. Pipe in your sensors, run your training, evaluate your models. Your data never leaves your machine — only your ambition does."
      />

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%      { opacity: 0.05; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

function IronManDriven({ scale, rotation }: { scale: MotionValue<number>; rotation: MotionValue<number> }) {
  return (
    <IronManModel
      spin={0}
      getRotationY={() => rotation.get()}
      getScale={()    => scale.get() * 1.3}
      y={-0.4}
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// ActCaption — bottom-left text block, consistent across all 3 acts
// ────────────────────────────────────────────────────────────────────
function ActCaption({ roman, title, body }: { roman: string; title: string; body: string }) {
  return (
    <div className="absolute bottom-10 sm:bottom-14 left-5 sm:left-10 lg:left-16 max-w-md z-30">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-display text-3xl" style={{ color: 'var(--accent)' }}>{roman}</span>
        <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>ACT · {roman}</span>
      </div>
      <h3 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
        {title}
      </h3>
      <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
        {body}
      </p>
    </div>
  );
}

// Right-side scroll progress dots
function ActDot({
  label,
  progress,
  start,
  end,
}: {
  label: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const opacity = useTransform(progress, [start - 0.04, start, end, end + 0.04], [0.3, 1, 1, 0.3]);
  return (
    <motion.div style={{ opacity }} className="flex items-center gap-2 text-xs">
      <span className="font-mono-tag" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <span className="w-8 h-px" style={{ background: 'var(--accent)' }} />
    </motion.div>
  );
}
