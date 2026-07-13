import { lazy, Suspense } from 'react';

const HeroTicket = lazy(() =>
  import('@/features/public/components/landing/LandingMockups').then((m) => ({ default: m.HeroTicket })),
);

export const landingCta =
  'inline-flex h-12 items-center justify-center rounded-full bg-marigold px-8 py-3 text-base font-medium text-marigold-foreground shadow-[var(--shadow-e1)] transition-[transform,background-color,box-shadow] duration-[180ms] ease-[var(--ease-out)] hover:bg-coral hover:shadow-[0_0_24px_color-mix(in_srgb,var(--voltage-accent)_55%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2 focus-visible:ring-offset-stage';

const trustPoints = ['6.5% + $1.75 · buyer pays', 'Unlimited events', 'No monthly bill'];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-stage text-on-stage">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full max-h-[90vh] bg-cover bg-center opacity-70"
        style={{ backgroundImage: 'url(/hero.webp)' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stage/70 via-stage/60 to-stage" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-stage/85 via-stage/40 to-transparent" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-24 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-8 md:px-6 md:pb-28 md:pt-32">
        <div className="max-w-xl space-y-7">
          <p
            data-reveal
            className="inline-flex items-center gap-2 rounded-full border border-on-stage-soft/30 bg-stage/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.28em] text-voltage backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-voltage" /> Built in Chickasaw, Alabama
          </p>
          <h1 data-split className="font-display text-4xl font-medium leading-[1.15] text-on-stage md:text-5xl lg:text-6xl">
            The box office <em className="italic text-voltage">you&rsquo;d want</em> &mdash; for the person who sweeps the floor at 3 AM.
          </h1>
          <p data-reveal className="max-w-md text-base leading-relaxed text-on-stage-soft md:text-lg">
            Sell tickets and VIP tables under your own name. No monthly bill, no credit card to
            start. The buyer pays <strong className="text-on-stage">one honest fee</strong> at checkout
            &mdash; you keep every penny of your ticket price.
          </p>
          <div data-reveal className="flex flex-wrap items-center gap-4 pt-2">
            <a href="#start" data-magnet className={landingCta}>
              Start free &mdash; no credit card
            </a>
          </div>
          <ul data-reveal className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.15em] text-on-stage-soft">
            {trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div data-reveal className="flex justify-center md:justify-end">
          <Suspense fallback={<div className="w-full max-w-sm min-h-[280px]" />}>
            <HeroTicket />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
