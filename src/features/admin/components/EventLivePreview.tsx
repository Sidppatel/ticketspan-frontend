import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Monitor, Tablet, Smartphone, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { EventDetailPageContent } from '@/features/public/pages/EventDetailPage';
import type { Event } from '@/shared/proto/event';

interface EventLivePreviewProps {
  event: Event;
  previewUrl: string | null;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export function EventLivePreview({ event, previewUrl }: EventLivePreviewProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!previewUrl) return;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      toast.success('Public event link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenLink = () => {
    if (!previewUrl) return;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const isPublished = event.status === 'Published';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                device === 'desktop'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                device === 'tablet'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                device === 'mobile'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <Badge
            variant={isPublished ? 'success' : 'warn'}
            className="text-xs gap-1 py-1 font-medium"
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                isPublished ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {isPublished ? 'Published Live' : 'Draft Preview'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden xl:flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Sparkles className="h-3 w-3 text-brand" /> Live Bento Studio Preview
          </span>

          {previewUrl ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 gap-1.5 text-xs font-medium border-border/80"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenLink}
                className="h-8 gap-1.5 text-xs font-medium bg-brand text-brand-ink hover:bg-brand/90"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Live Page</span>
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="w-full flex justify-center overflow-x-auto py-2">
        <div
          className={`transition-all duration-300 overflow-hidden border border-border/60 shadow-xl bg-surface-canvas ${
            device === 'desktop'
              ? 'w-full rounded-2xl'
              : device === 'tablet'
                ? 'w-[768px] rounded-2xl max-w-full'
                : 'w-[390px] rounded-[2.5rem] border-[8px] border-stage/90 shadow-2xl max-w-full'
          }`}
        >
          {device === 'mobile' && (
            <div className="w-full bg-stage/90 h-6 flex items-center justify-center">
              <div className="w-20 h-3.5 bg-stage rounded-b-lg border-b border-white/10" />
            </div>
          )}
          <div className="w-full">
            <EventDetailPageContent event={event} isPreview={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
