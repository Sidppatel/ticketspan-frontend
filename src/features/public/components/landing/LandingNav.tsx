import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLockup } from '@/shared/brand/BrandMark';
import { useAuth } from '@/shared/auth/useAuth';
import { UserAvatarMenu } from '@/shared/components/UserAvatarMenu';
import { ArrowUpRight, LayoutGrid, Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#calculator', label: 'Payout Calculator' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#showcase', label: 'Showcase' },
  { href: '#specs', label: 'Specifications' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
          : 'bg-white/60 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
        <Link to="/" className="flex shrink-0 items-center text-(--lp-ink)" aria-label="TicketSpan home" onClick={closeMenu}>
          <BrandLockup size="sm" tone="ink" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/hub"
                className="flex items-center gap-1.5 rounded-full bg-(--lp-green-ivory) px-3 py-1.5 font-mono text-xs font-semibold text-(--lp-green) transition-colors hover:bg-emerald-200"
              >
                <LayoutGrid className="size-3.5" />
                <span>Attendee Hub</span>
              </Link>
              <UserAvatarMenu tone="landing" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:text-stone-950"
              >
                Sign In
              </Link>
              <a
                href="#start"
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

        <div className="flex items-center gap-2 md:hidden">
          <a
            href="#start"
            className="flex h-8 items-center rounded-full bg-(--lp-green) px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-(--lp-green-soft) active:scale-95"
          >
            <span>Get Started</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white/80 text-stone-800 transition-colors hover:bg-stone-100"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-14 sm:top-16 bottom-0 z-40 bg-white/95 backdrop-blur-2xl px-6 py-6 md:hidden flex flex-col justify-between overflow-y-auto animate-[lp-rise_0.2s_var(--lp-ease)_both]">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400 pb-2">
              Platform Navigation
            </p>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-3.5 py-3 text-base font-semibold text-stone-800 transition-colors hover:bg-stone-50 active:bg-stone-100"
              >
                <span>{link.label}</span>
                <ChevronRight className="size-4 text-stone-400" />
              </a>
            ))}
          </div>

          <div className="pt-6 border-t border-stone-100 space-y-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/hub"
                  onClick={closeMenu}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 font-semibold text-sm text-(--lp-green) border border-emerald-200"
                >
                  <LayoutGrid className="size-4" />
                  <span>Attendee Hub</span>
                </Link>
                <div className="flex justify-center pt-1">
                  <UserAvatarMenu tone="landing" />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 font-semibold text-sm text-stone-800 hover:bg-stone-100 transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href="#start"
                  onClick={closeMenu}
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-(--lp-green) font-semibold text-sm text-white shadow-sm hover:bg-(--lp-green-soft) transition-colors"
                >
                  <span>Open Your Box Office</span>
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            )}
            <p className="text-center font-mono text-[11px] text-stone-400 pt-2">
              Chickasaw, Alabama · Stripe Connect Verified
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
