import { cn } from '@/shared/lib/cn';
import { Compass } from 'lucide-react';

interface EventFooterProps {
  organizerName?: string;
  className?: string;
  light?: boolean;
}

export function EventFooter({ organizerName = 'Organizer', className, light = false }: EventFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      'w-full py-12 border-t mt-16 md:mt-24 transition-colors',
      light 
        ? 'bg-stage border-white/5 text-white/50'
        : 'bg-surface-canvas border-border-strong text-muted-foreground',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Brand column */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-black tracking-tight font-display', light ? 'text-white' : 'text-foreground')}>
              svyne
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-accent-gold/15 text-accent-gold px-2 py-0.5 rounded border border-accent-gold/20">
              Box Office
            </span>
          </div>
          <p className="text-xs leading-relaxed max-w-sm">
            Experience ticket bookings and VIP table seating simplified. Built for premium nightlife, concerts, and exclusive social events.
          </p>
        </div>

        {/* Directory Links */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4">
          <div className="space-y-3 text-xs">
            <h4 className={cn('font-bold uppercase tracking-wider', light ? 'text-white' : 'text-foreground')}>Legals</h4>
            <ul className="space-y-2">
              <li><a href="/terms" className="hover:underline hover:text-accent-burgundy transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:underline hover:text-accent-burgundy transition-colors">Privacy Policy</a></li>
              <li className={light ? 'text-white/70' : 'text-muted-foreground'}>All Sales Final — No Refunds</li>
            </ul>
          </div>
          <div className="space-y-3 text-xs">
            <h4 className={cn('font-bold uppercase tracking-wider', light ? 'text-white' : 'text-foreground')}>Support</h4>
            <ul className="space-y-2">
              <li><a href="/help" className="hover:underline hover:text-accent-burgundy transition-colors">Help Center</a></li>
              <li><a href="/feedback" className="hover:underline hover:text-accent-burgundy transition-colors">Give Feedback</a></li>
              <li><a href="mailto:support@svyne.com" className="hover:underline hover:text-accent-burgundy transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Organizer metadata */}
        <div className="md:col-span-4 space-y-3 text-xs md:text-right">
          <h4 className={cn('font-bold uppercase tracking-wider', light ? 'text-white' : 'text-foreground')}>Presented By</h4>
          <p className="font-bold text-sm text-accent-gold font-display uppercase tracking-wider">{organizerName}</p>
          <div className="flex md:justify-end gap-3 pt-1">
            <a href="#" className="hover:text-accent-burgundy" aria-label="Twitter">𝕏</a>
            <a href="#" className="hover:text-accent-burgundy" aria-label="Instagram">📸</a>
            <a href="#" className="hover:text-accent-burgundy" aria-label="Facebook">🌐</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-dashed border-border-strong flex flex-col md:flex-row justify-between items-center gap-4 text-[10px]">
        <p>© {currentYear} Svyne Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          <Compass className="size-3 text-accent-gold" /> Powered by <span className={cn('font-bold', light ? 'text-white' : 'text-foreground')}>svyne</span>
        </p>
      </div>
    </footer>
  );
}
