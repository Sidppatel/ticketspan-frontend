import { useState, useEffect } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Ticket,
  User,
  Settings,
  ShieldAlert,
  HeartHandshake,
  LogOut,
  Landmark,
  Users2,
  MapPin,
  Palette,
  Brush,
  ExternalLink,
  Building2,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useAuth } from '@/shared/auth/useAuth';
import { BrandLockup } from '@/shared/brand/BrandMark';
import { useTenantBranding } from '@/shared/theme/ThemeContext';
import { roleLabel } from '@/shared/roles';
import { cn } from '@/shared/lib/cn';
import { isTenantSubdomain, getUniversalLoginUrl, getRootDomainUrl } from '@/shared/subdomain';
import { UserAvatarMenu } from '@/shared/components/UserAvatarMenu';

export interface NavLink {
  to: string;
  label: string;
}

function getLinkIcon(label: string) {
  const iconClass = 'size-4 shrink-0 transition-colors';
  switch (label.toLowerCase()) {
    case 'dashboard':
      return <LayoutDashboard className={iconClass} />;
    case 'events':
      return <Calendar className={iconClass} />;
    case 'tenants':
      return <Building2 className={iconClass} />;
    case 'leads':
      return <Users2 className={iconClass} />;
    case 'billing':
      return <DollarSign className={iconClass} />;
    case 'pay per event':
      return <Receipt className={iconClass} />;
    case 'fees':
    case 'fee overrides':
      return <Layers className={iconClass} />;
    case 'revenue':
      return <DollarSign className={iconClass} />;
    case 'tax':
    case 'tax lookup':
    case 'tax remittance':
      return <FileSpreadsheet className={iconClass} />;
    case 'reporting access':
      return <Landmark className={iconClass} />;
    case 'system logs':
    case 'logs':
      return <ShieldAlert className={iconClass} />;
    case 'bookings':
      return <Ticket className={iconClass} />;
    case 'venues':
      return <MapPin className={iconClass} />;
    case 'table types':
      return <Palette className={iconClass} />;
    case 'performers':
      return <Users2 className={iconClass} />;
    case 'sponsors':
      return <HeartHandshake className={iconClass} />;
    case 'staff':
      return <Users2 className={iconClass} />;
    case 'branding':
      return <Brush className={iconClass} />;
    case 'settings':
      return <Settings className={iconClass} />;
    case 'profile':
      return <User className={iconClass} />;
    default:
      return <Ticket className={iconClass} />;
  }
}

function Brand({ section, className, onStage }: { section?: string; className?: string; onStage?: boolean }) {
  const { branding, tenantSlug } = useTenantBranding();
  const onTenant = isTenantSubdomain() || (Boolean(tenantSlug) && !section);

  if (onTenant) {
    const tenantName = branding.tenantName || (tenantSlug ? `${tenantSlug}` : 'Box Office');
    const tenantInitial = tenantName.slice(0, 2).toUpperCase();

    return (
      <RouterNavLink to="/" className={cn('flex items-center gap-2.5 transition-opacity hover:opacity-90', className)}>
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={tenantName}
            className="size-8 rounded-xl border border-border object-contain shadow-xs bg-card p-0.5"
          />
        ) : (
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-xl font-display text-xs font-bold shadow-xs border',
              onStage ? 'border-white/30 bg-white/15 text-white' : 'border-primary/30 bg-primary/10 text-primary',
            )}
          >
            {tenantInitial}
          </div>
        )}
        <span className={cn('font-display text-base font-bold tracking-tight sm:text-lg', onStage ? 'text-white' : 'text-foreground')}>
          {tenantName}
        </span>
      </RouterNavLink>
    );
  }

  return (
    <RouterNavLink to="/" className="flex items-center">
      <BrandLockup
        size="sm"
        section={section}
        className={cn('transition-opacity hover:opacity-90', onStage ? 'text-white' : 'text-foreground', className)}
      />
    </RouterNavLink>
  );
}

import { useCartStore } from '@/shared/lib/cartStore';
import { ShoppingBag } from 'lucide-react';

export function PortalNav({
  section,
  links,
  transparent,
  hideAuth,
}: {
  section?: string;
  links: NavLink[];
  transparent?: boolean;
  hideAuth?: boolean;
}) {
  const { isAuthenticated, user, role } = useAuth();
  const { totalItemCount, setOpen: setCartOpen } = useCartStore();
  const cartItemCount = totalItemCount();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  async function handleLogout() {
    const { logout } = await import('@/features/auth/services/authService');
    await logout();
    navigate('/login');
  }

  function handleSignIn() {
    if (isTenantSubdomain()) {
      window.location.href = getUniversalLoginUrl(window.location.href);
      return;
    }
    navigate('/login');
  }

  useEffect(() => {
    if (!transparent) return;
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  const isHeaderTransparent = transparent && !scrolled;

  if (section === 'staff') {
    return (
      <>
        {/* Mobile top bar for Staff */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md md:hidden">
          <Brand section={section} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="text-foreground">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col border-r border-border bg-card p-6 text-foreground">
              <SheetTitle>
                <Brand section={section} />
              </SheetTitle>

              <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
                <nav className="flex flex-col gap-1">
                  {links.map((link) => (
                    <SheetClose asChild key={link.to}>
                      <RouterNavLink
                        to={link.to}
                        end={link.to === '/staff'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )
                        }
                      >
                        {getLinkIcon(link.label)}
                        {link.label}
                      </RouterNavLink>
                    </SheetClose>
                  ))}
                </nav>
              </div>

              <div className="mt-auto space-y-3 border-t border-border pt-4">
                <div className="px-2">
                  <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel(role)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 size-4" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Desktop Sidebar for Staff */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
          <div className="flex h-14 items-center border-b border-border px-6">
            <Brand section={section} />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <RouterNavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/staff'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {getLinkIcon(link.label)}
                  <span>{link.label}</span>
                </RouterNavLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-border p-4 bg-muted/20">
            <div className="mb-3 px-2">
              <p className="truncate text-xs font-semibold text-foreground">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabel(role)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-1.5 size-3.5" /> Sign Out
            </Button>
          </div>
        </aside>
      </>
    );
  }

  // Developer Portal or Public Portal Header
  return (
    <header
      className={cn(
        'top-0 z-40 w-full border-b transition-all duration-300',
        transparent ? 'fixed' : 'sticky',
        isHeaderTransparent
          ? 'border-transparent bg-transparent py-4'
          : 'border-border bg-card/90 py-2 shadow-xs backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Brand onStage={isHeaderTransparent} section={section} />
          
          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {section === 'developer' ? (
              <div className="flex items-center gap-1 overflow-x-auto">
                {links.map((link) => (
                  <RouterNavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    {link.label}
                  </RouterNavLink>
                ))}
              </div>
            ) : links.length > 5 ? (
              <>
                {links.slice(0, 4).map((link) => (
                  <RouterNavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        isActive
                          ? isHeaderTransparent
                            ? 'bg-white/15 text-white font-bold border border-white/25 shadow-xs backdrop-blur-md'
                            : 'bg-primary/10 text-primary font-semibold'
                          : isHeaderTransparent
                            ? 'text-white/80 hover:text-white hover:bg-white/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )
                    }
                  >
                    {link.label}
                  </RouterNavLink>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'gap-1 text-xs h-8 px-2',
                        isHeaderTransparent
                          ? 'text-white/80 hover:bg-white/10 hover:text-white'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      More <ChevronDown className="size-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex w-44 flex-col gap-1 p-1 shadow-lg border border-border bg-card text-foreground">
                    {links.slice(4).map((link) => (
                      <PopoverClose asChild key={link.to}>
                        <RouterNavLink
                          to={link.to}
                          end={link.to === '/'}
                          className={({ isActive }) =>
                            cn(
                              'block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                              isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )
                          }
                        >
                          {link.label}
                        </RouterNavLink>
                      </PopoverClose>
                    ))}
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              links.map((link) => (
                <RouterNavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? isHeaderTransparent
                          ? 'bg-white/15 text-white font-bold border border-white/25 shadow-xs backdrop-blur-md'
                          : 'bg-primary/10 text-primary font-semibold'
                        : isHeaderTransparent
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )
                  }
                >
                  {link.label}
                </RouterNavLink>
              ))
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Universal Cart Trigger in Navigation */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className={cn(
              'relative flex size-9 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer',
              cartItemCount > 0
                ? isHeaderTransparent
                  ? 'border-amber-400/40 bg-amber-400/20 text-amber-300'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-500'
                : isHeaderTransparent
                  ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
            aria-label="Open Shopping Cart"
          >
            <ShoppingBag className="size-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm ring-2 ring-background">
                {cartItemCount}
              </span>
            )}
          </button>

          {hideAuth ? null : isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
              <UserAvatarMenu tone={isHeaderTransparent ? 'on-stage' : 'default'} />
            </div>
          ) : (
            <Button
              size="sm"
              className={cn(
                'hidden md:inline-flex text-xs h-8 font-semibold',
                isHeaderTransparent ? 'bg-white/15 text-white border border-white/30 hover:bg-white/25' : '',
              )}
              onClick={handleSignIn}
            >
              Sign In
            </Button>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('md:hidden', isHeaderTransparent ? 'text-white hover:bg-white/10' : 'text-foreground')}
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col border-r border-border bg-card p-6 text-foreground">
              <SheetTitle>
                <Brand section={section} />
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-1 overflow-y-auto flex-1">
                {links.map((link) => (
                  <SheetClose asChild key={link.to}>
                    <RouterNavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )
                      }
                    >
                      {getLinkIcon(link.label)}
                      {link.label}
                    </RouterNavLink>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto border-t border-border pt-4">
                {hideAuth ? null : isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Signed In</p>
                      <p className="truncate text-xs font-semibold text-foreground">{user?.email}</p>
                    </div>
                    {isTenantSubdomain() ? (
                      <div className="space-y-1.5">
                        <a
                          href={getRootDomainUrl('/tickets')}
                          className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-2.5 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          <span className="flex items-center gap-2">
                            <Ticket className="size-4" /> My Passes
                          </span>
                          <ExternalLink className="size-3.5 opacity-70" />
                        </a>
                        <a
                          href={getRootDomainUrl('/hub')}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-2.5 font-mono text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <span>Attendee Hub</span>
                          <ExternalLink className="size-3.5 opacity-70" />
                        </a>
                      </div>
                    ) : null}
                    <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={handleLogout}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" className="w-full text-xs h-8" onClick={handleSignIn}>
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
