'use client';

/**
 * ContactSection — the closing beat. The Mux video plays as a soft glow
 * at center, with the closing CTA on top.
 *
 * HLS handling:
 *   - Safari plays .m3u8 natively → just set src.
 *   - Chromium/Firefox need hls.js. We dynamically load it from a CDN
 *     so the rest of the bundle stays lean (no new npm dep).
 *
 * The video is muted + autoplays + loops (required for mobile autoplay).
 * If hls.js fails to load (offline, CSP), we degrade gracefully to the
 * gradient background — nothing breaks.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Flame } from 'lucide-react';
import Link from 'next/link';

const MUX_HLS = 'https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8';
const CDN_HLS = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { Hls?: any }
}

export default function ContactSection() {
  const videoRef       = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cleanup: (() => void) | null = null;

    // Path A: native HLS (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = MUX_HLS;
      video.play().catch(() => { /* autoplay blocked is fine */ });
      const onLoaded = () => setReady(true);
      video.addEventListener('loadeddata', onLoaded);
      cleanup = () => video.removeEventListener('loadeddata', onLoaded);
      return cleanup;
    }

    // Path B: dynamic-load hls.js for everyone else
    let hls: { destroy: () => void } | null = null;

    const attach = () => {
      const Hls = window.Hls;
      if (!Hls || !Hls.isSupported() || !video) return;
      const inst = new Hls({ enableWorker: true, lowLatencyMode: false });
      inst.loadSource(MUX_HLS);
      inst.attachMedia(video);
      inst.on(Hls.Events.MANIFEST_PARSED, () => {
        setReady(true);
        video.play().catch(() => { /* ignored */ });
      });
      hls = inst;
    };

    // Check if hls.js was already loaded earlier on the page
    if (window.Hls) {
      attach();
    } else {
      const existing = document.querySelector(`script[src="${CDN_HLS}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', attach, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = CDN_HLS;
        script.async = true;
        script.onload = attach;
        document.head.appendChild(script);
      }
    }

    cleanup = () => { hls?.destroy(); };
    return cleanup;
  }, []);

  return (
    <section id="contact" className="stage relative py-32 lg:py-48 overflow-hidden">
      {/* Full-bleed video — clipped to an oval, blurred & dimmed so it
          reads as a glow, not as a literal video. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative w-[140%] sm:w-[110%] lg:w-[85%] aspect-[16/9] -mt-12"
          style={{
            transform: 'translateY(0)',
            opacity: ready ? 0.55 : 0,
            transition: 'opacity 1.2s ease',
            filter: 'blur(28px) saturate(1.4)',
            maskImage:         'radial-gradient(ellipse at center, black 0%, black 35%, transparent 75%)',
            WebkitMaskImage:   'radial-gradient(ellipse at center, black 0%, black 35%, transparent 75%)',
          }}
        >
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Color wash over the video so it picks up the brand tone */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(224,90,43,0.22) 0%, rgba(224,90,43,0.04) 30%, transparent 60%), #0B0907',
          mixBlendMode: 'normal',
        }}
      />

      {/* Concentric rings — anchor the center where the video sits */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width:  `${(i + 1) * 360}px`,
              height: `${(i + 1) * 360}px`,
              borderColor: `rgba(224, 90, 43, ${0.18 - i * 0.05})`,
              animation: `pulseRingC ${5 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Grain on top */}
      <div className="film-grain" />

      {/* Foreground content */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(14px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full ember-pulse" style={{ background: 'var(--accent)' }} />
            <span className="font-mono-tag" style={{ color: 'var(--text-secondary)' }}>
              05 · End of the reel
            </span>
          </div>

          <h2 className="text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.95]" style={{ letterSpacing: '-0.04em' }}>
            Let&apos;s build something
            <br />
            <span className="font-display" style={{ color: 'var(--accent)' }}>that doesn&apos;t burn.</span>
          </h2>

          <p className="mt-7 max-w-xl mx-auto text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Whether you&apos;re a fire department, a hardware tinkerer, or a researcher
            looking for a deployment platform — we&apos;d like to hear from you.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-sm font-medium hover:translate-x-[2px] transition-transform"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 0 32px var(--accent-glow), 0 0 80px rgba(224,90,43,0.18)',
            }}
          >
            <Flame size={15} />
            Enter Command Center
            <ArrowRight size={15} />
          </Link>

          <a
            href="mailto:hello@firectrl.io"
            className="liquid-glass inline-flex items-center gap-2 px-7 py-4 rounded-full text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            <Mail size={15} />
            hello@firectrl.io
          </a>
        </motion.div>

        {/* Three small reassurance pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono-tag"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>Reply within 24h</span>
          <span className="hidden sm:inline">·</span>
          <span>NDA-friendly</span>
          <span className="hidden sm:inline">·</span>
          <span>Open to OSS partners</span>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulseRingC {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%      { opacity: 0.05; transform: scale(1.06); }
        }
      `}</style>
    </section>
  );
}
