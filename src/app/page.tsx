'use client';

/**
 * The marketing landing page. Server-rendered as a client component so
 * that the 3D scenes and scroll-driven motion work end-to-end. (None of
 * the 3D pieces SSR cleanly — they're lazy-loaded inside their sections.)
 *
 * Composition (top → bottom):
 *   <LandingNav />             Sticky liquid-glass nav
 *   <CinematicHero />          One-viewport hero, robot rotating
 *   <AnywhereSection />        Plug-and-play premise (4 context cards)
 *   <StorySection />           Scroll-driven 3-act cinematic
 *   <PlatformSection />        Embedded / Backend / Frontend + the Pi
 *   <ModesGallery />           Tilted-card operation modes
 *   <ContactSection />         Closing CTA with Mux video glow
 *   <Footer />                 Quiet credits row
 */

import LandingNav      from '@/components/landing/Nav';
import CinematicHero    from '@/components/landing/sections/CinematicHero';
import CoverageSequence from '@/components/landing/sections/CoverageSequence';
import AnywhereSection  from '@/components/landing/sections/AnywhereSection';
import StorySection    from '@/components/landing/sections/StorySection';
import PlatformSection from '@/components/landing/sections/PlatformSection';
import ModesGallery    from '@/components/landing/sections/ModesGallery';
import ContactSection  from '@/components/landing/sections/ContactSection';
import Footer          from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="smooth-scroll" style={{ background: '#0B0907' }}>
      <LandingNav />
      <CinematicHero />
      <CoverageSequence />
      <AnywhereSection />
      <StorySection />
      <PlatformSection />
      <ModesGallery />
      <ContactSection />
      <Footer />
    </main>
  );
}