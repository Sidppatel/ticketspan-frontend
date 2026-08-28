import { useLandingStore, venueSlug } from '@/features/public/hooks/landingStore';

interface PortalSkin {
  venue: string;
  city: string;
  type: string;
  link: string;
  slug: string;
  background: string;
  text: string;
  primary: string;
  accent: string;
  onPrimary: string;
  caseStudy: {
    keyFeatures: string[];
  };
}

const portalSkins: PortalSkin[] = [
  {
    venue: 'The Azalea Room',
    city: 'Mobile, AL',
    type: 'Nightclub',
    link: 'azalea.ticketspan.com',
    slug: 'azalea',
    background: '#FAFAFA',
    text: '#18181B',
    primary: '#18181B',
    accent: '#D4A017',
    onPrimary: '#F4F4F5',
    caseStudy: {
      keyFeatures: [
        'Rapid door scanning',
        'VIP and guestlist management',
        'Next-day payout schedule',
      ],
    },
  },
  {
    venue: 'Crescent Theater South',
    city: 'Mobile, AL',
    type: 'Independent Theater',
    link: 'crescent.ticketspan.com',
    slug: 'crescent',
    background: '#FAFDF7',
    text: '#14201A',
    primary: '#166534',
    accent: '#CA8A04',
    onPrimary: '#ECFDF5',
    caseStudy: {
      keyFeatures: [
        'Multi-day run schedules',
        'Seated vs GA ticketing',
        'Detailed financial exports',
      ],
    },
  },
  {
    venue: 'Port City Pavilion',
    city: 'Chickasaw, AL',
    type: 'Outdoor Event Space',
    link: 'portcity.ticketspan.com',
    slug: 'portcity',
    background: '#F8FBFC',
    text: '#0C1A20',
    primary: '#0E7490',
    accent: '#F97316',
    onPrimary: '#E0F2FE',
    caseStudy: {
      keyFeatures: [
        'High-volume ingress',
        'Multi-scanner sync',
        'Sponsor & Vendor integrations',
      ],
    },
  },
  {
    venue: 'Dauphin Street Comedy',
    city: 'Mobile, AL',
    type: 'Comedy Lounge',
    link: 'dauphin.ticketspan.com',
    slug: 'dauphin',
    background: '#F8FAFC',
    text: '#0F172A',
    primary: '#4F46E5',
    accent: '#F59E0B',
    onPrimary: '#E0E7FF',
    caseStudy: {
      keyFeatures: [
        'Floor-plan table booking',
        'Group check-ins',
        'Dark mode native branding',
      ],
    },
  },
];

function PortalSkinCard({ skin }: { skin: PortalSkin }) {
  return (
    <article
      data-skin-card
      className="w-[85vw] max-w-[480px] shrink-0 snap-center border-[1.5px] border-(--lp-ink) shadow-[10px_10px_0_rgba(25,23,20,0.08)] flex flex-col"
      style={{ background: skin.background, color: skin.text }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b px-6 py-4 gap-2" style={{ borderColor: `${skin.text}22` }}>
        <div>
          <span className="font-[family-name:var(--lp-display)] text-xl font-semibold">{skin.venue}</span>
          <span className="block text-xs mt-0.5 opacity-80">{skin.city} · {skin.type}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-80 cursor-default">
          {skin.link} ↗
        </span>
      </div>
      <div className="flex-1 px-6 py-12 flex flex-col justify-center" style={{ background: skin.primary, color: skin.onPrimary }}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-80 mb-4">Key Features Utilized</p>
        <ul className="space-y-3">
          {skin.caseStudy.keyFeatures.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-[14px] font-medium">
              <span style={{ color: skin.accent }}>✳</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

    </article>
  );
}

function YourHouseCard() {
  const venueName = useLandingStore((s) => s.venueName);
  const named = venueName.trim();
  return (
    <div className="flex w-[70vw] max-w-[340px] shrink-0 snap-center flex-col items-start justify-center border-[1.5px] border-dashed border-(--lp-ink)/50 px-8">
      <p className="font-[family-name:var(--lp-display)] text-2xl text-(--lp-ink)">
        {named ? `${named}.` : 'Your venue here.'}
      </p>
      <p className="mt-2 text-sm text-(--lp-ink-soft)">
        {named
          ? `${venueSlug(named)}.ticketspan.com, set up instantly.`
          : 'Your subdomain and logo, set up instantly.'}
      </p>
      <a href="#start" className="lp-ghost mt-6 text-(--lp-green)">
        Open your box office
      </a>
    </div>
  );
}

export function PortalShowcase() {
  return (
    <section id="showcase" data-showcase className="scroll-mt-24 overflow-hidden bg-(--lp-ivory) py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p data-reveal className="lp-eyebrow text-(--lp-green)">
          Illustrative Profiles
        </p>
        <h2 data-split className="mt-5 max-w-2xl text-4xl text-(--lp-ink) md:text-5xl">
          One platform. <em className="text-(--lp-green)">Fully branded for your venue.</em>
        </h2>
        <p data-reveal className="mt-6 max-w-lg leading-relaxed text-(--lp-ink-soft)">
          These illustrative venue profiles show how the same platform adapts to different spaces. Your audience sees
          your name and your domain, not ours. The branding studio comes with presets and contrast
          checks, so it looks right on the first try.
        </p>
      </div>
      <div data-showcase-viewport className="mt-12 snap-x snap-mandatory overflow-x-auto pb-6 [scrollbar-width:none] md:mt-16">
        <div data-showcase-track className="flex w-max gap-8 px-5 md:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {portalSkins.map((skin) => (
            <PortalSkinCard key={skin.slug} skin={skin} />
          ))}
          <YourHouseCard />
        </div>
      </div>
    </section>
  );
}
