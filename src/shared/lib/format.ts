export function centsToUSD(value: number | string): string {
  const cents = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(cents)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function centsToUsdInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function usdToCents(value: string): number {
  const dollars = parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
}

export function formatEpoch(value: number | string): string {
  const seconds = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '—';
  }
  return new Date(seconds * 1000).toLocaleString();
}

export function formatEventDate(value: number | string): string {
  const seconds = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '';
  }
  return new Date(seconds * 1000).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMonth(value: number | string): string {
  const seconds = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '—';
  }
  return new Date(seconds * 1000).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function accessWindow(
  startEpoch: number | string,
  endEpoch: number | string,
): { from: string; to: string } | null {
  const start = typeof startEpoch === 'string' ? Number(startEpoch) : startEpoch;
  const end = typeof endEpoch === 'string' ? Number(endEpoch) : endEpoch;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === 0 || end === 0) {
    return null;
  }
  const oneDaySeconds = 86400;
  return { from: formatEventDate(start - oneDaySeconds), to: formatEventDate(end + oneDaySeconds) };
}

export function initials(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || first.charAt(0).toUpperCase();
  }
  return (email.trim().charAt(0) || '?').toUpperCase();
}
