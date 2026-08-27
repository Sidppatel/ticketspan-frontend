import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { zoneAbbrev } from '@/shared/lib/timezone';

const FORMAT = "yyyy-MM-dd'T'HH:mm";

export function DateTimePicker({
  value,
  onChange,
  timeZone,
  fallbackDate,
}: {
  value: string;
  onChange: (value: string) => void;
  timeZone?: string;
  fallbackDate?: string;
}) {
  const parsed = value ? parse(value, FORMAT, new Date(0)) : undefined;
  const fallbackParsed = fallbackDate ? parse(fallbackDate, FORMAT, new Date(0)) : undefined;
  const defaultMonth = parsed ?? fallbackParsed ?? undefined;

  const h24 = parsed ? parsed.getHours() : 0;
  const m = parsed ? parsed.getMinutes() : 0;
  const isPM = parsed ? h24 >= 12 : false;
  const h12 = h24 % 12 || 12;

  const [hourStr, setHourStr] = React.useState('');
  const [minStr, setMinStr] = React.useState('');
  const [dateStr, setDateStr] = React.useState(parsed ? format(parsed, 'yyyy-MM-dd') : '');
  const [open, setOpen] = React.useState(false);
  const [prevValue, setPrevValue] = React.useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDateStr(parsed ? format(parsed, 'yyyy-MM-dd') : '');
    if (parsed) {
      const p_h12 = parsed.getHours() % 12 || 12;
      const p_m = parsed.getMinutes();
      const localH = parseInt(hourStr, 10);
      const localM = parseInt(minStr, 10);

      if (isNaN(localH) || p_h12 !== localH) {
        setHourStr(p_h12.toString().padStart(2, '0'));
      }
      if (isNaN(localM) || p_m !== localM) {
        setMinStr(p_m.toString().padStart(2, '0'));
      }
    } else {
      setHourStr('');
      setMinStr('');
    }
  }

  function updateTime(h12Num: number, mNum: number, pm: boolean) {
    const day = parsed || new Date();
    let h24Num = h12Num;
    if (pm && h24Num !== 12) h24Num += 12;
    if (!pm && h24Num === 12) h24Num = 0;
    onChange(`${format(day, 'yyyy-MM-dd')}T${h24Num.toString().padStart(2, '0')}:${mNum.toString().padStart(2, '0')}`);
  }

  function setDay(day: Date | undefined) {
    if (!day) {
      onChange('');
      return;
    }
    onChange(`${format(day, 'yyyy-MM-dd')}T${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDateStr(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v) && isValid(parse(v, 'yyyy-MM-dd', new Date(0)))) {
      onChange(`${v}T${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }

  function handleDateBlur() {
    if (dateStr === '') {
      onChange('');
      return;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && isValid(parse(dateStr, 'yyyy-MM-dd', new Date(0)))) {
      return;
    }
    setDateStr(parsed ? format(parsed, 'yyyy-MM-dd') : '');
  }

  function handleHourChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2 && v.startsWith('0')) v = v.slice(1);
    else if (v.length > 2) v = v.slice(0, 2);
    setHourStr(v);

    const num = parseInt(v, 10);
    if (!isNaN(num) && num > 0 && num <= 12) {
      updateTime(num, m, isPM);
    }
  }

  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2 && v.startsWith('0')) v = v.slice(1);
    else if (v.length > 2) v = v.slice(0, 2);
    setMinStr(v);

    const num = parseInt(v, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      updateTime(h12, num, isPM);
    }
  }

  function handleHourBlur() {
    let num = parseInt(hourStr, 10);
    if (isNaN(num) || num < 1 || num > 12) num = 12;
    setHourStr(num.toString().padStart(2, '0'));
    updateTime(num, m, isPM);
  }

  function handleMinBlur() {
    let num = parseInt(minStr, 10);
    if (isNaN(num) || num < 0 || num > 59) num = 0;
    setMinStr(num.toString().padStart(2, '0'));
    updateTime(h12, num, isPM);
  }

  function toggleAmPm() {
    updateTime(h12, m, !isPM);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative w-40">
          <input
            className="h-10 w-full rounded-md border border-input bg-transparent pl-3 pr-9 text-sm shadow-sm tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="YYYY-MM-DD"
            inputMode="numeric"
            value={dateStr}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open calendar"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            selected={parsed}
            defaultMonth={defaultMonth}
            onSelect={(d) => {
              setDay(d);
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1 rounded-md border border-input bg-transparent h-10 px-3 py-2 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
        <input
          className="w-5 bg-transparent text-center focus:outline-none placeholder:text-muted-foreground tabular-nums"
          placeholder="12"
          value={hourStr}
          onChange={handleHourChange}
          onBlur={handleHourBlur}
        />
        <span className="text-muted-foreground font-medium">:</span>
        <input
          className="w-5 bg-transparent text-center focus:outline-none placeholder:text-muted-foreground tabular-nums"
          placeholder="00"
          value={minStr}
          onChange={handleMinChange}
          onBlur={handleMinBlur}
        />
        <button
          type="button"
          onClick={toggleAmPm}
          className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground select-none"
        >
          {parsed ? (isPM ? 'PM' : 'AM') : 'AM'}
        </button>
      </div>
      {timeZone ? (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {zoneAbbrev(timeZone)}
        </span>
      ) : null}
    </div>
  );
}
