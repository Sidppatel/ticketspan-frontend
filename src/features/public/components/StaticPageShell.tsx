import type { ReactNode } from 'react';

interface StaticPageShellProps {
  eyebrow: string;
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}

export function StaticPageShell({ eyebrow, title, intro, updated, children }: StaticPageShellProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0 py-8 md:py-14">
      <header className="mb-10 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-gold">{eyebrow}</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display text-foreground">{title}</h1>
        {intro ? <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">{intro}</p> : null}
        {updated ? <p className="text-xs text-muted-foreground/70">Last updated: {updated}</p> : null}
      </header>
      <div className="space-y-10">{children}</div>
    </div>
  );
}

interface StaticSectionProps {
  heading: string;
  children: ReactNode;
}

export function StaticSection({ heading, children }: StaticSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold tracking-tight text-foreground border-b border-border-strong pb-2">{heading}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
