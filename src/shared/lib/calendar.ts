export function createGoogleCalendarUrl({
  title,
  startEpoch,
  venue,
  description,
}: {
  title: string;
  startEpoch: string | number;
  venue?: string;
  description?: string;
}): string {
  const startSec = Number(startEpoch);
  if (!startSec) return '';
  const startDate = new Date(startSec * 1000);
  const endDate = new Date((startSec + 3 * 3600) * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const dates = `${fmt(startDate)}/${fmt(endDate)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    details: description || `Ticket pass for ${title}`,
    location: venue || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
