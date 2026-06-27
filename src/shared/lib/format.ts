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
  const dollars = parseFloat(value);
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
}

export function formatEpoch(value: number | string): string {
  const seconds = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '—';
  }
  return new Date(seconds * 1000).toLocaleString();
}

export function toEpochString(value: string): string {
  if (!value) {
    return '0';
  }
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? String(Math.floor(ms / 1000)) : '0';
}
