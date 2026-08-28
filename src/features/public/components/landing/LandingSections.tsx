import {
  DashboardMock,
  FloorPlanMock,
  ScannerMock,
} from '@/features/public/components/landing/LandingMockups';
import { Smartphone, CreditCard, ShieldCheck, RefreshCw, Palette, Layers, Users, Zap } from 'lucide-react';

const marqueeRooms = [
  'Independent Theaters',
  'Live Music Clubs',
  'Supper Clubs',
  'Rooftop Lounges',
  'Community Galas',
  'Comedy Cellars',
  'Pop-up Spaces',
];

export function VenueMarquee() {
  const marqueeItems = [...marqueeRooms, ...marqueeRooms, ...marqueeRooms, ...marqueeRooms];

  return (
    <div className="overflow-hidden border-y border-stone-200/80 bg-white/50 py-3 sm:py-3.5">
      <div className="lp-marquee-container">
        <div className="lp-marquee-track flex items-center gap-8 sm:gap-12">
          {marqueeItems.map((room, i) => (
            <div key={i} className="flex items-center gap-8 sm:gap-12 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-stone-500 whitespace-nowrap">
              <span>{room}</span>
              <span className="text-(--lp-green) font-bold">✳</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-20 py-10 sm:py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold text-(--lp-green) border border-emerald-200/60">
            <Layers className="size-3.5" />
            <span>Built For Live Operations</span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-(--lp-ink)">
            Engineered for the night of the show.
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-(--lp-ink-soft) leading-relaxed">
            Everything your staff needs to draft events, sell reserved seating, scan tickets at the door, and reconcile revenue in real time.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs font-semibold text-stone-700">
                <Palette className="size-3 text-(--lp-green)" />
                Floor Plan Studio
              </span>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-(--lp-ink)">Interactive table reservations</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
                Build your room layout in minutes. Assign custom ticket pricing, minimum spends, and seat counts per table. Open tables hold automatically for ten minutes during checkout.
              </p>
            </div>
            <FloorPlanMock />
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs font-semibold text-stone-700">
                <Smartphone className="size-3 text-(--lp-green)" />
                Zero-App Scanner
              </span>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-(--lp-ink)">Instant browser check-in</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
                Door staff opens a secure link on any smartphone camera. Instant soundless feedback, multi-device sync, and offline roster search when a battery dies.
              </p>
            </div>
            <ScannerMock />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs font-semibold text-stone-700">
                <CreditCard className="size-3 text-(--lp-green)" />
                Stripe Connect Integration
              </span>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-(--lp-ink)">Direct host bank deposits</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
                Connect your Stripe account in two clicks. Revenue flows straight to your merchant account on your standard 2-day rolling schedule without platform holding delays.
              </p>
            </div>
            <DashboardMock />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs font-semibold text-stone-700">
                <Zap className="size-3 text-(--lp-green)" />
                Whitelabel Identity
              </span>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-(--lp-ink)">Your domain, your brand</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
                Guests never see a third-party ticketing portal. Your box office lives at your own custom subdomain with automatic SSL, custom palette matching, and automated guest confirmations.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-stone-50 p-4 border border-stone-200/60 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 font-mono text-xs">
                <span className="text-stone-500">Subdomain Route</span>
                <span className="font-semibold text-(--lp-green) truncate max-w-[170px] sm:max-w-none">yourvenue.ticketspan.com</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-stone-500">Attendee Data Rights</span>
                <span className="font-semibold text-stone-800">100% Exportable (CSV/XLSX)</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-stone-500">Magic Link Sign-In</span>
                <span className="font-semibold text-stone-800">15-min passwordless access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function OperationalProof() {
  return (
    <section id="specs" className="scroll-mt-20 border-y border-stone-200/80 bg-white/70 py-10 sm:py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 font-mono text-xs font-semibold text-stone-700">
            <ShieldCheck className="size-3.5 text-(--lp-green)" />
            <span>Operational Architecture</span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--lp-ink)">
            Technical and payment specifications.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
            Transparent operational standards built to keep your front door moving and your financial records clean.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-(--lp-green)">
              <Smartphone className="size-4.5" />
            </div>
            <h3 className="mt-3 text-base sm:text-lg font-bold text-(--lp-ink)">Scanner Hardware</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
              Runs in the native mobile browser on any modern iOS or Android device. No app store downloads or proprietary handheld terminals needed.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-(--lp-green)">
              <CreditCard className="size-4.5" />
            </div>
            <h3 className="mt-3 text-base sm:text-lg font-bold text-(--lp-ink)">Payment Methods</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
              Checkout accepts Apple Pay, Google Pay, and major credit cards. Card tokenization is handled client-side directly by Stripe.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-(--lp-green)">
              <RefreshCw className="size-4.5" />
            </div>
            <h3 className="mt-3 text-base sm:text-lg font-bold text-(--lp-ink)">Payout Timing</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
              Ticket revenue transfers straight into your connected bank account on your standard Stripe rolling deposit schedule (typically 2 business days).
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-(--lp-green)">
              <Users className="size-4.5" />
            </div>
            <h3 className="mt-3 text-base sm:text-lg font-bold text-(--lp-ink)">Guest Data Rights</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
              Your attendee roster belongs exclusively to your venue. TicketSpan does not market third-party events to your customer base.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FounderNote() {
  return (
    <section id="founder" className="scroll-mt-20 py-10 sm:py-14 md:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
        <div className="lp-double-bezel">
          <div className="lp-double-bezel-inner p-6 sm:p-10 md:p-14 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold text-(--lp-green) border border-emerald-200/60">
              Why We Built TicketSpan
            </span>

            <h2 className="mt-4 sm:mt-5 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--lp-ink) max-w-2xl mx-auto leading-tight">
              Ticketing shouldn&rsquo;t require Cash App and a prayer.
            </h2>

            <div className="mt-6 sm:mt-7 max-w-xl mx-auto space-y-3.5 text-sm sm:text-base leading-relaxed text-(--lp-ink-soft)">
              <p>
                A few months ago, I was scrolling through Facebook and saw a post for a local event.
              </p>
              <p className="font-semibold text-(--lp-ink)">
                If you wanted a ticket, here&rsquo;s what you had to do: Cash App the organizer money, or call a phone number and hope somebody picks up.
              </p>
              <p>
                That was it. That was the whole system.
              </p>
              <p className="pt-1 text-xs sm:text-sm text-stone-600">
                Independent venues and promoters deserve professional, branded box offices without handing over huge cuts of their gate or forcing guests into broken makeshift workflows.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-200/80 flex flex-col items-center">
              <p className="font-semibold text-stone-900 text-sm sm:text-base">Siddh Patel</p>
              <p className="font-mono text-[11px] sm:text-xs text-stone-500 mt-0.5">Founder, TicketSpan · Chickasaw, Alabama</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
