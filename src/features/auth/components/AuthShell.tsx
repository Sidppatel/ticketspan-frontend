import type { ReactNode } from 'react';
import { BrandLockup } from '@/shared/brand/BrandMark';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';
import { ShieldCheck, Zap, KeyRound, Sparkles, QrCode } from 'lucide-react';

interface AuthShellProps {
  eyebrow?: string;
  title?: string;
  blurb?: string;
  children: ReactNode;
}

export function AuthShell({ eyebrow, title, blurb, children }: AuthShellProps) {
  const panel = usePageEntrance<HTMLDivElement>();

  return (
    <div className="relative grid min-h-screen grid-cols-1 overflow-hidden bg-background text-foreground lg:grid-cols-[1.15fr_1fr]">
      {/* Left Immersive Hero Panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0c10] p-12 text-on-stage lg:flex xl:p-16">
        {/* Subtle Ambient Light Gradients */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 size-[500px] rounded-full bg-amber-500/10 blur-[140px]"
          aria-hidden="true"
        />
        
        {/* Geometric subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
          aria-hidden="true"
        />

        {/* Top Bar with Brand and Identity Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <BrandLockup tone="ivory" size="md" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-voltage backdrop-blur-md">
            <Sparkles className="size-3" /> UNIVERSAL PASS
          </span>
        </div>

        {/* Centerpiece: Ticket Card Hologram & Editorial Typography */}
        <div className="relative z-10 my-auto max-w-lg space-y-8 py-10">
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-400">
              {eyebrow || 'One key to every door'}
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.15] text-white xl:text-5xl">
              {title || 'One account for all your tickets and venues.'}
            </h1>
            <p className="text-base leading-relaxed text-slate-300/80">
              {blurb ||
                'Sign in once to access all your entry passes, reserved tables, and receipts across every partner box office.'}
            </p>
          </div>

          {/* Interactive Floating Pass Card Mockup */}
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl transition-transform duration-500 hover:scale-[1.02]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Universal Access</span>
                <p className="font-display text-lg font-medium text-white">Live Box Office Roster</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-voltage shadow-inner">
                <QrCode className="size-5" />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Tenant</p>
                <p className="font-medium text-slate-200 truncate">All Venues</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Status</p>
                <p className="font-medium text-emerald-400">Verified</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Pass Type</p>
                <p className="font-medium text-voltage truncate">Universal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badges */}
        <div className="relative z-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-voltage" />
            <span>Instant QR Entry</span>
          </div>
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-slate-300" />
            <span>Cross-Domain Session</span>
          </div>
        </div>
      </aside>

      {/* Right Login / Auth Form Container */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10 md:py-16">
        <div ref={panel} className="w-full max-w-md space-y-6">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <BrandLockup className="text-foreground" size="md" />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-primary">
              Universal Auth
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
