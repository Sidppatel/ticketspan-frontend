import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLockup } from '@/shared/brand/BrandMark';
import { useAuth } from '@/shared/auth/useAuth';
import { UserAvatarMenu } from '@/shared/components/UserAvatarMenu';
import { ArrowUpRight, LayoutGrid } from 'lucide-react';

const storySections = [
  { href: '#features', label: 'Features' },
  { href: '#calculator', label: 'Payout Calculator' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#showcase', label: 'Showcase' },
  { href: '#specs', label: 'Specifications' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
          : 'bg-white/80 backdrop-blur-md border-b border-stone-200/40'
      }`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6 md:px-8">
        <Link to="/" className="flex shrink-0 items-center text-(--lp-ink)" aria-label="TicketSpan home">
          <BrandLockup size="sm" tone="ink" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main Navigation">
          {storySections.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => scrollToAnchor(e, item.href)}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/hub"
                className="flex items-center gap-1.5 rounded-full bg-(--lp-green-ivory) px-3.5 py-1.5 font-mono text-xs font-semibold text-(--lp-green) transition-colors hover:bg-emerald-200"
              >
                <LayoutGrid className="size-3.5" />
                <span>Attendee Hub</span>
              </Link>
              <UserAvatarMenu tone="landing" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:text-stone-950"
              >
                Sign In
              </Link>
              <a
                href="#start"
                onClick={(e) => scrollToAnchor(e, '#start')}
                className="group flex h-9 items-center gap-1.5 rounded-full bg-(--lp-green) pl-4 pr-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-(--lp-green-soft) active:scale-95"
              >
                <span>Get Started</span>
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="size-3" />
                </span>
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          {isAuthenticated ? (
            <UserAvatarMenu tone="landing" />
          ) : (
            <a
              href="#start"
              onClick={(e) => scrollToAnchor(e, '#start')}
              className="flex h-8 items-center rounded-full bg-(--lp-green) px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-(--lp-green-soft) active:scale-95"
            >
              <span>Get Started</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
