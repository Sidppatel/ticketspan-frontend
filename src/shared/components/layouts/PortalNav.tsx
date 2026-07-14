import { useState, useEffect } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LayoutDashboard, Calendar, Ticket, User, Settings, ShieldAlert, HeartHandshake, LogOut, Landmark, Users2, MapPin, Palette, Brush } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useAuth } from '@/shared/auth/useAuth';
import { useTenantBranding } from '@/shared/theme/ThemeContext';
import { roleLabel } from '@/shared/roles';
import { cn } from '@/shared/lib/cn';

export interface NavLink {
  to: string;
  label: string;
}


function getLinkIcon(label: string) {
  const iconClass = "h-4 w-4 mr-2.5 transition-colors";
  switch (label.toLowerCase()) {
    case 'dashboard':
      return <LayoutDashboard className={iconClass} />;
    case 'events':
      return <Calendar className={iconClass} />;
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
    case 'financial':
      return <Landmark className={iconClass} />;
    case 'branding':
      return <Brush className={iconClass} />;
    case 'settings':
      return <Settings className={iconClass} />;
    case 'logs':
      return <ShieldAlert className={iconClass} />;
    case 'profile':
      return <User className={iconClass} />;
    default:
      return <Ticket className={iconClass} />;
  }
}

interface LinkGroup {
  title: string;
  links: NavLink[];
}

function groupLinks(links: NavLink[], section?: string): LinkGroup[] {
  if (section === 'staff') {
    return [{ title: 'Operations', links }];
  }
  
  const monitor = ['Dashboard', 'Bookings'];
  const manage = ['Events', 'Venues', 'Performers', 'Sponsors'];
  
  const monitorLinks = links.filter(l => monitor.includes(l.label));
  const manageLinks = links.filter(l => manage.includes(l.label));
  const configLinks = links.filter(l => !monitor.includes(l.label) && !manage.includes(l.label));
  
  const groups: LinkGroup[] = [];
  if (monitorLinks.length > 0) groups.push({ title: 'Monitor', links: monitorLinks });
  if (manageLinks.length > 0) groups.push({ title: 'Manage', links: manageLinks });
  if (configLinks.length > 0) groups.push({ title: 'Configuration', links: configLinks });
  
  return groups;
}

function Brand({ section, className, onStage }: { section?: string; className?: string; onStage?: boolean }) {
  const { branding, tenantSlug } = useTenantBranding();
  const showTenantBrand = !section && tenantSlug !== '' && (branding.logoUrl !== null || branding.tenantName !== '');
  if (showTenantBrand) {
    return (
      <span className={cn('font-semibold tracking-tight font-display text-lg flex items-center gap-2', className)}>
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt={branding.tenantName || 'Logo'} className="h-7 w-7 rounded object-contain" />
        ) : null}
        <span className={cn('transition-opacity hover:opacity-80', onStage ? 'text-on-stage' : 'text-foreground')}>
          {branding.tenantName || tenantSlug}
        </span>
      </span>
    );
  }
  return (
    <span className={cn('font-semibold tracking-tight font-display text-lg flex items-center gap-1.5', className)}>
      <span className={cn('transition-opacity hover:opacity-80', onStage ? 'text-on-stage' : 'text-foreground')}>
        entryvine
      </span>
      {section ? (
        <>
          <span className="font-light text-voltage">·</span>
          <span className="text-sm font-medium tracking-normal text-muted-foreground">{section}</span>
        </>
      ) : null}
    </span>
  );
}

export function PortalNav({ section, links, transparent }: { section?: string; links: NavLink[]; transparent?: boolean }) {
  const { isAuthenticated, user, role } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  async function handleLogout() {
    const { logout } = await import('@/features/auth/services/authService');
    await logout();
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
  const isPortal = section === 'admin' || section === 'staff';
  const grouped = groupLinks(links, section);

  
  if (isPortal) {
    return (
      <>
        {}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-4 md:hidden">
          <Brand section={section} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="text-foreground">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card border-r border-border text-foreground flex flex-col p-6 w-72">
              <SheetTitle>
                <Brand section={section} />
              </SheetTitle>
              
              <div className="flex-1 overflow-y-auto mt-6 space-y-6">
                {grouped.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2">{group.title}</p>
                    <nav className="flex flex-col gap-1">
                      {group.links.map((link) => (
                        <SheetClose asChild key={link.to}>
                          <RouterNavLink 
                            to={link.to} 
                            end={link.to === '/'} 
                            className={({ isActive }) => cn(
                              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                              isActive
                                ? 'bg-primary/10 text-primary border-l-2 border-primary rounded-l-none pl-2.5'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            {getLinkIcon(link.label)}
                            {link.label}
                          </RouterNavLink>
                        </SheetClose>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 mt-auto space-y-3">
                <div className="px-2">
                  <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel(role)}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/60 backdrop-blur-xl md:flex">
          <div className="flex h-14 items-center px-6 border-b border-border/40">
            <Brand section={section} />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
            {grouped.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-3">{group.title}</p>
                <nav className="flex flex-col gap-0.5">
                  {group.links.map((link) => (
                    <RouterNavLink 
                      key={link.to} 
                      to={link.to} 
                      end={link.to === '/'} 
                      className={({ isActive }) => cn(
                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary rounded-l-none pl-2.5'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      {getLinkIcon(link.label)}
                      <span className="truncate">{link.label}</span>
                    </RouterNavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 p-4 bg-card/30">
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg mb-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{user?.email}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabel(role)}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </aside>
      </>
    );
  }

  
  return (
    <header
      className={cn(
        'top-0 z-40 w-full border-b transition-all duration-300',
        transparent ? 'fixed' : 'sticky',
        isHeaderTransparent
          ? 'border-transparent bg-transparent py-4'
          : 'border-border/40 bg-background/85 py-2 shadow-lg shadow-black/5 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Brand onStage={isHeaderTransparent} />
          <nav className="hidden items-center gap-1 md:flex">
            {links.length > 5 ? (
              <>
                {links.slice(0, 4).map((link) => (
                  <RouterNavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) => cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                      isActive
                        ? cn('rounded-none border-b-2 border-brand px-1 py-1', isHeaderTransparent ? 'border-voltage text-on-stage' : 'text-ink')
                        : isHeaderTransparent
                          ? 'text-on-stage-soft hover:text-on-stage'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    )}
                  >
                    {link.label}
                  </RouterNavLink>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 font-medium text-xs h-8 px-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    >
                      More <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex flex-col gap-1 w-44 p-1 shadow-xl border border-border bg-card text-foreground">
                    {links.slice(4).map((link) => (
                      <PopoverClose asChild key={link.to}>
                        <RouterNavLink
                          to={link.to}
                          end={link.to === '/'}
                          className={({ isActive }) => cn(
                            'block w-full text-left rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
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
                  className={({ isActive }) => cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    isActive
                      ? cn('rounded-none border-b-2 border-brand px-1 py-1', isHeaderTransparent ? 'border-voltage text-on-stage' : 'text-ink')
                      : isHeaderTransparent
                        ? 'text-on-stage-soft hover:text-on-stage'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  )}
                >
                  {link.label}
                </RouterNavLink>
              ))
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button variant="outline" size="sm" className="hidden md:inline-flex text-xs h-8" onClick={handleLogout}>
              Sign Out
            </Button>
          ) : (
            <Button size="sm" className="hidden md:inline-flex text-xs h-8" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          )}

          {}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card border-r border-border text-foreground flex flex-col p-6 w-72">
              <SheetTitle>
                <Brand />
              </SheetTitle>
              <nav className="flex flex-col gap-1 mt-6">
                {links.map((link) => (
                  <SheetClose asChild key={link.to}>
                    <RouterNavLink 
                      to={link.to} 
                      end={link.to === '/'} 
                      className={({ isActive }) => cn(
                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {link.label}
                    </RouterNavLink>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto border-t border-border pt-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {user?.email}
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={handleLogout}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" className="w-full text-xs h-8" onClick={() => navigate('/login')}>
                    Sign in
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
