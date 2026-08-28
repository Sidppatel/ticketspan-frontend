import { lazy, Suspense, useRef, useState } from 'react';
import { useLandingReveal } from '@/features/public/hooks/useLandingReveal';
import { LandingNav } from '@/features/public/components/landing/LandingNav';
import { LandingHero } from '@/features/public/components/landing/LandingHero';
import { PortalShowcase } from '@/features/public/components/landing/LandingShowcase';
import {
  FeatureBento,
  FounderNote,
  VenueMarquee,
  OperationalProof,
} from '@/features/public/components/landing/LandingSections';
import {
  PricingCalculator,
  PricingTeaser,
  TrustAndPolicies,
} from '@/features/public/components/landing/LandingPricing';
import { ClosingCta } from '@/features/public/components/landing/LandingClosing';
import '@/features/public/landing.css';

const LandingBackdrop = lazy(() =>
  import('@/features/public/components/landing/LandingBackdrop').then((m) => ({ default: m.LandingBackdrop })),
);

export function TenantLandingPage() {
  const scopeRef = useRef<HTMLDivElement>(null);
  useLandingReveal(scopeRef);
  const [backdrop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches
      : false,
  );

  return (
    <div ref={scopeRef} className="landing-ivory min-h-screen bg-(--lp-ivory) text-(--lp-ink) selection:bg-(--lp-green) selection:text-white">
      {backdrop ? (
        <Suspense fallback={null}>
          <LandingBackdrop />
        </Suspense>
      ) : null}
      <LandingNav />
      <main>
        <LandingHero />
        <VenueMarquee />
        <FeatureBento />
        <PricingCalculator />
        <PricingTeaser />
        <TrustAndPolicies />
        <PortalShowcase />
        <OperationalProof />
        <FounderNote />
        <ClosingCta />
      </main>
    </div>
  );
}
