import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';

const sections = [
  { href: '#features', label: 'Features' },
  { href: '#floor-plan', label: 'Floor plan' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#founder', label: 'Founder' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'border-b border-hairline/60 bg-stage/90 backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-baseline gap-2 text-on-stage">
          <span className="flex items-center gap-1.5 font-display text-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-voltage" /> Svyne
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-stage-soft">The box office</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="text-sm text-on-stage-soft transition-colors hover:text-on-stage"
            >
              {s.label}
            </a>
          ))}
          <Link
            to="/get-started"
            className="rounded-full bg-marigold px-5 py-2 text-sm font-medium text-marigold-foreground transition-colors hover:bg-coral"
          >
            Start free
          </Link>
        </div>
        <Link
          to="/get-started"
          className="rounded-full bg-marigold px-4 py-2 text-sm font-medium text-marigold-foreground md:hidden"
        >
          Start free
        </Link>
      </nav>
    </header>
  );
}
