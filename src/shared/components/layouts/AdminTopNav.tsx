import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  ChevronDown,
  Home,
  LayoutGrid,
  LogOut,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Ticket,
  User,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from '@/shared/ui/drawer';
import { useAuth } from '@/shared/auth/useAuth';
import { canManageTenantSettings, isEventManager, roleLabel } from '@/shared/roles';
import { buildGreeting } from '@/features/admin/lib/dashboardInsights';
import { initials } from '@/shared/lib/format';
import { logout } from '@/features/auth/services/authService';
import { cn } from '@/shared/lib/cn';
import type { NavLink as NavLinkItem } from '@/shared/components/layouts/PortalNav';

interface NavGroup {
  label: string;
  links: NavLinkItem[];
}

function GreetingIcon({ phase }: { phase: 'morning' | 'afternoon' | 'evening' }) {
  const cls = 'h-4 w-4 text-marigold';
  if (phase === 'morning') return <Sun className={cls} />;
  if (phase === 'afternoon') return <Sunset className={cls} />;
  return <Moon className={cls} />;
}

function tabClass(isActive: boolean) {
  return cn(
    'inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors',
    isActive
      ? 'border-brand text-brand'
      : 'border-transparent text-muted-foreground hover:border-hairline-strong hover:text-foreground',
  );
}

function GroupTab({ group, pathname }: { group: NavGroup; pathname: string }) {
  const active = group.links.some((l) => pathname.startsWith(l.to));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={tabClass(active)}>
          {group.label} <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-48 flex-col gap-0.5 p-1.5">
        {group.links.map((link) => (
          <PopoverClose asChild key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          </PopoverClose>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function AdminTopNav() {
  const { user, role } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const manager = isEventManager(role);
  const owner = canManageTenantSettings(role);
  const greeting = buildGreeting(user?.firstName ?? '', 0, 0, new Date());

  const primary: NavLinkItem[] = manager
    ? [{ to: '/events', label: 'Events' }]
    : [
        { to: '/', label: 'Dashboard' },
        { to: '/events', label: 'Events' },
        { to: '/bookings', label: 'Bookings' },
      ];

  const groups: NavGroup[] = manager
    ? []
    : [
        {
          label: 'Your setup',
          links: [
            { to: '/venues', label: 'Venues' },
            { to: '/table-types', label: 'Table Types' },
            { to: '/performers', label: 'Performers' },
            { to: '/sponsors', label: 'Sponsors' },
          ],
        },
        {
          label: 'Studio',
          links: [
            ...(owner
              ? [
                  { to: '/branding', label: 'Branding' },
                  { to: '/invitations', label: 'Invitations' },
                  { to: '/financial', label: 'Financial' },
                  { to: '/settings', label: 'Settings' },
                ]
              : []),
            { to: '/feedback', label: 'Feedback' },
            { to: '/logs', label: 'Logs' },
          ],
        },
      ];

  const everything = [...primary, ...groups.flatMap((g) => g.links), { to: '/profile', label: 'Profile' }];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-display text-lg font-semibold tracking-tight">
              svyne <span className="font-light text-voltage">·</span>{' '}
              <span className="text-sm font-medium tracking-normal text-muted-foreground">admin</span>
            </span>
            <span
              className={cn(
                'hidden items-center gap-1.5 truncate text-sm text-ink-soft',
                pathname === '/' ? '' : 'lg:flex',
              )}
            >
              <GreetingIcon phase={greeting.phase} />
              {greeting.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!manager ? (
              <Button size="sm" onClick={() => navigate('/events/new')}>
                <Plus /> <span className="hidden sm:inline">Create event</span>
              </Button>
            ) : null}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Your account"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand transition-transform hover:scale-105"
                >
                  {initials(user?.firstName ?? '', user?.lastName ?? '', user?.email ?? '')}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel(role)}</p>
                </div>
                <PopoverClose asChild>
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-4 w-4" /> Your profile
                  </NavLink>
                </PopoverClose>
                <PopoverClose asChild>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </PopoverClose>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <nav className="mx-auto hidden h-10 max-w-6xl items-center gap-1 px-4 md:flex md:px-6">
          {primary.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => tabClass(isActive)}>
              {link.label}
            </NavLink>
          ))}
          {groups.map((group) => (
            <GroupTab key={group.label} group={group} pathname={pathname} />
          ))}
        </nav>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        {(manager
          ? [
              { to: '/events', label: 'Events', icon: CalendarCheck2, end: false },
              { to: '/profile', label: 'Profile', icon: User, end: false },
            ]
          : [
              { to: '/', label: 'Home', icon: Home, end: true },
              { to: '/events', label: 'Events', icon: CalendarCheck2, end: false },
              { to: '/bookings', label: 'Bookings', icon: Ticket, end: false },
            ]
        ).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-[180ms]',
                isActive ? 'text-brand' : 'text-ink-faint',
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
        {!manager ? (
          <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
            <DrawerTrigger asChild>
              <button className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-faint">
                <LayoutGrid className="size-5" />
                More
              </button>
            </DrawerTrigger>
            <DrawerContent className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <DrawerTitle className="flex items-center justify-center gap-2 font-display text-lg">
                <Sparkles className="h-4 w-4 text-marigold" /> Everything else
              </DrawerTitle>
              <div className="mt-4 grid grid-cols-2 gap-1">
                {everything.map((link) => (
                  <DrawerClose asChild key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </DrawerClose>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        ) : null}
      </nav>
    </>
  );
}
