import { Link } from 'react-router-dom';
import { landingCta } from '@/features/public/components/landing/LandingHero';
import { DashboardMock, FloorPlanMock, ScannerMock } from '@/features/public/components/landing/LandingMockups';

const steps = [
  {
    number: '01',
    title: 'Claim your box office',
    body: 'Sign up and yourname.svyne.com is live with SSL, your logo, and your seven brand colors. No credit card, no trial clock.',
  },
  {
    number: '02',
    title: 'Build the night',
    body: 'Draft the event, add ticket types from Early Bird to VIP, and lay out tables in the floor plan studio. Recurring and multi-day events included.',
  },
  {
    number: '03',
    title: 'Sell, scan, settle',
    body: 'Publish and share the link. Watch sales live, scan QR codes at the door with any phone, and export the roster and revenue when the lights come up.',
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <h2 className="max-w-md font-display text-3xl text-ink md:text-4xl">Draft to on-sale in one sitting</h2>
      <div className="mt-10 divide-y divide-hairline border-y border-hairline">
        {steps.map((step) => (
          <div key={step.number} className="grid gap-2 py-6 md:grid-cols-[80px_240px_1fr] md:gap-8 md:py-8">
            <p className="font-mono text-sm text-voltage-ink">{step.number}</p>
            <h3 className="font-display text-xl text-ink">{step.title}</h3>
            <p className="max-w-xl text-sm leading-relaxed text-ink-soft md:text-base">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FloorPlanShowcase() {
  return (
    <section className="bg-stage text-on-stage">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
        <div className="space-y-5">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage">VIP tables</p>
          <h2 className="font-display text-3xl md:text-4xl">They pick the exact table</h2>
          <p className="max-w-md leading-relaxed text-on-stage-soft">
            You drag round and square tables onto the floor in the studio. Attendees tap the one they
            want and it holds for ten minutes while they pay, so nobody double-books seat one at table
            four. The layout locks itself the moment the first ticket sells.
          </p>
          <ul className="space-y-2 font-mono text-sm text-on-stage-soft">
            <li>Zoom, pan, undo, templates for big rooms</li>
            <li>Per-table pricing and seat counts</li>
            <li>Open-layout general admission too</li>
          </ul>
        </div>
        <FloorPlanMock />
      </div>
    </section>
  );
}

export function AdminShowcase() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
      <div className="md:order-2">
        <div className="space-y-5">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">The console</p>
          <h2 className="font-display text-3xl text-ink md:text-4xl">Watch it sell in real time</h2>
          <p className="max-w-md leading-relaxed text-ink-soft">
            Sales, revenue, and door counts update live. Export attendees and financials to CSV or
            XLSX whenever you like. Sales tax is calculated at checkout and reported for you,
            remitted by the platform or by you, your choice.
          </p>
          <ul className="space-y-2 font-mono text-sm text-ink-soft">
            <li>Revenue is your ticket price, never fee-diluted</li>
            <li>Per-event tax report, always current</li>
            <li>Check-in audit trail for every scan</li>
          </ul>
        </div>
      </div>
      <div className="md:order-1">
        <DashboardMock />
      </div>
    </section>
  );
}

export function EventNightShowcase() {
  return (
    <section className="border-y border-hairline bg-surface-sunken">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
        <div className="space-y-5">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">Event night</p>
          <h2 className="font-display text-3xl text-ink md:text-4xl">The line keeps moving</h2>
          <p className="max-w-md leading-relaxed text-ink-soft">
            Any phone becomes a scanner. Staff see a full-screen color verdict with the guest's table
            label, readable in the dark at arm's length. No app store, no hardware, and staff
            accounts are unlimited and free.
          </p>
          <ul className="space-y-2 font-mono text-sm text-ink-soft">
            <li>Roster search when a phone dies</li>
            <li>Live in-count against capacity</li>
            <li>Guests claim invited seats with their own QR</li>
          </ul>
        </div>
        <ScannerMock />
      </div>
    </section>
  );
}

const ledger = [
  ['Passwordless entry', 'Magic links that expire in 15 minutes. No passwords to leak.'],
  ['Group bookings', 'Buy the table, invite guests by email, each claims their own ticket.'],
  ['Your brand everywhere', 'Branding studio with presets, live preview, and contrast checks.'],
  ['ACH at checkout', 'Bank payment swaps the card fee for 2%. Buyers see the saving.'],
  ['SEO event pages', 'Clean slugs and structured data, indexed the day you publish.'],
  ['Performers and sponsors', 'Profile pages that make your lineup look booked-out.'],
  ['Accessible by default', 'WCAG AA on the purchase path, reduced motion respected.'],
  ['No refund admin', 'All sales final, disclosed at checkout, in the footer, in the email.'],
];

export function FeatureLedger() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <h2 className="font-display text-3xl text-ink md:text-4xl">Also in the building</h2>
      <dl className="mt-10 grid gap-x-16 md:grid-cols-2">
        {ledger.map(([term, detail]) => (
          <div key={term} className="flex gap-6 border-b border-hairline py-5">
            <dt className="w-40 shrink-0 font-mono text-sm text-ink">{term}</dt>
            <dd className="m-0 text-sm leading-relaxed text-ink-soft">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PricingTeaser() {
  return (
    <section className="bg-stage text-on-stage">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_minmax(320px,420px)] md:gap-16">
          <div className="space-y-5">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage">Pricing</p>
            <h2 className="font-display text-3xl md:text-4xl">Free forever. The buyer pays the fee.</h2>
            <p className="max-w-md leading-relaxed text-on-stage-soft">
              Unlimited events, ticket types, and staff on the free plan. A service fee of 6.5% +
              $1.75 is added at checkout and paid by the buyer. Running a big night? Pay Per Event
              from $25 unlocks lower fees and full analytics for that event only. Regulars subscribe
              from $49 a month.
            </p>
            <div className="pt-2">
              <Link to="/get-started" className={landingCta}>
                Start free
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl bg-surface text-ink shadow-[var(--shadow-e2)]">
            <div className="space-y-3 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">The math on a $50 ticket</p>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-ink-soft">Ticket price</span>
                <span>$50.00</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-ink-soft">Service fee, buyer pays</span>
                <span>$5.00</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-3 font-mono text-sm">
                <span className="text-ink-soft">Buyer total</span>
                <span>$55.00</span>
              </div>
            </div>
            <div className="svyne-ticket-edge" style={{ ['--svyne-notch' as string]: 'var(--stage)' }} />
            <div className="flex items-center justify-between p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">You receive</p>
              <p className="font-mono text-2xl text-voltage-ink">$50.00</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-6 md:py-20">
        <div>
          <h2 className="font-display text-3xl text-ink md:text-4xl">Your next event is on the house</h2>
          <p className="mt-2 text-ink-soft">Set up tonight. Sell by tomorrow.</p>
        </div>
        <Link to="/get-started" className={landingCta}>
          Start free
        </Link>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-xs text-ink-faint md:px-6">
          <Link to="/terms" className="hover:text-ink">Terms</Link>
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          <Link to="/refund-policy" className="hover:text-ink">Refund policy</Link>
          <Link to="/help" className="hover:text-ink">Help center</Link>
          <Link to="/contact" className="hover:text-ink">Contact</Link>
          <span className="ml-auto font-mono">All sales final.</span>
        </div>
      </div>
    </section>
  );
}
