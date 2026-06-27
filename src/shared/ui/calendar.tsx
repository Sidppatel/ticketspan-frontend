import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { cn } from '@/shared/lib/cn';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, style, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn(
        '[&_.rdp-chevron]:fill-amber',
        className,
      )}
      style={{
        '--rdp-accent-color': 'var(--color-amber)',
        '--rdp-accent-background-color': 'var(--color-accent)',
        '--rdp-today-color': 'var(--color-amber)',
        ...style,
      } as React.CSSProperties}
      {...props}
    />
  );
}
