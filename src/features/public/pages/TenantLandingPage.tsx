import { lazy, Suspense, useRef, useState } from 'react';
import { useLandingReveal } from '@/features/public/hooks/useLandingReveal';

const LandingBackdrop = lazy(() =>
  import('@/features/public/components/landing/LandingBackdrop').then((m) => ({ default: m.LandingBackdrop })),
);
import { LandingNav } from '@/features/public/components/landing/LandingNav';
import { LandingHero } from '@/features/public/components/landing/LandingHero';
import { PortalShowcase } from '@/features/public/components/landing/LandingShowcase';
import {
  AdminShowcase,
  EventNightShowcase,
  FeatureProgramme,
  FloorPlanShowcase,
  FounderNote,
  HowItWorks,
  VenueMarquee,
  OperationalProof,
} from '@/features/public/components/landing/LandingSections';
import { PricingTeaser, TrustAndPolicies } from '@/features/public/components/landing/LandingPricing';
import { ClosingCta } from '@/features/public/components/landing/LandingClosing';
import '@/features/public/landing.css';

export function TenantLandingPage() {
  const scopeRef = useRef<HTMLDivElement>(null);
  useLandingReveal(scopeRef);
  const [backdrop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches
      : false,
  );
  return (
    <div ref={scopeRef} className="landing-ivory">
      {backdrop ? (
        <Suspense fallback={null}>
          <LandingBackdrop />
        </Suspense>
      ) : null}
      <LandingNav />
      <LandingHero />
      <VenueMarquee />
      <PortalShowcase />
      <div className="cv-auto">
        <HowItWorks />
        <FloorPlanShowcase />
        <AdminShowcase />
        <EventNightShowcase />
        <FeatureProgramme />
        <OperationalProof />
        <FounderNote />
        <PricingTeaser />
        <TrustAndPolicies />
        <ClosingCta />
      </div>
    </div>
  );
}
