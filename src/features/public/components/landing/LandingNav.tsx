import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { BrandLockup } from '@/shared/brand/BrandMark';
import { useAuth } from '@/shared/auth/useAuth';
import { UserAvatarMenu } from '@/shared/components/UserAvatarMenu';
import { LayoutGrid } from 'lucide-react';

const sections = [
  { href: '#platform', label: 'Platform' },
  { href: '#showcase', label: 'Showcase' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#founder', label: 'Founder' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300',
        scrolled ? 'bg-(--lp-ivory)/95 shadow-[0_1px_0_var(--lp-line)] backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link to="/" className="flex items-center text-(--lp-ink)" aria-label="TicketSpan home">
          <BrandLockup size="md" tone="ink" />
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className="lp-link text-sm">
              {s.label}
            </a>
          ))}

          {isAuthenticated ? (
            <div className="flex items-center gap-4 border-l border-(--lp-line-soft) pl-5">
              <Link
                to="/hub"
                className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-(--lp-ink) hover:text-(--lp-green) transition-colors"
              >
                <LayoutGrid className="size-3.5" />
                Attendee Hub
              </Link>
              <UserAvatarMenu tone="landing" />
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-(--lp-line-soft) pl-5">
              <Link
                to="/login"
                className="font-mono text-xs font-medium uppercase tracking-wider text-(--lp-ink) hover:text-(--lp-green)"
              >
                Sign In
              </Link>
              <a href="#start" data-magnet className="lp-cta !h-10 !px-5 !text-xs">
                Open box office
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/hub" className="lp-cta !h-9 !px-3 !text-[11px]">
                Hub
              </Link>
              <UserAvatarMenu tone="landing" />
            </div>
          ) : (
            <Link to="/login" className="lp-cta !h-9 !px-3 !text-[11px]">
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
