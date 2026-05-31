import LandingNav      from '@/components/landing/Nav';
import CoverageSequence from '@/components/landing/sections/CoverageSequence';
import AnywhereSection  from '@/components/landing/sections/AnywhereSection';
import PlatformSection  from '@/components/landing/sections/PlatformSection';
import ModesGallery     from '@/components/landing/sections/ModesGallery';
import ContactSection   from '@/components/landing/sections/ContactSection';
import Footer           from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="smooth-scroll" style={{ background: '#0B0907' }}>
      <LandingNav />
      <CoverageSequence />
      <AnywhereSection />
      <PlatformSection />
      <ModesGallery />
      <ContactSection />
      <Footer />
    </main>
  );
}