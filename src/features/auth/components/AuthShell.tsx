import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  blurb: string;
  quote: string;
  children: ReactNode;
}

export function AuthShell({ eyebrow, title, blurb, quote, children }: AuthShellProps) {
  const panel = usePageEntrance<HTMLDivElement>();
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-stage p-12 text-on-stage lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute -bottom-16 right-8 h-56 w-56 rounded-full bg-marigold/20 blur-3xl" />
        <span className="relative font-display text-2xl font-semibold tracking-tight text-on-stage">entryvine</span>
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-on-stage-soft">
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </span>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">{title}</h2>
          <p className="max-w-md text-base text-on-stage-soft">{blurb}</p>
        </div>
        <p className="relative max-w-md font-display text-lg italic leading-snug text-on-stage-soft">
          &ldquo;{quote}&rdquo;
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div ref={panel} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-2xl font-semibold tracking-tight text-brand">entryvine</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
