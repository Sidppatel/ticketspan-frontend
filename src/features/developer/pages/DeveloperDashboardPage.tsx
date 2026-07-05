import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Building2, DollarSign, Landmark, Users } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getDeveloperDashboard,
  listTenants,
  achEnabledCount,
  getDeveloperLogs,
} from '@/features/developer/services/developerService';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { CountUp } from '@/shared/motion/CountUp';
import { Card, CardContent } from '@/shared/ui/card';

function heroGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning, architect.';
  if (hour < 18) return 'Good afternoon, architect.';
  return 'Good evening, architect.';
}

function humanizeAction(action: string, entityType: string) {
  const clean = (part: string) =>
    /^[A-Za-z_-]+$/.test(part) ? part.replaceAll('_', ' ').replaceAll('-', ' ').toLowerCase() : part;
  return [clean(action), clean(entityType)].filter(Boolean).join(' · ');
}

const QUICK_ACTIONS = [
  {
    to: '/tenants',
    title: 'Tenants',
    blurb: 'Every team running on your platform.',
    icon: Building2,
  },
  {
    to: '/reporting-access',
    title: 'ACH & reporting',
    blurb: 'Who can take bank transfers, who sees reports.',
    icon: Landmark,
  },
  {
    to: '/revenue',
    title: 'Revenue',
    blurb: 'What the platform earned, month by month.',
    icon: DollarSign,
  },
];

export function DeveloperDashboardPage() {
  const { data, loading, error } = useAsync(useCallback(() => getDeveloperDashboard(), []));
  const tenants = useAsync(useCallback(() => listTenants(), []));
  const logs = useAsync(useCallback(() => getDeveloperLogs(), []));
  const achCount = tenants.data ? achEnabledCount(tenants.data) : null;

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-2xl border border-hairline bg-stage text-on-stage shadow-[var(--shadow-e2)]">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute right-24 top-10 h-32 w-32 rounded-full bg-marigold/20 blur-2xl" />
        <div className="relative space-y-3 p-7 md:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-on-stage-soft">
            Platform command center
          </span>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {heroGreeting()}
          </h1>
          <p className="max-w-xl text-sm text-on-stage-soft md:text-base">
            You built the ecosystem everyone else runs on. Here's how it's breathing right now.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn't reach the platform stats. Try again in a moment — we logged it.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)
        ) : data ? (
          <>
            <Stat
              icon={<Building2 />}
              label="Teams trust you"
              value={<CountUp value={data.totalTenants} />}
            />
            <Stat
              icon={<DollarSign />}
              label="Platform revenue"
              value={
                <CountUp
                  value={Number(data.platformRevenueCents)}
                  format={(n) => centsToUSD(Math.round(n))}
                />
              }
            />
            <Stat
              icon={<Users />}
              label="People on the platform"
              value={<CountUp value={data.totalUsers} />}
            />
            <Stat
              icon={<Landmark />}
              label="Taking bank transfers"
              value={achCount !== null ? <CountUp value={achCount} /> : '—'}
            />
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Where to next
          </h2>
          <p className="text-sm text-ink-soft">The levers you pull most often.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ to, title, blurb, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card interactive className="h-full">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand [&_svg]:size-4.5">
                    <Icon />
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 font-display text-base font-semibold text-foreground">
                      {title}
                      <ArrowRight className="h-4 w-4 opacity-0 transition-all duration-[180ms] group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </p>
                    <p className="text-sm text-ink-soft">{blurb}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-foreground">
              <Activity className="h-5 w-5 text-brand" /> The platform's pulse
            </h2>
            <p className="text-sm text-ink-soft">The latest things that happened, as they happened.</p>
          </div>
          <Link to="/logs" className="text-sm font-medium text-brand hover:underline">
            All activity →
          </Link>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {(logs.data ?? []).length > 0 ? (
              <ul className="divide-y divide-hairline">
                {(logs.data ?? []).slice(0, 8).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground first-letter:capitalize">
                      {humanizeAction(entry.action, entry.entityType)}
                    </p>
                    <p className="shrink-0 text-xs text-ink-soft">{formatEpoch(entry.timestamp)}</p>
                  </li>
                ))}
              </ul>
            ) : logs.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <p className="p-6 text-sm text-ink-soft">
                All quiet. When tenants and events start moving, you'll see it here first.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className="transition-colors hover:border-hairline-strong">
      <CardContent className="space-y-3 p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand [&_svg]:size-4.5">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-3xl">
            {value}
          </p>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        <div className="h-7 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
