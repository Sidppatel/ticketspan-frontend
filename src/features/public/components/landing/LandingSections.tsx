import {
  DashboardMock,
  FloorPlanMock,
  ScannerMock,
} from '@/features/public/components/landing/LandingMockups';

const marqueeWords = ['clubs', 'theaters', 'supper clubs', 'rooftops', 'pop-ups', 'galleries', 'lounges'];

export function VenueMarquee() {
  const loop = [...marqueeWords, ...marqueeWords];
  return (
    <div className="overflow-hidden py-6">
      <div className="lp-rule-double mx-5 md:mx-8" aria-hidden="true" />
      <div className="lp-marquee mt-6 flex w-max items-baseline gap-10 font-[family-name:var(--lp-display)] text-3xl italic text-(--lp-ink-soft) md:text-4xl">
        {loop.map((word, i) => (
          <span key={i} className="flex items-baseline gap-10 whitespace-nowrap">
            {word}
            <span className="text-xl not-italic text-(--lp-green)" aria-hidden="true">
              ✳
            </span>
          </span>
        ))}
      </div>
      <div className="lp-rule-double mx-5 mt-6 md:mx-8" aria-hidden="true" />
    </div>
  );
}

const steps = [
  {
    note: '8 min avg',
    title: "Launch in under 10 minutes",
    body: 'Pick a subdomain, upload your logo, choose your colors. Most venues are live in about eight minutes, and we never ask for a card to get there.',
  },
  {
    note: 'Floor-plan studio',
    title: 'Build the night',
    body: 'Draft the event, add ticket types from Early Bird to VIP, and lay out tables in the floor-plan studio. Recurring and multi-day events included.',
  },
  {
    note: 'Live at the door',
    title: 'Sell, scan, settle',
    body: 'Publish and share the link. Sales show up as they happen, any phone can scan QR codes at the door, and the roster and revenue export whenever you want them.',
  },
];

export function HowItWorks() {
  return (
    <section id="platform" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8 md:py-28">
      <div className="grid gap-8 md:grid-cols-[1fr_360px] md:items-end">
        <h2 data-split className="max-w-lg text-4xl text-(--lp-ink) md:text-5xl">
          Event builder <em className="text-(--lp-green)">and publishing.</em>
        </h2>
        <p data-reveal className="leading-relaxed text-(--lp-ink-soft)">
          Set up, build the event, go on sale. There&rsquo;s no sales call to sit through, and you
          could do the whole thing tonight.
        </p>
      </div>
      <ol className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
        {steps.map((step, i) => (
          <li data-reveal key={step.title}>
            <div className="lp-rule-double" aria-hidden="true" />
            <div className="mt-5 flex items-baseline justify-between">
              <span className="font-[family-name:var(--lp-display)] text-4xl text-(--lp-ink-faint)">
                0{i + 1}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--lp-green)">
                {step.note}
              </span>
            </div>
            <h3 className="mt-4 text-2xl text-(--lp-ink)">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-(--lp-ink-soft)">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FloorPlanShowcase() {
  return (
    <section id="floor-plan" className="scroll-mt-24 bg-(--lp-paper) py-20 md:py-28">
      <div className="mx-auto grid max-w-[90rem] items-center gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-10">
        <div>
          <p data-reveal className="lp-eyebrow text-(--lp-green)">
            Tables
          </p>
          <h2 data-split className="mt-5 text-4xl text-(--lp-ink) md:text-5xl">
            Interactive <em className="text-(--lp-green)">table selection.</em>
          </h2>
          <p data-reveal className="mt-6 max-w-md leading-relaxed text-(--lp-ink-soft)">
            Table T-4 by the railing. Guests can reserve it themselves, and
            it stays held for ten minutes while they pay. Your host never has to make the
            &ldquo;sorry, that seat&rsquo;s taken&rdquo; call at 9:47 PM.
          </p>
          <ul data-reveal className="mt-7 space-y-2.5 font-mono text-[13px] text-(--lp-ink-soft)">
            <li>Zoom, pan, undo, templates for big rooms</li>
            <li>Per-table pricing and seat counts</li>
            <li>Open-layout general admission too</li>
          </ul>
        </div>
        <div data-reveal data-parallax>
          <FloorPlanMock />
        </div>
      </div>
    </section>
  );
}

export function AdminShowcase() {
  return (
    <section className="mx-auto grid max-w-[90rem] items-center gap-12 px-5 py-20 md:grid-cols-2 md:gap-20 md:px-10 md:py-28">
      <div className="md:order-2">
        <p data-reveal className="lp-eyebrow text-(--lp-green)">
          Analytics & Reporting
        </p>
        <h2 data-split className="mt-5 text-4xl text-(--lp-ink) md:text-5xl">
          Watch it sell <em className="text-(--lp-green)">in real time.</em>
        </h2>
        <p data-reveal className="mt-6 max-w-md leading-relaxed text-(--lp-ink-soft)">
          Sales, revenue, and door counts update as they happen, and attendees or financials export
          to CSV or XLSX whenever you like. Sales tax is worked out at checkout and reported per
          event; the platform can remit it, or you can.
        </p>
        <ul data-reveal className="mt-7 space-y-2.5 font-mono text-[13px] text-(--lp-ink-soft)">
          <li>Revenue is your ticket price, never fee-diluted</li>
          <li>Per-event tax report, always current</li>
          <li>Check-in audit trail for every scan</li>
        </ul>
      </div>
      <div data-reveal data-parallax className="md:order-1">
        <DashboardMock />
      </div>
    </section>
  );
}

export function EventNightShowcase() {
  return (
    <section className="bg-(--lp-green) py-20 text-(--lp-ivory) md:py-28">
      <div className="mx-auto grid max-w-[90rem] items-center gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-10">
        <div>
          <p data-reveal className="lp-eyebrow text-(--lp-green-ivory)">
            Door scan
          </p>
          <h2 data-split className="mt-5 text-4xl md:text-5xl">
            Fast, high-contrast <em className="text-(--lp-green-ivory)">scanning.</em>
          </h2>
          <p data-reveal className="mt-6 max-w-md leading-relaxed text-(--lp-ivory)/75">
            Your door person opens a link, points the camera, and sees a big GO or STOP. Nothing to
            install and nothing to log into, which matters at 10 PM when the line is around the
            corner and they&rsquo;re holding a tray of drinks.
          </p>
          <ul data-reveal className="mt-7 space-y-2.5 font-mono text-[13px] text-(--lp-ivory)/75">
            <li>Roster search when a phone dies</li>
            <li>Live in-count against capacity</li>
            <li>Guests claim invited seats with their own QR</li>
          </ul>
        </div>
        <div data-reveal data-parallax>
          <ScannerMock />
        </div>
      </div>
    </section>
  );
}

const programme = [
  {
    term: 'Magic-link sign-in',
    detail: 'Links that expire in 15 minutes, because nobody wants to reset a password in a line that wraps around the block.',
    note: 'Expires 15:00',
  },
  {
    term: 'Branding studio',
    detail: 'Presets, live preview, and WCAG contrast checks — your colors everywhere your audience looks.',
    note: 'Contrast AA',
  },
  {
    term: 'Table & GA ticketing',
    detail: 'Draft the event, add ticket types from Early Bird to VIP, and lay out tables in the floor-plan studio. Mixed layouts supported.',
    note: 'Custom pricing',
  },
];

export function FeatureProgramme() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8 md:py-28">
      <p data-reveal className="lp-eyebrow text-(--lp-green)">
        Feature list
      </p>
      <h2 data-split className="mt-5 max-w-xl text-4xl text-(--lp-ink) md:text-5xl">
        Core platform <em className="text-(--lp-green)">features.</em>
      </h2>
      <ol className="mt-14">
        {programme.map((item, i) => (
          <li
            data-reveal
            key={item.term}
            className="group -mx-5 grid grid-cols-[3rem_1fr] items-baseline gap-x-4 gap-y-1 border-t border-(--lp-line-soft) px-5 py-6 transition-[background] duration-300 hover:[background:linear-gradient(90deg,transparent,var(--lp-paper)_12%,var(--lp-paper)_88%,transparent)] md:-mx-10 md:grid-cols-[4rem_1fr_2fr_10rem] md:gap-x-8 md:px-10"
          >
            <span className="font-[family-name:var(--lp-display)] text-2xl text-(--lp-ink-faint)">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="text-xl text-(--lp-ink) md:text-2xl">{item.term}</h3>
            <p className="col-start-2 text-sm leading-relaxed text-(--lp-ink-soft) md:col-start-3">
              {item.detail}
            </p>
            <span className="col-start-2 mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-(--lp-green) md:col-start-4 md:mt-0 md:text-right">
              {item.note}
            </span>
          </li>
        ))}
      </ol>
      <div className="border-t border-(--lp-line-soft)" aria-hidden="true" />
    </section>
  );
}

export function OperationalProof() {
  return (
    <section className="bg-(--lp-paper) py-20 text-(--lp-ink) md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p data-reveal className="lp-eyebrow text-(--lp-green)">
          Operational specs
        </p>
        <h2 data-split className="mt-5 max-w-2xl text-4xl md:text-5xl">
          Door operations <em className="text-(--lp-green)">and hardware.</em>
        </h2>
        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div data-reveal className="border-t border-(--lp-line-soft) pt-6">
            <h3 className="font-[family-name:var(--lp-display)] text-xl font-medium">Device Requirements</h3>
            <p className="mt-3 text-sm leading-relaxed text-(--lp-ink-soft)">
              Scanners run in the browser on any iOS or Android device. No proprietary hardware or app store downloads required.
            </p>
          </div>
          <div data-reveal className="border-t border-(--lp-line-soft) pt-6">
            <h3 className="font-[family-name:var(--lp-display)] text-xl font-medium">Payment Methods</h3>
            <p className="mt-3 text-sm leading-relaxed text-(--lp-ink-soft)">
              Checkout accepts Apple Pay, Google Pay, and all major credit cards. Powered and secured by Stripe.
            </p>
          </div>
          <div data-reveal className="border-t border-(--lp-line-soft) pt-6">
            <h3 className="font-[family-name:var(--lp-display)] text-xl font-medium">Payout Timing</h3>
            <p className="mt-3 text-sm leading-relaxed text-(--lp-ink-soft)">
              Ticket revenue lands directly in your bank account on your standard Stripe rolling schedule (typically 2 days).
            </p>
          </div>
          <div data-reveal className="border-t border-(--lp-line-soft) pt-6">
            <h3 className="font-[family-name:var(--lp-display)] text-xl font-medium">Refunds & Support</h3>
            <p className="mt-3 text-sm leading-relaxed text-(--lp-ink-soft)">
              Issue partial or full refunds directly from your dashboard. We provide on-call support during peak event ingress.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FounderNote() {
  return (
    <section id="founder" className="relative scroll-mt-24 overflow-hidden bg-(--lp-paper) py-20 md:py-32 text-(--lp-ink)">
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 50px) scale(1.15); }
          66% { transform: translate(20px, -20px) scale(0.85); }
        }
      `}</style>
      
      {/* Animated glowing orbs (Light Mode) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.15] mix-blend-multiply pointer-events-none">
        <div 
          className="absolute h-[50vh] w-[50vw] rounded-full bg-(--lp-green) blur-[100px] md:blur-[140px]"
          style={{ animation: 'float1 14s ease-in-out infinite' }}
        />
        <div 
          className="absolute h-[40vh] w-[60vw] rounded-full bg-[#10b981] blur-[100px] md:blur-[120px]"
          style={{ animation: 'float2 18s ease-in-out infinite', animationDelay: '-5s' }}
        />
      </div>

      {/* Grid overlay for texture */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--lp-ink) 1px, transparent 1px), linear-gradient(to bottom, var(--lp-ink) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-5 md:px-8">
        <div className="rounded-2xl border border-(--lp-ink)/5 bg-white/60 px-8 py-14 backdrop-blur-xl md:px-16 md:py-20 text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <p data-reveal className="lp-eyebrow text-(--lp-green) mx-auto">
            From the founder
          </p>
          <h2 data-split className="mx-auto mt-6 max-w-2xl text-3xl leading-tight text-(--lp-ink) md:text-5xl">
            The person who sweeps the floor at 3 AM{' '}
            <em className="text-(--lp-green)">should keep the money.</em>
          </h2>
          <div data-reveal className="mx-auto mt-10 max-w-xl space-y-6 text-lg leading-relaxed text-(--lp-ink-soft) [text-wrap:pretty]">
            <p>
              A few months ago, I was scrolling through Facebook and saw a post for a local event.
            </p>
            <p>
              If you wanted a ticket, here's what you had to do: Cash App the organizer money, or call a phone number and hope somebody picks up.
            </p>
            <p>
              That's it. That was the whole system.
            </p>
          </div>
          <p data-reveal className="mt-12 font-[family-name:var(--lp-display)] text-xl italic text-(--lp-ink) opacity-80">
            — Siddh Patel, Chickasaw, AL
          </p>
        </div>
      </div>
    </section>
  );
}
