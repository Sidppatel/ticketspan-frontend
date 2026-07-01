import { useState, useEffect } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useAuth } from '@/shared/auth/useAuth';
import { roleLabel } from '@/shared/roles';
import { logout } from '@/features/auth/services/authService';
import { cn } from '@/shared/lib/cn';

export interface NavLink {
  to: string;
  label: string;
}

function linkClasses({ isActive, transparent }: { isActive: boolean; transparent?: boolean }): string {
  if (transparent) {
    return cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-all duration-300',
      isActive
        ? 'text-accent-gold border-b-2 border-accent-gold rounded-none px-1'
        : 'text-white/70 hover:text-white hover:bg-white/10',
    );
  }
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-marigold/15 text-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  );
}

function Brand({ section, className, transparent }: { section?: string; className?: string; transparent?: boolean }) {
  return (
    <span className={cn('font-semibold tracking-tight', className)}>
      <span className={transparent ? 'text-white' : 'text-primary'}>svyne</span>
      {section ? (
        <>
          <span className="mx-1 text-accent-gold">·</span>
          <span className={transparent ? 'text-white/70' : 'text-muted-foreground'}>{section}</span>
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

  return (
    <header 
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300 border-b',
        isHeaderTransparent
          ? 'bg-transparent border-transparent py-4'
          : transparent
            ? 'bg-surface-900/80 border-border-soft backdrop-blur-md py-2 shadow-lg text-white'
            : 'bg-card/95 border-border backdrop-blur supports-[backdrop-filter]:bg-card/80 py-2'
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className={cn('md:hidden', transparent && 'text-white')} aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className={transparent ? 'bg-surface-900 border-border-soft text-white' : ''}>
            <SheetTitle>
              <Brand section={section} className="text-lg" transparent={transparent} />
            </SheetTitle>
            <nav className="flex flex-col gap-1 mt-4">
              {links.map((link) => (
                <SheetClose asChild key={link.to}>
                  <RouterNavLink 
                    to={link.to} 
                    end={link.to === '/'} 
                    className={(nav) => linkClasses({ isActive: nav.isActive, transparent })}
                  >
                    {link.label}
                  </RouterNavLink>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto border-t border-border-soft pt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <p className={cn('truncate text-sm', transparent ? 'text-white/60' : 'text-muted-foreground')}>
                    {user?.email}
                    <span className="block text-xs">{roleLabel(role)}</span>
                  </p>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="w-full" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Brand section={section} className="text-base" transparent={transparent} />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.length > 5 ? (
            <>
              {links.slice(0, 4).map((link) => (
                <RouterNavLink 
                  key={link.to} 
                  to={link.to} 
                  end={link.to === '/'} 
                  className={(nav) => linkClasses({ isActive: nav.isActive, transparent })}
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
                      'gap-1 font-medium text-sm h-9 px-3',
                      transparent ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    More <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={cn(
                  'flex flex-col gap-1 w-48 p-1 shadow-md border',
                  transparent ? 'bg-surface-900 border-border-soft text-white' : 'bg-card border-border'
                )}>
                  {links.slice(4).map((link) => (
                    <RouterNavLink 
                      key={link.to} 
                      to={link.to} 
                      end={link.to === '/'} 
                      className={(nav) => cn(linkClasses({ isActive: nav.isActive, transparent }), 'block w-full text-left')}
                    >
                      {link.label}
                    </RouterNavLink>
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
                className={(nav) => linkClasses({ isActive: nav.isActive, transparent })}
              >
                {link.label}
              </RouterNavLink>
            ))
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className={cn('hidden text-sm lg:inline', transparent ? 'text-white/60' : 'text-muted-foreground')}>
                {roleLabel(role)}
              </span>
              <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button size="sm" className="hidden md:inline-flex" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
