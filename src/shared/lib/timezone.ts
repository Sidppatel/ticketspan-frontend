export const DEFAULT_TIMEZONE = 'America/Chicago';

const STATE_TIMEZONE: Record<string, string> = {
  ct: 'America/New_York', de: 'America/New_York', dc: 'America/New_York',
  fl: 'America/New_York', ga: 'America/New_York', in: 'America/New_York',
  ky: 'America/New_York', me: 'America/New_York', md: 'America/New_York',
  ma: 'America/New_York', mi: 'America/New_York', nh: 'America/New_York',
  nj: 'America/New_York', ny: 'America/New_York', nc: 'America/New_York',
  oh: 'America/New_York', pa: 'America/New_York', ri: 'America/New_York',
  sc: 'America/New_York', vt: 'America/New_York', va: 'America/New_York',
  wv: 'America/New_York',
  al: 'America/Chicago', ar: 'America/Chicago', il: 'America/Chicago',
  ia: 'America/Chicago', ks: 'America/Chicago', la: 'America/Chicago',
  mn: 'America/Chicago', ms: 'America/Chicago', mo: 'America/Chicago',
  ne: 'America/Chicago', nd: 'America/Chicago', ok: 'America/Chicago',
  sd: 'America/Chicago', tn: 'America/Chicago', tx: 'America/Chicago',
  wi: 'America/Chicago',
  az: 'America/Phoenix', co: 'America/Denver', id: 'America/Denver',
  mt: 'America/Denver', nm: 'America/Denver', ut: 'America/Denver',
  wy: 'America/Denver',
  ca: 'America/Los_Angeles', nv: 'America/Los_Angeles',
  or: 'America/Los_Angeles', wa: 'America/Los_Angeles',
  ak: 'America/Anchorage', hi: 'Pacific/Honolulu',
};

const NAME_TO_CODE: Record<string, string> = {
  connecticut: 'ct', delaware: 'de', 'district of columbia': 'dc', florida: 'fl',
  georgia: 'ga', indiana: 'in', kentucky: 'ky', maine: 'me', maryland: 'md',
  massachusetts: 'ma', michigan: 'mi', 'new hampshire': 'nh', 'new jersey': 'nj',
  'new york': 'ny', 'north carolina': 'nc', ohio: 'oh', pennsylvania: 'pa',
  'rhode island': 'ri', 'south carolina': 'sc', vermont: 'vt', virginia: 'va',
  'west virginia': 'wv', alabama: 'al', arkansas: 'ar', illinois: 'il', iowa: 'ia',
  kansas: 'ks', louisiana: 'la', minnesota: 'mn', mississippi: 'ms', missouri: 'mo',
  nebraska: 'ne', 'north dakota': 'nd', oklahoma: 'ok', 'south dakota': 'sd',
  tennessee: 'tn', texas: 'tx', wisconsin: 'wi', arizona: 'az', colorado: 'co',
  idaho: 'id', montana: 'mt', 'new mexico': 'nm', utah: 'ut', wyoming: 'wy',
  california: 'ca', nevada: 'nv', oregon: 'or', washington: 'wa', alaska: 'ak',
  hawaii: 'hi',
};

export function tzForState(state: string | undefined | null): string {
  if (!state) {
    return DEFAULT_TIMEZONE;
  }
  const key = state.trim().toLowerCase();
  const code = key.length === 2 ? key : NAME_TO_CODE[key];
  return (code && STATE_TIMEZONE[code]) || DEFAULT_TIMEZONE;
}

function partsInZone(date: Date, timeZone: string): Record<string, string> {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const out: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') {
      out[part.type] = part.value === '24' ? '00' : part.value;
    }
  }
  return out;
}

function zoneOffsetMs(utc: Date, timeZone: string): number {
  const p = partsInZone(utc, timeZone);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - utc.getTime();
}

export function epochToZonedInput(epoch: string | number, timeZone: string): string {
  const seconds = Number(epoch);
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '';
  }
  const p = partsInZone(new Date(seconds * 1000), timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function zonedInputToEpoch(input: string, timeZone: string): string {
  if (!input) {
    return '0';
  }
  const [datePart, timePart] = input.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = (timePart ?? '0:0').split(':').map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offset = zoneOffsetMs(new Date(asUtc), timeZone);
  return String(Math.floor((asUtc - offset) / 1000));
}

export function formatEpochInZone(epoch: string | number, timeZone: string): string {
  const seconds = Number(epoch);
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(seconds * 1000),
  );
}

export function formatTimeInZone(epoch: string | number, timeZone: string): string {
  const seconds = Number(epoch);
  if (!Number.isFinite(seconds) || seconds === 0) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', { timeZone, timeStyle: 'short' }).format(
    new Date(seconds * 1000),
  );
}

export function formatTimeRangeInZone(
  startEpoch: string | number,
  endEpoch: string | number,
  timeZone: string,
): string {
  return `${formatTimeInZone(startEpoch, timeZone)} – ${formatTimeInZone(endEpoch, timeZone)}`;
}

export function epochSeconds(epoch: string | number): number {
  const seconds = Number(epoch);
  return Number.isFinite(seconds) ? seconds : 0;
}

export function zoneAbbrev(timeZone: string, epoch?: string | number): string {
  const seconds = epoch ? Number(epoch) : Math.floor(Date.now() / 1000);
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' });
  return dtf.formatToParts(new Date(seconds * 1000)).find((p) => p.type === 'timeZoneName')?.value ?? '';
}
