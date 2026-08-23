import { CircleAlert, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { SectionId } from '@/features/admin/lib/eventInsights';

export interface SectionItem {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  hint: string;
}

interface EventSectionNavProps {
  sections: SectionItem[];
  completion: { items: { section: SectionId; weight: string; done: boolean }[] };
  activeSection: SectionId;
  openSection: (section: SectionId) => void;
}

export function EventSectionNav({
  sections,
  completion,
  activeSection,
  openSection,
}: EventSectionNavProps) {
  return (
    <div id="section-canvas" className="scroll-mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => {
        const items = completion.items.filter((i) => i.section === section.id);
        const needsAttention = items.some((i) => i.weight === 'critical' && !i.done);
        const allDone = items.length > 0 && items.every((i) => i.done);
        const isActive = section.id === activeSection;
        return (
          <button
            key={section.id}
            onClick={() => openSection(section.id)}
            className={cn(
              'group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
              isActive ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card',
            )}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground',
              )}
            >
              <section.icon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                {section.label}
                {needsAttention ? (
                  <CircleAlert className="size-3.5 text-amber-foreground" />
                ) : allDone ? (
                  <CheckCircle2 className="size-3.5 text-success" />
                ) : null}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{section.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
