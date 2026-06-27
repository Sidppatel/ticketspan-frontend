import { useState } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { useAuth } from '@/shared/auth/useAuth';
import { useDarkMode } from '@/shared/hooks/useDarkMode';
import { roleLabel } from '@/shared/roles';
import { logout } from '@/features/auth/services/authService';
import { cn } from '@/shared/lib/cn';

export interface NavLink {
  to: string;
  label: string;
}

function linkClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  );
}

function Brand({ section, className }: { section?: string; className?: string }) {
  return (
    <span className={cn('font-semibold tracking-tight', className)}>
      <span style={{ color: 'var(--brand-primary)' }}>svyne</span>
      {section ? (
        <>
          <span className="mx-1 text-amber">·</span>
          <span className="text-muted-foreground">{section}</span>
        </>
      ) : null}
    </span>
  );
}

function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function PortalNav({ section, links }: { section?: string; links: NavLink[] }) {
  const { isAuthenticated, user, role } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle>
              <Brand section={section} className="text-lg" />
            </SheetTitle>
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <SheetClose asChild key={link.to}>
                  <RouterNavLink to={link.to} end={link.to === '/'} className={linkClasses}>
                    {link.label}
                  </RouterNavLink>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto border-t border-border pt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <p className="truncate text-sm text-muted-foreground">
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

        <Brand section={section} className="text-base" />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <RouterNavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClasses}>
              {link.label}
            </RouterNavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground lg:inline">{roleLabel(role)}</span>
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
