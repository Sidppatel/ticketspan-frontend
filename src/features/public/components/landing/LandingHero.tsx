import { Link } from 'react-router-dom';
import { HeroTicket } from '@/features/public/components/landing/LandingMockups';

export const landingCta =
  'inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-[var(--shadow-e1)] transition-[transform,background-color] duration-[180ms] ease-[var(--ease-out)] hover:bg-brand-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2 focus-visible:ring-offset-stage';

export function LandingHero() {
  return (
    <section className="bg-stage text-on-stage">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-8 md:px-6 md:pb-24 md:pt-28">
        <div className="max-w-xl space-y-7">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage">Svyne · the box office</p>
          <h1 className="font-display text-5xl text-on-stage md:text-6xl lg:text-7xl">
            Sell the night.
            <br />
            Keep every dollar.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-on-stage-soft md:text-lg">
            Tickets and VIP tables for premium events, sold under your own brand. Free forever. Buyers
            cover the service fee: sell a <span className="font-mono text-on-stage">$50</span> ticket,
            receive <span className="font-mono text-on-stage">$50</span>.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/get-started" className={landingCta}>
              Start free
            </Link>
            <a
              href="#organizers"
              className="rounded-md px-2 py-3 text-base text-on-stage underline decoration-on-stage-soft underline-offset-4 transition-colors hover:decoration-voltage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
            >
              Browse events
            </a>
          </div>
          <p className="font-mono text-xs text-on-stage-soft">No credit card. No monthly bill. All sales final.</p>
        </div>
        <div className="flex justify-center md:justify-end">
          <HeroTicket />
        </div>
      </div>
    </section>
  );
}
