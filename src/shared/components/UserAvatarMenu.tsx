import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/shared/ui/popover';
import { useAuth } from '@/shared/auth/useAuth';
import { isTenantSubdomain, getRootDomainUrl } from '@/shared/subdomain';
import { Roles } from '@/shared/roles';
import { BrandMark } from '@/shared/brand/BrandMark';
import { cn } from '@/shared/lib/cn';
import {
  Ticket,
  Receipt,
  LayoutGrid,
  User,
  LogOut,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { UserProfile } from '@/shared/proto/auth';

interface UserAvatarMenuProps {
  className?: string;
  tone?: 'default' | 'landing' | 'landing-ivory' | 'on-stage';
}

function getUserInitials(user?: UserProfile | null): string {
  if (!user) return 'UA';
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();

  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  if (first) {
    return first.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    const prefix = user.email.split('@')[0].replace(/[0-9]/g, '');
    const clean = prefix.replace(/[._-]/g, ' ').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  }
  return 'UA';
}

export function UserAvatarMenu({ className, tone = 'default' }: UserAvatarMenuProps) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const onTenant = isTenantSubdomain();
  const [imgError, setImgError] = useState(false);

  const displayName = useMemo(() => {
    const first = (user?.firstName || '').trim();
    const last = (user?.lastName || '').trim();
    if (first && last) {
      return `${first} ${last}`;
    }
    if (first) {
      return first;
    }
    if (last) {
      return last;
    }
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix
        .replace(/[._-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return 'Attendee';
  }, [user]);

  const initials = getUserInitials(user);

  const hasAvatar = Boolean(
    !imgError &&
      user?.avatarUrl &&
      typeof user.avatarUrl === 'string' &&
      user.avatarUrl.trim() !== '' &&
      (user.avatarUrl.startsWith('http://') ||
        user.avatarUrl.startsWith('https://') ||
        user.avatarUrl.startsWith('/') ||
        user.avatarUrl.startsWith('data:')),
  );

  const handleLogout = async () => {
    const { logout: authLogout } = await import('@/features/auth/services/authService');
    await authLogout();
    logout();
    if (onTenant) {
      window.location.reload();
    } else {
      navigate('/login');
    }
  };

  const navItems = [
    {
      label: 'My Passes & Tickets',
      subtitle: 'QR entry codes & reservations',
      icon: Ticket,
      path: '/tickets',
      accent: 'text-amber-500 bg-amber-500/10',
    },
    {
      label: 'My Bookings & Invoices',
      subtitle: 'Receipts & payment history',
      icon: Receipt,
      path: '/bookings',
      accent: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Attendee Hub',
      subtitle: 'Directory & wallet overview',
      icon: LayoutGrid,
      path: '/hub',
      accent: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Account & Profile',
      subtitle: 'Personal settings & security',
      icon: User,
      path: '/profile',
      accent: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open user profile menu"
          className={cn(
            'group relative flex size-9 items-center justify-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 overflow-hidden shadow-sm',
            tone === 'on-stage'
              ? 'border-white/30 bg-white/15 text-white hover:border-white/60 hover:bg-white/25'
              : tone === 'landing' || tone === 'landing-ivory'
              ? 'border-[#262626]/25 bg-[#262626]/5 text-[#171717] hover:border-[#171717]/50 hover:bg-[#171717]/10'
              : 'border-border/80 bg-card text-foreground hover:border-primary/60 hover:bg-primary/10',
            className,
          )}
        >
          {hasAvatar ? (
            <img
              src={user?.avatarUrl}
              alt=""
              onError={() => setImgError(true)}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <span className="font-mono text-xs font-extrabold tracking-wider">{initials}</span>
          )}
          <span
            className={cn(
              'absolute bottom-0 right-0 size-2.5 rounded-full border-2',
              tone === 'on-stage'
                ? 'border-[#0d1017] bg-emerald-400'
                : tone === 'landing' || tone === 'landing-ivory'
                ? 'border-[#fbf8f2] bg-emerald-600'
                : 'border-background bg-emerald-500',
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-0 text-card-foreground shadow-2xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95"
      >
        {}
        <div className="border-b border-border/60 bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            {hasAvatar ? (
              <img
                src={user?.avatarUrl}
                alt=""
                onError={() => setImgError(true)}
                className="size-10 rounded-full object-cover border border-primary/20 shadow-md shrink-0"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground shadow-md">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold text-foreground">
                {displayName}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const targetUrl = onTenant ? getRootDomainUrl(item.path) : item.path;

            const content = (
              <div className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-muted group">
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', item.accent)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                {onTenant ? (
                  <ExternalLink className="size-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                ) : null}
              </div>
            );

            return (
              <PopoverClose asChild key={item.path}>
                {onTenant ? (
                  <a href={targetUrl} className="block">
                    {content}
                  </a>
                ) : (
                  <Link to={targetUrl} className="block">
                    {content}
                  </Link>
                )}
              </PopoverClose>
            );
          })}

          {}
          {role === Roles.Staff || role === Roles.Admin || role === Roles.SubTenant ? (
            <PopoverClose asChild>
              <Link
                to="/staff"
                className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted group border-t border-border/40 mt-1 pt-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <ShieldAlert className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                    Staff Check-In
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">
                    QR scanner & attendee entry
                  </p>
                </div>
              </Link>
            </PopoverClose>
          ) : null}
        </div>

        {}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 opacity-60">
            <BrandMark className="size-4 text-foreground" />
            <span className="font-display text-[11px] font-bold tracking-tight">TicketSpan</span>
          </div>
          <PopoverClose asChild>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
