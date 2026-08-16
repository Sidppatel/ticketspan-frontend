import {
  Sparkles,
  Globe,
  Copy,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/cn';
import type { EventCompletion, EventVoice, SectionId } from '@/features/admin/lib/eventInsights';
import type { Event } from '@/shared/proto/event';

export { EditSection } from './EventEditSection';

export function VoiceZone({
  event,
  voice,
  completion,
  startLabel,
  venueName,
  previewHref,
  onPublish,
  onRevert,
  onCopyLink,
}: {
  event: Event;
  voice: EventVoice;
  completion: EventCompletion;
  startLabel: string | null;
  venueName: string | null;
  previewHref: string | null;
  onPublish: () => void;
  onRevert: () => void;
  onCopyLink: () => void;
}) {
  const isPublished = event.status === 'Published';
  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? 'success' : 'warn'} className="font-bold text-[10px] uppercase">
                {isPublished ? 'Live & Published' : 'Draft Mode'}
              </Badge>
              <Badge variant="neutral" className="font-mono text-[10px]">
                {completion.percent}% Complete
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">{voice.headline}</span>
            </div>
            <h2 className="text-xl font-extrabold font-display text-foreground tracking-tight">
              {event.title || 'Untitled Event'}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{startLabel}</span>
              {venueName ? <span>• {venueName}</span> : null}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {previewHref ? (
              <a href={previewHref} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="h-9 text-xs font-bold gap-1.5">
                  <Globe className="size-3.5" /> Public View
                </Button>
              </a>
            ) : null}
            <Button size="sm" variant="outline" onClick={onCopyLink} className="h-9 text-xs font-bold gap-1.5">
              <Copy className="size-3.5" /> Copy Link
            </Button>
            {isPublished ? (
              <Button size="sm" variant="outline" onClick={onRevert} className="h-9 text-xs font-bold">
                Unpublish
              </Button>
            ) : (
              <Button size="sm" onClick={onPublish} className="ticketspan-spring-btn h-9 px-4 text-xs font-bold">
                Publish Event
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhatsNext({
  completion,
  published,
  onOpen,
  onPublish,
}: {
  completion: EventCompletion;
  published: boolean;
  onOpen: (section: SectionId) => void;
  onPublish: () => void;
}) {
  if (published || completion.canPublish) return null;
  return (
    <Card className="border border-amber-500/30 bg-amber-500/5 shadow-sm rounded-2xl overflow-hidden p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5 font-display">
            <Sparkles className="size-4" /> Next Steps to Publish
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {completion.missing.map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item.toLowerCase().includes('ticket')) onOpen('pricing');
                  else if (item.toLowerCase().includes('table')) onOpen('layout');
                  else if (item.toLowerCase().includes('staff')) onOpen('staff');
                  else onOpen('basics');
                }}
                className="text-[11px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                + Add {item}
              </button>
            ))}
          </div>
        </div>
        {completion.missing.length === 0 ? (
          <Button size="sm" onClick={onPublish} className="ticketspan-spring-btn h-9 px-5 text-xs font-bold rounded-xl shadow-md">
            Publish Now
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <Card className={cn('relative overflow-hidden border border-border shadow-sm rounded-2xl', accent && 'border-amber/40 bg-amber/5')}>
      <CardContent className="space-y-2 p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-xl [&_svg]:size-5 shadow-sm border border-black/5',
              accent ? 'bg-amber/20 text-amber' : 'bg-primary/10 text-primary',
            )}
          >
            <Icon />
          </span>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{label}</p>
        </div>
        <p className="font-display text-3xl font-extrabold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
