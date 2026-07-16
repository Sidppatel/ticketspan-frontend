import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatUsPhone } from '@/shared/lib/validation';
import {
  Accessibility,
  KeyRound,
  Palette,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { landingCta } from '@/features/public/components/landing/LandingHero';
const DashboardMock = lazy(() =>
  import('@/features/public/components/landing/LandingMockups').then((m) => ({ default: m.DashboardMock })),
);
const FloorPlanMock = lazy(() =>
  import('@/features/public/components/landing/LandingMockups').then((m) => ({ default: m.FloorPlanMock })),
);
const ScannerMock = lazy(() =>
  import('@/features/public/components/landing/LandingMockups').then((m) => ({ default: m.ScannerMock })),
);

function MockFallback() {
  return <div className="min-h-[320px] rounded-xl bg-stage/10" />;
}

const marqueeWords = ['clubs', 'theaters', 'supper clubs', 'rooftops', 'pop-ups', 'galleries', 'lounges'];

export function VenueMarquee() {
  const loop = [...marqueeWords, ...marqueeWords];
  return (
    <div className="overflow-hidden border-y border-hairline/40 bg-stage py-5 text-on-stage">
      <div className="ticketspan-marquee flex w-max items-center gap-8 font-display text-2xl italic text-on-stage-soft md:text-3xl">
        {loop.map((word, i) => (
          <span key={i} className="flex items-center gap-8">
            {word}
            <span className="text-voltage" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const steps = [
  {
    tag: '8 min avg',
    title: "Set up while your coffee's still hot",
    body: 'Pick a subdomain, upload your logo, choose your colors. Your box office is live before you finish the cup. No credit card, no "enter payment info to continue" trap. I hate those too.',
  },
  {
    tag: 'Floor-plan studio',
    title: 'Build the night',
    body: 'Draft the event, add ticket types from Early Bird to VIP, and lay out tables in the floor plan studio. Recurring and multi-day events included.',
  },
  {
    tag: 'Live at the door',
    title: 'Sell, scan, settle',
    body: 'Publish and share the link. Watch sales live, scan QR codes at the door with any phone, and export the roster and revenue when the lights come up.',
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="grid gap-6 md:grid-cols-[1fr_360px] md:items-end">
        <h2 data-split className="max-w-md font-display text-3xl text-ink md:text-4xl">
          Draft to on-sale <em className="italic text-brand">in one sitting.</em>
        </h2>
        <p data-reveal className="font-display text-base md:text-lg text-ink-soft leading-relaxed">
          Three honest steps. No sales call, no setup fee, no &ldquo;let&rsquo;s schedule a demo.&rdquo; You&rsquo;re ready when you&rsquo;re ready.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            data-reveal
            key={step.title}
            className="flex flex-col rounded-2xl border border-hairline bg-surface p-6 shadow-[var(--shadow-e1)]"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-sm text-ink-faint">0{i + 1}</span>
              <span className="rounded-full bg-highlight px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink">
                {step.tag}
              </span>
            </div>
            <h3 className="font-display text-xl text-ink">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FloorPlanShowcase() {
  return (
    <section id="floor-plan" className="scroll-mt-20 bg-stage text-on-stage">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
        <div className="space-y-5">
          <h2 data-split className="font-display text-3xl md:text-4xl">
            Your regulars know <em className="italic text-voltage">the good spots.</em>
          </h2>
          <p data-reveal className="max-w-md leading-relaxed text-on-stage-soft">
            Table T-4 by the railing, where the skyline hits. Now they can reserve it &mdash; and it
            holds for ten minutes while they pay, so nobody gets that awkward &ldquo;sorry, that
            seat&rsquo;s taken&rdquo; call from your host at 9:47 PM. Nobody should eat the cost of a
            double-booked table.
          </p>
          <ul data-reveal className="space-y-2 font-mono text-sm text-on-stage-soft">
            <li>Zoom, pan, undo, templates for big rooms</li>
            <li>Per-table pricing and seat counts</li>
            <li>Open-layout general admission too</li>
          </ul>
        </div>
        <div data-reveal>
          <Suspense fallback={<MockFallback />}>
            <FloorPlanMock />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

export function AdminShowcase() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
      <div className="md:order-2">
        <div className="space-y-5">
          <h2 data-split className="font-display text-3xl text-ink md:text-4xl">
            Watch it sell in <em className="italic text-brand">real time.</em>
          </h2>
          <p data-reveal className="max-w-md leading-relaxed text-ink-soft">
            Sales, revenue, and door counts update live. Export attendees and financials to CSV or
            XLSX whenever you like. Sales tax is calculated at checkout and reported for you,
            remitted by the platform or by you, your choice. I spent five years in business
            intelligence &mdash; your numbers should be this clear.
          </p>
          <ul data-reveal className="space-y-2 font-mono text-sm text-ink-soft">
            <li>Revenue is your ticket price, never fee-diluted</li>
            <li>Per-event tax report, always current</li>
            <li>Check-in audit trail for every scan</li>
          </ul>
        </div>
      </div>
      <div data-reveal className="md:order-1">
        <Suspense fallback={<MockFallback />}>
          <DashboardMock />
        </Suspense>
      </div>
    </section>
  );
}

export function EventNightShowcase() {
  return (
    <section className="border-y border-hairline bg-surface-sunken">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
        <div className="space-y-5">
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">Door scan</p>
          <h2 data-split className="font-display text-3xl text-ink md:text-4xl">
            Your door person has <em className="italic text-brand">one hand free</em> and it&rsquo;s dark.
          </h2>
          <p data-reveal className="max-w-md leading-relaxed text-ink-soft">
            Open a link, point the camera, get a big green GO or red STOP. That&rsquo;s it. No app
            store, no login dance, no squinting at a screen while holding a tray of drinks. The tool
            should disappear so the person can do their job.
          </p>
          <ul data-reveal className="space-y-2 font-mono text-sm text-ink-soft">
            <li>Roster search when a phone dies</li>
            <li>Live in-count against capacity</li>
            <li>Guests claim invited seats with their own QR</li>
          </ul>
        </div>
        <div data-reveal className="relative">
          <Suspense fallback={<MockFallback />}>
            <ScannerMock />
          </Suspense>
          <span className="absolute -left-2 top-6 rounded-full bg-surface px-3 py-1.5 font-mono text-xs text-ink shadow-[var(--shadow-e1)]">
            no app store · just a link
          </span>
          <span className="absolute -right-1 bottom-10 rounded-full bg-brand px-3 py-1.5 font-mono text-xs text-brand-ink shadow-[var(--shadow-e1)]">
            magic-link in 15 min
          </span>
        </div>
      </div>
    </section>
  );
}

function MagicLinkPreview() {
  return (
    <div className="mt-auto border-t border-hairline/60 pt-4 space-y-3 font-mono text-xs text-ink-soft select-none">
      <div className="flex items-center justify-between">
        <span>From: noreply@ticketspan.com</span>
        <span className="bg-brand/10 text-brand px-2 py-0.5 rounded font-sans font-semibold text-xs">Active</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">Sign in link</span>
        <span className="text-brand font-bold tabular-nums animate-pulse">Expires in 15m</span>
      </div>
      <div className="flex justify-center">
        <div className="rounded bg-brand hover:bg-brand-hover px-4 py-1.5 font-sans text-xs font-semibold text-white transition-colors duration-200">
          Confirm Sign In
        </div>
      </div>
    </div>
  );
}

function GroupBookingPreview() {
  return (
    <div className="mt-auto border-t border-hairline/60 pt-4 space-y-2 text-xs text-ink-soft select-none">
      <div className="flex items-center justify-between font-mono">
        <span>Table 12</span>
        <span className="font-semibold text-ink">3 of 4 Claimed</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Alex Carter (Host)</span>
          <span className="font-mono text-success font-semibold">Confirmed</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Sarah Jenkins</span>
          <span className="font-mono text-success font-semibold">Confirmed</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Jordan Reed</span>
          <span className="font-mono text-success font-semibold">Confirmed</span>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <span className="italic text-ink-faint">Invite pending...</span>
          <span className="font-mono text-amber font-semibold">Sent</span>
        </div>
      </div>
    </div>
  );
}

function BrandingPreview() {
  return (
    <div className="mt-auto border-t border-hairline/60 pt-4 flex justify-between items-center text-xs select-none">
      <span className="font-mono text-ink-soft">Contrast Check</span>
      <div className="flex gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface cursor-pointer shadow-xs transition-transform hover:scale-110">
          <div className="h-4 w-4 rounded-full bg-accent-gold" />
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface cursor-pointer shadow-xs transition-transform hover:scale-110">
          <div className="h-4 w-4 rounded-full bg-brand" />
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface cursor-pointer shadow-xs transition-transform hover:scale-110">
          <div className="h-4 w-4 rounded-full bg-success" />
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface cursor-pointer shadow-xs transition-transform hover:scale-110">
          <div className="h-4 w-4 rounded-full bg-destructive" />
        </div>
      </div>
    </div>
  );
}

function LineupPreview() {
  return (
    <div className="mt-auto border-t border-hairline/60 pt-4 grid grid-cols-2 gap-3 text-xs select-none">
      <div className="flex items-center gap-2.5 transition-transform hover:scale-102">
        <div className="h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center font-bold text-brand text-xs">DJ</div>
        <div>
          <p className="font-semibold text-ink">DJ Solar</p>
          <p className="font-mono font-semibold uppercase text-success text-xs">Headliner</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 transition-transform hover:scale-102">
        <div className="h-7 w-7 rounded-full bg-amber/10 flex items-center justify-center font-bold text-voltage-ink text-xs">MC</div>
        <div>
          <p className="font-semibold text-ink">MC Nova</p>
          <p className="font-mono font-semibold uppercase text-ink-faint text-xs">Guest</p>
        </div>
      </div>
    </div>
  );
}

function SeoPreview() {
  return (
    <div className="mt-auto border-t border-hairline/60 pt-4 text-xs text-ink-soft space-y-1.5 select-none leading-relaxed">
      <div className="flex items-center gap-1 font-mono text-ink-faint">
        <span>ticketspan.com</span>
        <span>›</span>
        <span>e</span>
        <span>›</span>
        <span className="text-brand">summer-solstice</span>
      </div>
      <p className="font-semibold text-brand hover:underline cursor-pointer">
        Summer Solstice 2026
      </p>
      <p className="text-ink-soft">
        Rooftop terrace, live performers, and table bookings. Live check-in starts at 9 PM.
      </p>
    </div>
  );
}

function AccessibilityPreview() {
  return (
    <div className="mt-auto border-t border-hairline/60 pt-4 flex justify-between items-center text-xs select-none">
      <div className="flex items-center gap-2">
        <span className="font-mono text-ink-soft">Reduced Motion</span>
        <div className="h-4.5 w-8 rounded-full bg-success/20 p-0.5 transition-colors cursor-pointer flex justify-end">
          <div className="h-3.5 w-3.5 rounded-full bg-success" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-ink-soft">Font Scale</span>
        <div className="flex gap-1 bg-surface rounded border border-hairline/60 p-0.5">
          <span className="px-1.5 py-0.5 text-xs rounded hover:bg-surface-sunken font-bold">A</span>
          <span className="px-1.5 py-0.5 text-xs rounded bg-surface-sunken font-bold border border-hairline/30">A</span>
          <span className="px-1.5 py-0.5 text-xs rounded hover:bg-surface-sunken font-bold">A</span>
        </div>
      </div>
    </div>
  );
}

const ledger = [
  {
    icon: KeyRound,
    term: 'No passwords to forget at 11 PM',
    detail: 'Magic links that expire in 15 minutes. Because nobody wants to reset a password in a line that wraps around the block.',
    span: 'md:col-span-2',
    preview: <MagicLinkPreview />,
    mono: true,
  },
  {
    icon: Users,
    term: 'Group bookings',
    detail: 'Buy the table, invite guests by email, each claims their own ticket.',
    span: 'md:col-span-1',
    preview: <GroupBookingPreview />,
    mono: false,
  },
  {
    icon: Palette,
    term: 'Your brand everywhere',
    detail: 'Branding studio with presets, live preview, and contrast checks.',
    span: 'md:col-span-1',
    preview: <BrandingPreview />,
    mono: false,
  },
  {
    icon: Star,
    term: 'Performers and sponsors',
    detail: 'Profile pages that make your lineup look booked-out.',
    span: 'md:col-span-2',
    preview: <LineupPreview />,
    mono: false,
  },
  {
    icon: Search,
    term: 'SEO event pages',
    detail: 'Clean slugs and structured data, indexed the day you publish.',
    span: 'md:col-span-1',
    preview: <SeoPreview />,
    mono: true,
  },
  {
    icon: Accessibility,
    term: 'Accessible by default',
    detail: 'Designed for everyone, with a smooth experience on any device.',
    span: 'md:col-span-2',
    preview: <AccessibilityPreview />,
    mono: false,
  },
] as const;

export function FeatureLedger() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
      <div className="space-y-3">
        <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">Features</p>
        <h2 data-split className="font-display text-3xl text-ink md:text-5xl">
          Small details, <em className="italic text-brand">big nights.</em>
        </h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {ledger.map((item) => {
          const Icon = item.icon;
          return (
            <div
              data-reveal
              key={item.term}
              className={`flex flex-col justify-between h-full rounded-2xl bg-surface border border-hairline p-6 shadow-xs hover:shadow-md transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01] group ${item.span}`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/5 border border-brand/10 text-brand group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">{item.term}</h3>
                </div>
                <p className={`leading-relaxed text-ink-soft max-w-[46ch] ${item.mono ? 'font-mono text-xs' : 'text-sm'}`}>
                  {item.detail}
                </p>
              </div>
              {item.preview}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FounderNote() {
  return (
    <section id="founder" className="scroll-mt-20 border-y border-hairline bg-surface-sunken">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-16 md:px-6 md:py-24">
        <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">Founder</p>
        <h2 data-split className="font-display text-3xl text-ink md:text-4xl">
          The person who sweeps the floor at 3 AM <em className="italic text-brand">should keep the money.</em>
        </h2>
        <div data-reveal className="max-w-[65ch] space-y-4 leading-relaxed text-ink-soft [text-wrap:pretty]">
          <p>
            I spent five years in business intelligence watching how enterprise software companies
            price their products. They charge what the market will bear, not what the product costs
            to deliver. When I looked at ticketing platforms through that same lens, the margins were
            absurd: twenty to thirty percent for infrastructure that costs pennies per transaction. A
            venue selling $3,000 in tickets might lose $800 before they ever see a dime.
          </p>
          <p>
            I built TicketSpan because I think the person who books the DJ, hires the security, and sweeps
            the floor at 3 AM should keep the money their guests paid. Not a platform that puts their
            logo on your door and calls it a partnership.
          </p>
          <p>
            One honest caveat: TicketSpan is built for venues that sell their own tickets &mdash;
            promoters, clubs, rooftops, theaters, pop-ups. If you&rsquo;re reselling a 20,000-seat
            arena tour, we&rsquo;re probably not your fit yet. I&rsquo;d rather be great for 500
            venues than mediocre for 50,000.
          </p>
        </div>
        <p data-reveal className="font-display text-2xl italic text-ink">&mdash; Siddh Patel, Chickasaw, AL</p>
      </div>
    </section>
  );
}

const tiers = [
  {
    name: 'Free forever',
    price: '$0',
    unit: '/mo',
    fee: '6.5% + $1.75',
    feeNote: 'buyer pays at checkout',
    featured: false,
    cta: 'Start free',
    points: [
      'Unlimited events, ticket types, staff',
      'Your own subdomain with SSL',
      'Ticket count and revenue, live',
      'No credit card, cancel anytime',
    ],
  },
  {
    name: 'Pay per event',
    price: 'from $25',
    unit: '/event',
    fee: 'from 6.0% + $1.50',
    feeNote: 'lower buyer fee, that event only',
    featured: true,
    cta: 'Choose per event',
    points: [
      'Advanced analytics for one event',
      'No subscription, buy when you need it',
      'Scales to $199: white-label + SMS',
      'Perfect for a gala or seasonal run',
    ],
  },
  {
    name: 'Subscription',
    price: 'Custom',
    unit: '',
    fee: 'Lowest fees, tailored',
    feeNote: 'priced to your volume',
    featured: false,
    cta: 'Talk to me',
    points: [
      'Advanced analytics every month',
      'Custom domains and SMS credits',
      'Extra managers, priority support',
      'Cancel any month, no contract',
    ],
  },
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-stage text-on-stage">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl space-y-4">
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage">Pricing</p>
          <h2 data-split className="font-display text-3xl md:text-4xl">
            Start free. <em className="italic text-voltage">Pay only when you sell.</em>
          </h2>
          <p data-reveal className="font-display text-base md:text-lg leading-relaxed text-on-stage-soft">
            One service fee, added at checkout and paid by the buyer &mdash; you always receive your
            full ticket price. Want lower fees and analytics? Unlock them per event or by subscription.
            No fees buried under &ldquo;processing&rdquo; and &ldquo;convenience.&rdquo;
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              data-reveal
              key={tier.name}
              className={
                tier.featured
                  ? 'flex flex-col rounded-2xl bg-marigold p-7 text-marigold-foreground shadow-[var(--shadow-e2)]'
                  : 'flex flex-col rounded-2xl border border-on-stage-soft/20 bg-stage-elevated p-7'
              }
            >
              <h3 className="font-display text-xl">{tier.name}</h3>
              <p className="mt-4 font-display text-4xl">
                {tier.price}
                <span className="font-mono text-sm opacity-70">{tier.unit}</span>
              </p>
              <div className={`mt-3 border-t pt-3 ${tier.featured ? 'border-marigold-foreground/25' : 'border-on-stage-soft/20'}`}>
                <p className="font-mono text-sm">{tier.fee}</p>
                <p className={`font-mono text-[11px] ${tier.featured ? 'opacity-70' : 'text-on-stage-soft'}`}>{tier.feeNote}</p>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {tier.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className={tier.featured ? '' : 'text-voltage'}>✓</span>
                    <span className={tier.featured ? '' : 'text-on-stage-soft'}>{point}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#start"
                className={
                  tier.featured
                    ? 'mt-7 flex h-11 items-center justify-center rounded-full bg-stage px-6 text-sm font-medium text-on-stage transition-transform hover:scale-[1.02] active:scale-[0.98]'
                    : 'mt-7 flex h-11 items-center justify-center rounded-full bg-surface px-6 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-[0.98]'
                }
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
        <div data-reveal className="mt-8 flex flex-col gap-4 rounded-2xl border border-on-stage-soft/20 bg-stage-elevated p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-voltage">You keep 100%</p>
            <p className="mt-1 text-on-stage-soft">Sell a $50 ticket, receive $50. The buyer pays the fee, never you.</p>
          </div>
          <div className="flex shrink-0 items-center gap-6 font-mono text-sm">
            <span className="text-on-stage-soft">$50 ticket</span>
            <span aria-hidden className="text-on-stage-soft">&rarr;</span>
            <span className="text-on-stage-soft">buyer pays $55.32</span>
            <span aria-hidden className="text-on-stage-soft">&rarr;</span>
            <span className="text-voltage">you get $50.00</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const closingPills = ['No credit card', 'Cancel anytime', 'Real human replies'];
const formFields = [
  { name: 'name', label: 'Your name', placeholder: 'Amara Okonkwo', type: 'text', half: false },
  { name: 'email', label: 'Email', placeholder: 'amara@skylineterrace.com', type: 'email', half: true },
  { name: 'phone', label: 'Phone', placeholder: '+1 (251) 555-0142', type: 'tel', half: true },
  { name: 'venue', label: 'Venue name', placeholder: 'Skyline Terrace', type: 'text', half: true },
  { name: 'city', label: 'City', placeholder: 'Mobile, AL', type: 'text', half: true },
] as const;

type LeadForm = { name: string; email: string; phone: string; venue: string; city: string };
const emptyForm: LeadForm = { name: '', email: '', phone: '', venue: '', city: '' };

export function ClosingCta() {
  const [values, setValues] = useState<LeadForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = values.name.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    const venue = values.venue.trim();
    const city = values.city.trim();
    if (!name) {
      setError('Add your name so I know who I’m talking to.');
      return;
    }
    if (!email && !phone) {
      setError('Add an email or a phone number so I can reach you.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { createPlatformLead } = await import('@/features/public/services/platformLeadService');
      await createPlatformLead({
        name,
        companyName: venue || name,
        phone: phone || email,
        website: '',
        description: `Landing form.${email ? ` Email: ${email}` : ''}${phone ? ` · Phone: ${phone}` : ''}${city ? ` · City: ${city}` : ''}${venue ? ` · Venue: ${venue}` : ''}`,
      });
      setSent(true);
    } catch (caught) {
      const { rpcErrorMessage } = await import('@/shared/session');
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="start" className="scroll-mt-24 bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-stage px-6 py-14 text-on-stage md:px-14 md:py-20">
        <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage">Open a TicketSpan box office</p>
        <h2 data-split className="mt-4 max-w-2xl font-display text-3xl md:text-4xl lg:text-5xl">
          Draft your first night <em className="italic text-voltage">before your coffee gets cold.</em>
        </h2>
        <p data-reveal className="mt-4 max-w-md font-display text-base md:text-lg leading-relaxed text-on-stage-soft">
          Tell me about your venue. I read every one of these personally and I&rsquo;ll get you a
          link to your box office within a day.
        </p>
        <ul data-reveal className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-on-stage-soft">
          {closingPills.map((pill) => (
            <li key={pill}>· {pill}</li>
          ))}
        </ul>
        {sent ? (
          <div data-reveal className="mt-10 rounded-2xl border border-voltage/40 bg-stage-elevated p-8">
            <p className="font-display text-2xl text-on-stage">Thank you for your message.</p>
            <p className="mt-2 text-on-stage-soft">We&rsquo;ll get back with you soon.</p>
          </div>
        ) : (
          <form data-reveal onSubmit={submit} className="mt-10 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {formFields.map((field) => (
                <label key={field.name} className={field.half ? '' : 'sm:col-span-2'}>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-stage-soft">{field.label}</span>
                  <input
                    type={field.type}
                    name={field.name}
                    value={values[field.name]}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.name]: field.name === 'phone' ? formatUsPhone(e.target.value) : e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="mt-2 w-full border-b border-on-stage-soft/30 bg-transparent pb-2 text-on-stage placeholder:text-on-stage-soft/50 focus:border-voltage focus:outline-none"
                  />
                </label>
              ))}
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <button type="submit" disabled={submitting} className={`${landingCta} w-full disabled:opacity-60`}>
              {submitting ? 'Sending…' : 'Open my box office →'}
            </button>
          </form>
        )}
        <p data-reveal className="mt-6 font-display text-xl italic text-on-stage-soft">&mdash; Siddh Patel, Chickasaw, AL</p>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint">
        <Link to="/terms" className="hover:text-ink">Terms</Link>
        <Link to="/privacy" className="hover:text-ink">Privacy</Link>
        <Link to="/refund-policy" className="hover:text-ink">Refund policy</Link>
        <Link to="/help" className="hover:text-ink">Help center</Link>
        <Link to="/contact" className="hover:text-ink">Contact</Link>
        <span className="w-full font-mono sm:ml-auto sm:w-auto">All sales final.</span>
      </div>
    </section>
  );
}
