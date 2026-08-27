import { useLandingStore, venueSlug } from '@/features/public/hooks/landingStore';

interface PortalSkin {
  venue: string;
  slug: string;
  presetName: string;
  event: string;
  date: string;
  price: string;
  background: string;
  text: string;
  primary: string;
  accent: string;
  onPrimary: string;
}

const portalSkins: PortalSkin[] = [
  {
    venue: 'The Aster Room',
    slug: 'theasterroom',
    presetName: 'Noir Premiere',
    event: 'Winter Gala',
    date: 'Sat · Dec 12',
    price: '$120',
    background: '#FAFAFA',
    text: '#18181B',
    primary: '#18181B',
    accent: '#D4A017',
    onPrimary: '#F4F4F5',
  },
  {
    venue: 'Verdane Garden Club',
    slug: 'verdane',
    presetName: 'Forest Gala',
    event: 'Harvest Supper',
    date: 'Fri · Oct 2',
    price: '$85',
    background: '#FAFDF7',
    text: '#14201A',
    primary: '#166534',
    accent: '#CA8A04',
    onPrimary: '#ECFDF5',
  },
  {
    venue: 'Harbor & Vine',
    slug: 'harborvine',
    presetName: 'Coastal Club',
    event: 'Oyster Social',
    date: 'Sun · Aug 9',
    price: '$65',
    background: '#F8FBFC',
    text: '#0C1A20',
    primary: '#0E7490',
    accent: '#F97316',
    onPrimary: '#E0F2FE',
  },
  {
    venue: 'Studio Meridian',
    slug: 'meridian',
    presetName: 'Midnight Stage',
    event: 'Midnight Sessions',
    date: 'Thu · Sep 17',
    price: '$45',
    background: '#F8FAFC',
    text: '#0F172A',
    primary: '#4F46E5',
    accent: '#F59E0B',
    onPrimary: '#E0E7FF',
  },
];

function PortalSkinCard({ skin }: { skin: PortalSkin }) {
  return (
    <article
      data-skin-card
      className="w-[82vw] max-w-[420px] shrink-0 snap-center border-[1.5px] border-(--lp-ink) shadow-[10px_10px_0_rgba(25,23,20,0.08)]"
      style={{ background: skin.background, color: skin.text }}
    >
      <div className="flex items-center justify-between border-b px-6 py-3.5" style={{ borderColor: `${skin.text}22` }}>
        <span className="font-[family-name:var(--lp-display)] text-lg font-semibold">{skin.venue}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-80">Box office</span>
      </div>
      <div className="px-6 py-6" style={{ background: skin.primary, color: skin.onPrimary }}>
        <p className="font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: skin.onPrimary }}>
          {skin.date}
        </p>
        <p className="mt-2 font-[family-name:var(--lp-display)] text-3xl font-semibold">{skin.event}</p>
        <p className="mt-1 text-xs">Doors 7 PM · Tables and general admission</p>
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-80">From</p>
          <p className="font-[family-name:var(--lp-display)] text-xl font-semibold">{skin.price}</p>
        </div>
        <span
          className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ background: skin.primary, color: skin.onPrimary }}
        >
          Choose seats
        </span>
      </div>
      <div
        className="flex items-center justify-between border-t px-6 py-3 font-mono text-[9px] uppercase tracking-[0.18em] opacity-80"
        style={{ borderColor: `${skin.text}22` }}
      >
        <span>{skin.slug}.ticketspan.com</span>
        <span>{skin.presetName} preset</span>
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
        {named ? `${named}.` : 'Your house here.'}
      </p>
      <p className="mt-2 text-sm text-(--lp-ink-soft)">
        {named
          ? `${venueSlug(named)}.ticketspan.com could be live the day you ask for it.`
          : 'Your subdomain and your logo, live the day you ask for it.'}
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
          The showcase
        </p>
        <h2 data-split className="mt-5 max-w-2xl text-4xl text-(--lp-ink) md:text-5xl">
          One platform. Every house <em className="text-(--lp-green)">its own.</em>
        </h2>
        <p data-reveal className="mt-6 max-w-lg leading-relaxed text-(--lp-ink-soft)">
          All four of these are the same box office wearing different brands. Your audience sees
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
