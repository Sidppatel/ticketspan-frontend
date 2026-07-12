import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  Accessibility,
  KeyRound,
  Landmark,
  Palette,
  Search,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { landingCta } from '@/features/public/components/landing/LandingHero';
import { DashboardMock, FloorPlanMock, ScannerMock } from '@/features/public/components/landing/LandingMockups';

const marqueeWords = ['clubs', 'theaters', 'supper clubs', 'rooftops', 'pop-ups', 'galleries', 'lounges'];

export function VenueMarquee() {
  const loop = [...marqueeWords, ...marqueeWords];
  return (
    <div className="overflow-hidden border-y border-hairline/40 bg-stage py-5 text-on-stage">
      <div className="svyne-marquee flex w-max items-center gap-8 font-display text-2xl italic text-on-stage-soft md:text-3xl">
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
        <p data-reveal className="text-ink-soft">
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
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage">VIP tables</p>
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
          <FloorPlanMock />
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
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">The console</p>
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
          <ScannerMock />
          <span className="absolute -left-2 top-6 rounded-full bg-surface px-3 py-1.5 font-mono text-[11px] text-ink shadow-[var(--shadow-e1)]">
            no app store · just a link
          </span>
          <span className="absolute -right-1 bottom-10 rounded-full bg-brand px-3 py-1.5 font-mono text-[11px] text-brand-ink shadow-[var(--shadow-e1)]">
            magic-link in 15 min
          </span>
        </div>
      </div>
    </section>
  );
}

const ledger = [
  [KeyRound, 'No passwords to forget at 11 PM', 'Magic links that expire in 15 minutes. Because nobody wants to reset a password in a line that wraps around the block.'],
  [Users, 'Group bookings', 'Buy the table, invite guests by email, each claims their own ticket.'],
  [Palette, 'Your brand everywhere', 'Branding studio with presets, live preview, and contrast checks.'],
  [Landmark, 'ACH at checkout', 'Bank payment swaps the card fee for 2%. Buyers see the saving.'],
  [Search, 'SEO event pages', 'Clean slugs and structured data, indexed the day you publish.'],
  [Star, 'Performers and sponsors', 'Profile pages that make your lineup look booked-out.'],
  [Accessibility, 'Accessible by default', 'WCAG AA on the purchase path, reduced motion respected.'],
  [ShieldCheck, 'No refund admin', 'All sales final, disclosed at checkout, in the footer, in the email.'],
] as const;

export function FeatureLedger() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
      <h2 data-split className="font-display text-3xl text-ink md:text-4xl">
        Small details, <em className="italic text-brand">big nights.</em>
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ledger.map(([Icon, term, detail]) => (
          <div
            data-reveal
            key={term}
            className="rounded-2xl border border-hairline bg-surface p-6 shadow-[var(--shadow-e1)]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stage text-voltage">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 font-display text-lg text-ink">{term}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{detail}</p>
          </div>
        ))}
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
        <div data-reveal className="space-y-4 leading-relaxed text-ink-soft">
          <p>
            I spent five years in business intelligence watching how enterprise software companies
            price their products. They charge what the market will bear, not what the product costs
            to deliver. When I looked at ticketing platforms through that same lens, the margins were
            absurd: twenty to thirty percent for infrastructure that costs pennies per transaction. A
            venue selling $3,000 in tickets might lose $800 before they ever see a dime.
          </p>
          <p>
            I built Svyne because I think the person who books the DJ, hires the security, and sweeps
            the floor at 3 AM should keep the money their guests paid. Not a platform that puts their
            logo on your door and calls it a partnership.
          </p>
          <p>
            One honest caveat: Svyne is built for venues that sell their own tickets &mdash;
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
    price: 'from $49',
    unit: '/mo',
    fee: 'down to 4.5% + $1.25',
    feeNote: 'lowest fee, every event',
    featured: false,
    cta: 'See plans',
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
          <p data-reveal className="leading-relaxed text-on-stage-soft">
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
              <Link
                to="/get-started"
                className={
                  tier.featured
                    ? 'mt-7 flex h-11 items-center justify-center rounded-full bg-stage px-6 text-sm font-medium text-on-stage transition-transform hover:scale-[1.02] active:scale-[0.98]'
                    : 'mt-7 flex h-11 items-center justify-center rounded-full bg-surface px-6 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-[0.98]'
                }
              >
                {tier.cta}
              </Link>
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
            <span className="text-on-stage-soft">buyer pays $55.00</span>
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
  { name: 'email', label: 'Email', placeholder: 'amara@skylineterrace.com', type: 'email', half: false },
  { name: 'venue', label: 'Venue name', placeholder: 'Skyline Terrace', type: 'text', half: true },
  { name: 'city', label: 'City', placeholder: 'Mobile, AL', type: 'text', half: true },
];

export function ClosingCta() {
  const navigate = useNavigate();
  return (
    <section className="bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-stage px-6 py-14 text-on-stage md:px-14 md:py-20">
        <p data-reveal className="font-mono text-xs uppercase tracking-[0.3em] text-voltage">Open a Svyne box office</p>
        <h2 data-split className="mt-4 max-w-2xl font-display text-3xl md:text-4xl lg:text-5xl">
          Draft your first night <em className="italic text-voltage">before your coffee gets cold.</em>
        </h2>
        <p data-reveal className="mt-4 max-w-md leading-relaxed text-on-stage-soft">
          Tell me about your venue. I read every one of these personally and I&rsquo;ll get you a
          link to your box office within a day.
        </p>
        <ul data-reveal className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-on-stage-soft">
          {closingPills.map((pill) => (
            <li key={pill}>· {pill}</li>
          ))}
        </ul>
        <form
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/get-started');
          }}
          className="mt-10 space-y-6"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {formFields.map((field) => (
              <label key={field.name} className={field.half ? '' : 'sm:col-span-2'}>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-stage-soft">{field.label}</span>
                <input
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  className="mt-2 w-full border-b border-on-stage-soft/30 bg-transparent pb-2 text-on-stage placeholder:text-on-stage-soft/50 focus:border-voltage focus:outline-none"
                />
              </label>
            ))}
          </div>
          <button type="submit" className={`${landingCta} w-full`}>
            Open my box office &rarr;
          </button>
        </form>
        <p data-reveal className="mt-6 font-display text-xl italic text-on-stage-soft">&mdash; Siddh Patel, Chickasaw, AL</p>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint">
        <Link to="/terms" className="hover:text-ink">Terms</Link>
        <Link to="/privacy" className="hover:text-ink">Privacy</Link>
        <Link to="/refund-policy" className="hover:text-ink">Refund policy</Link>
        <Link to="/help" className="hover:text-ink">Help center</Link>
        <Link to="/contact" className="hover:text-ink">Contact</Link>
        <span className="ml-auto font-mono">All sales final.</span>
      </div>
    </section>
  );
}
