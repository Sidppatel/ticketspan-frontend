import { useState, useEffect, useMemo } from 'react';
import { Ticket, Mic2, Clock, MapPin, Info, Award } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface EventTabNavProps {
  hasPerformers?: boolean;
  hasSponsors?: boolean;
  hasTimeline?: boolean;
  hasVenue?: boolean;
  hasExtraInfo?: boolean;
}

export function EventTabNav({
  hasPerformers = true,
  hasSponsors = false,
  hasTimeline = true,
  hasVenue = true,
  hasExtraInfo = true,
}: EventTabNavProps) {
  const [activeTab, setActiveTab] = useState<string>('tickets');

  const tabs = useMemo(
    () => [
      { id: 'tickets', label: 'Tickets', icon: Ticket, targetId: 'booking-panel' },
      ...(hasPerformers ? [{ id: 'performers', label: 'Lineup', icon: Mic2, targetId: 'performers-section' }] : []),
      ...(hasSponsors ? [{ id: 'sponsors', label: 'Sponsors', icon: Award, targetId: 'sponsors-section' }] : []),
      ...(hasTimeline ? [{ id: 'schedule', label: 'Schedule', icon: Clock, targetId: 'schedule-section' }] : []),
      ...(hasVenue ? [{ id: 'venue', label: 'Venue', icon: MapPin, targetId: 'venue-section' }] : []),
      ...(hasExtraInfo ? [{ id: 'details', label: 'Details', icon: Info, targetId: 'details-section' }] : []),
    ],
    [hasPerformers, hasSponsors, hasTimeline, hasVenue, hasExtraInfo],
  );

  const handleTabClick = (targetId: string, id: string) => {
    setActiveTab(id);
    const element = document.getElementById(targetId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (let i = tabs.length - 1; i >= 0; i--) {
        const tab = tabs[i];
        const el = document.getElementById(tab.targetId);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveTab(tab.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tabs]);

  return (
    <nav
      aria-label="Event navigation"
      className="sticky top-0 z-30 w-full border-y border-border-soft bg-surface-canvas/90 backdrop-blur-md transition-all"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabClick(t.targetId, t.id)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand border',
                  isActive
                    ? 'bg-foreground text-background shadow-sm border-transparent'
                    : 'border-transparent text-ink/80 hover:bg-surface-card hover:text-ink hover:border-border-soft',
                )}
              >
                <Icon className={cn('size-3.5', isActive ? 'text-background' : 'text-brand')} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
