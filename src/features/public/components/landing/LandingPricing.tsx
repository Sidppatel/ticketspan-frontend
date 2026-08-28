import { useState } from 'react';
import { Check, ArrowUpRight, Calculator, ShieldCheck, DollarSign } from 'lucide-react';

const tiers = [
  {
    name: 'Free Forever',
    price: '$0',
    unit: '/mo',
    fee: '6.5% + $1.75',
    feeNote: 'per order · paid by ticket buyer at checkout',
    featured: true,
    cta: 'Start Free',
    points: [
      'Unlimited events, ticket tiers & staff passes',
      'Free events are 100% free with no charges',
      'Branded subdomain with automatic SSL',
      'Live door check-in scanner on any smartphone',
      'Direct Stripe 2-day rolling deposits',
    ],
  },
  {
    name: 'Pay Per Event',
    price: '$25',
    unit: '/event',
    fee: '5.5% + $1.25',
    feeNote: 'lower fee for that single event run',
    featured: false,
    cta: 'Select Single Event',
    points: [
      'Everything in Free tier',
      'Lower service fees passed to your buyers',
      'Advanced seating analytics export',
      'Ideal for annual galas and festival runs',
    ],
  },
  {
    name: 'Volume Subscription',
    price: 'Custom',
    unit: '',
    fee: 'Tailored to Volume',
    feeNote: 'lowest transaction rates for busy houses',
    featured: false,
    cta: 'Contact Us',
    points: [
      'Custom white-label domain routing',
      'Dedicated onboarding & door support',
      'Custom seat chart digitization assistance',
      'Monthly invoicing options available',
    ],
  },
];

export function PricingCalculator() {
  const [ticketPrice, setTicketPrice] = useState(40);
  const [attendees, setAttendees] = useState(250);

  const totalGross = ticketPrice * attendees;
  const legacyDeduction = totalGross * 0.08 + attendees * 1.5;
  const legacyPayout = Math.max(0, totalGross - legacyDeduction);
  const ticketSpanPayout = totalGross;
  const savings = totalGross - legacyPayout;

  return (
    <section id="calculator" className="scroll-mt-20 py-10 sm:py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-8 lg:p-10 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold text-(--lp-green) border border-emerald-200/60">
                <Calculator className="size-3.5" />
                <span>Interactive Payout Calculator</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--lp-ink)">
                Calculate your gate payout.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
                Traditional ticketing companies take a cut directly out of the host&rsquo;s pocket. With TicketSpan, buyer-side service fees mean you receive 100% of your advertised face value.
              </p>

              <div className="mt-6 sm:mt-8 space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-stone-800">
                    <label htmlFor="ticket-price-range">Average Ticket Price</label>
                    <span className="font-mono text-base sm:text-lg font-bold text-(--lp-green)">${ticketPrice}</span>
                  </div>
                  <input
                    id="ticket-price-range"
                    type="range"
                    min="10"
                    max="250"
                    step="5"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="w-full mt-1.5 accent-(--lp-green)"
                  />
                  <div className="flex justify-between text-[10.5px] font-mono text-stone-400 mt-0.5">
                    <span>$10</span>
                    <span>$250</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-stone-800">
                    <label htmlFor="attendees-count-range">Expected Attendees / Capacity</label>
                    <span className="font-mono text-base sm:text-lg font-bold text-(--lp-green)">{attendees} tickets</span>
                  </div>
                  <input
                    id="attendees-count-range"
                    type="range"
                    min="25"
                    max="1500"
                    step="25"
                    value={attendees}
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    className="w-full mt-1.5 accent-(--lp-green)"
                  />
                  <div className="flex justify-between text-[10.5px] font-mono text-stone-400 mt-0.5">
                    <span>25</span>
                    <span>1,500</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl bg-stone-50 p-4 sm:p-6 border border-stone-200/80 flex flex-col justify-between gap-4 sm:gap-6">
              <div>
                <span className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">
                  Gross Gate: ${totalGross.toLocaleString()}
                </span>

                <div className="mt-3 rounded-xl bg-white p-3.5 sm:p-4 border border-emerald-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs sm:text-sm text-(--lp-green) flex items-center gap-1">
                      <DollarSign className="size-3.5" />
                      Your Payout with TicketSpan
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                      100% Payout
                    </span>
                  </div>
                  <p className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono text-(--lp-ink)">
                    ${ticketSpanPayout.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    Service fee added at checkout paid by buyer. Zero deducted from host.
                  </p>
                </div>

                <div className="mt-2.5 rounded-xl bg-stone-100/80 p-3 sm:p-3.5 border border-stone-200/60">
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>Typical Legacy Ticketing Provider</span>
                    <span className="font-mono text-stone-500 text-[11px]">~8-10% cut</span>
                  </div>
                  <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-stone-600">
                    ${Math.round(legacyPayout).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-200/80 pt-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-stone-500">Estimated Host Advantage:</span>
                  <p className="font-mono font-bold text-emerald-700 text-base sm:text-lg">
                    +${Math.round(savings).toLocaleString()}
                  </p>
                </div>
                <a
                  href="#start"
                  className="inline-flex items-center gap-1 rounded-full bg-(--lp-green) px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white shadow-sm hover:bg-(--lp-green-soft) transition-all shrink-0"
                >
                  <span>Open Box Office</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-20 py-10 sm:py-14 md:py-16 bg-stone-100/60 border-t border-stone-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-(--lp-green)">
            Simple Transparent Pricing
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--lp-ink)">
            Start free. Pay only when you sell tickets.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
            No monthly subscription required. Service fees are included transparently at checkout on the buyer&rsquo;s receipt. Free events are always completely free.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 flex flex-col justify-between transition-all ${
                tier.featured
                  ? 'bg-white border-2 border-(--lp-green) shadow-lg ring-4 ring-emerald-50 relative'
                  : 'bg-white border border-stone-200/80 shadow-sm'
              }`}
            >
              <div>
                {tier.featured ? (
                  <span className="inline-block rounded-full bg-(--lp-green) px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white mb-2 sm:mb-3">
                    Most Popular
                  </span>
                ) : null}
                <h3 className="text-lg sm:text-xl font-bold text-(--lp-ink)">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-(--lp-ink)">{tier.price}</span>
                  <span className="text-xs sm:text-sm font-medium text-stone-500">{tier.unit}</span>
                </div>
                <div className="mt-2.5 rounded-lg bg-stone-50 p-2 sm:p-2.5 border border-stone-200/60">
                  <p className="font-mono text-xs font-bold text-(--lp-green)">{tier.fee}</p>
                  <p className="text-[10.5px] sm:text-[11px] text-stone-500 mt-0.5">{tier.feeNote}</p>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-stone-700">
                  {tier.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <Check className="size-3.5 text-(--lp-green) shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#start"
                className={`mt-6 sm:mt-8 flex h-10 sm:h-11 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  tier.featured
                    ? 'bg-(--lp-green) text-white hover:bg-(--lp-green-soft) shadow-sm'
                    : 'border border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustAndPolicies() {
  return (
    <section id="trust" className="py-10 sm:py-14 border-t border-stone-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm sm:text-base">
              <ShieldCheck className="size-4.5 text-(--lp-green)" />
              <h4>Merchant of Record</h4>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              You are the Merchant of Record. Every venue connects its own Stripe account via Stripe Connect. Funds flow straight to you without middleman holding accounts.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm sm:text-base">
              <ShieldCheck className="size-4.5 text-(--lp-green)" />
              <h4>Client-Side Tokenization</h4>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Payment card numbers are tokenized directly in the browser via Stripe Elements and never touch TicketSpan application servers, maintaining tight security posture.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm sm:text-base">
              <ShieldCheck className="size-4.5 text-(--lp-green)" />
              <h4>Local Tax Control</h4>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Tax rules vary by jurisdiction. Hosts specify their applicable local sales or amusement tax rates during event setup, reported cleanly in financial exports.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
