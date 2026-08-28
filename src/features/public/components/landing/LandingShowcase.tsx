import { useLandingStore, venueSlug } from '@/features/public/hooks/landingStore';
import { ArrowUpRight, Building, Sparkles } from 'lucide-react';

interface PortalSkin {
  venue: string;
  city: string;
  type: string;
  link: string;
  slug: string;
  accent: string;
  features: string[];
}

const portalSkins: PortalSkin[] = [
  {
    venue: 'The Azalea Room',
    city: 'Mobile, AL',
    type: 'Nightclub & Lounge',
    link: 'azalea.ticketspan.com',
    slug: 'azalea',
    accent: '#064e3b',
    features: ['High-speed mobile check-in', 'VIP booth reservations', '2-day rolling deposits'],
  },
  {
    venue: 'Crescent Theater South',
    city: 'Mobile, AL',
    type: 'Independent Cinema & Theater',
    link: 'crescent.ticketspan.com',
    slug: 'crescent',
    accent: '#0f766e',
    features: ['Reserved table & seat chart', 'Multi-day show runs', 'Financial ledger exports'],
  },
  {
    venue: 'Port City Pavilion',
    city: 'Chickasaw, AL',
    type: 'Open-Air Amphitheater',
    link: 'portcity.ticketspan.com',
    slug: 'portcity',
    accent: '#0369a1',
    features: ['High-volume door ingress', 'Multi-staff synchronized scanners', 'Sponsor logo placement'],
  },
  {
    venue: 'Dauphin Street Comedy',
    city: 'Mobile, AL',
    type: 'Comedy Cellar',
    link: 'dauphin.ticketspan.com',
    slug: 'dauphin',
    accent: '#4338ca',
    features: ['Floor plan seat selection', 'Automated reminder emails', 'Magic link host login'],
  },
];

export function PortalShowcase() {
  const venueName = useLandingStore((s) => s.venueName);
  const named = venueName.trim();

  return (
    <section id="showcase" className="scroll-mt-20 py-10 sm:py-14 md:py-16 bg-stone-50 border-t border-stone-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold text-(--lp-green) border border-emerald-200/60">
            <Building className="size-3.5" />
            <span>Multi-Tenant Architecture</span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--lp-ink)">
            One platform. Every venue completely its own.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
            These illustrative profiles show how TicketSpan wraps around each venue&rsquo;s individual visual identity, typography, and event format.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portalSkins.map((skin) => (
            <div
              key={skin.slug}
              className="rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 sm:pb-4">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-(--lp-ink)">{skin.venue}</h3>
                    <p className="text-[11px] sm:text-xs text-stone-500">{skin.city} · {skin.type}</p>
                  </div>
                  <span
                    className="size-2.5 sm:size-3 rounded-full shrink-0"
                    style={{ backgroundColor: skin.accent }}
                  />
                </div>

                <p className="mt-3 font-mono text-xs font-semibold text-(--lp-green)">
                  {skin.link}
                </p>

                <div className="mt-3 space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                    Capabilities Active
                  </span>
                  <ul className="space-y-1 text-xs text-stone-700">
                    {skin.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-1.5">
                        <span className="text-(--lp-green)">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between font-mono text-[10.5px] sm:text-[11px] text-stone-500">
                <span>Branded Box Office</span>
                <span className="text-stone-700 font-semibold">Live Preview</span>
              </div>
            </div>
          ))}

          <div className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-stone-300 bg-white/60 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-stone-900 font-bold text-base sm:text-lg">
                <Sparkles className="size-4 text-(--lp-green)" />
                <h4>{named ? `${named}` : 'Your Room Here'}</h4>
              </div>
              <p className="mt-0.5 text-xs text-stone-500 truncate">
                {named ? `${venueSlug(named)}.ticketspan.com` : 'yourvenue.ticketspan.com'}
              </p>
              <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                Claim your custom subdomain in under eight minutes. Start drafting your first event with zero credit card required.
              </p>
            </div>

            <a
              href="#start"
              className="mt-5 flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-full bg-(--lp-green) text-xs font-semibold text-white shadow-sm hover:bg-(--lp-green-soft) transition-all"
            >
              <span>Claim Box Office</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
