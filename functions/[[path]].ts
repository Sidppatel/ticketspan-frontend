interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  VITE_BACKEND_URL?: string;
}

const ROUTES: Record<string, { service: string; method: string }> = {
  events: { service: 'ticketspan.event.EventService', method: 'GetEventBySlug' },
  performers: { service: 'ticketspan.catalog.PerformerService', method: 'GetPerformerBySlug' },
  sponsors: { service: 'ticketspan.catalog.SponsorService', method: 'GetSponsorBySlug' },
};

function varint(value: number): number[] {
  const out: number[] = [];
  while (value > 0x7f) {
    out.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  out.push(value);
  return out;
}

function encodeSlugRequest(slug: string): Uint8Array {
  const slugBytes = new TextEncoder().encode(slug);
  const body = [0x0a, ...varint(slugBytes.length), ...slugBytes];
  const frame = [0x00, ...varint32(body.length), ...body];
  return Uint8Array.from(frame);
}

function varint32(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function decodeStrings(bytes: Uint8Array): Record<number, string> {
  const fields: Record<number, string> = {};
  let i = 0;
  const readVarint = (): number => {
    let shift = 0;
    let result = 0;
    while (i < bytes.length) {
      const b = bytes[i++];
      result |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    return result >>> 0;
  };
  while (i < bytes.length) {
    const key = readVarint();
    const field = key >>> 3;
    const wire = key & 0x7;
    if (wire === 2) {
      const len = readVarint();
      const slice = bytes.subarray(i, i + len);
      i += len;
      if (!(field in fields)) {
        fields[field] = new TextDecoder().decode(slice);
      }
    } else if (wire === 0) {
      const val = readVarint();
      if (!(field in fields)) {
        fields[field] = val.toString();
      }
    } else if (wire === 1) {
      i += 8;
    } else if (wire === 5) {
      i += 4;
    } else {
      break;
    }
  }
  return fields;
}

function formatEventDate(epochSecondsStr: string): string {
  const seconds = Number(epochSecondsStr);
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

function getMetaDescription(metaJsonStr: string): string {
  try {
    const meta = JSON.parse(metaJsonStr || '[]');
    if (Array.isArray(meta)) {
      const descItem = meta.find(
        (item: unknown) =>
          item &&
          typeof item === 'object' &&
          'key' in item &&
          typeof (item as Record<string, unknown>).key === 'string' &&
          String((item as Record<string, unknown>).key).toLowerCase() === 'description',
      ) as Record<string, unknown> | undefined;
      return typeof descItem?.value === 'string' ? descItem.value : '';
    }
  } catch (e) {
    void e;
  }
  return '';
}

function firstDataFrame(b64: string): Uint8Array | null {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  let i = 0;
  while (i + 5 <= raw.length) {
    const flag = raw[i];
    const len = (raw[i + 1] << 24) | (raw[i + 2] << 16) | (raw[i + 3] << 8) | raw[i + 4];
    const start = i + 5;
    if ((flag & 0x80) === 0) {
      return raw.subarray(start, start + len);
    }
    i = start + len;
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const route = segments.length === 2 ? ROUTES[segments[0]] : undefined;

  if (request.method !== 'GET' || !route || !env.VITE_BACKEND_URL) {
    return env.ASSETS.fetch(request);
  }

  const slug = segments[1];
  const tenantSlug = url.hostname.split('.')[0];
  try {
    const grpc = await fetch(`${env.VITE_BACKEND_URL}/${route.service}/${route.method}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/grpc-web-text',
        accept: 'application/grpc-web-text',
        'x-grpc-web': '1',
        'x-tenant-slug': tenantSlug,
      },
      body: btoa(String.fromCharCode(...encodeSlugRequest(slug))),
    });
    const frame = firstDataFrame(await grpc.text());
    if (!frame) {
      return env.ASSETS.fetch(request);
    }
    const fields = decodeStrings(frame);
    const isEvent = segments[0] === 'events';
    const title = isEvent ? fields[3] : fields[2];
    const description = isEvent ? (fields[5] || '') : getMetaDescription(fields[5]);
    const imageId = isEvent ? fields[19] : fields[4];
    if (!title) {
      return env.ASSETS.fetch(request);
    }

    const canonical = `${url.origin}${url.pathname}`;
    const image = imageId ? `${env.VITE_BACKEND_URL}/images/${imageId}` : '';
    const ld = {
      '@context': 'https://schema.org',
      '@type': isEvent ? 'Event' : segments[0] === 'performers' ? 'MusicGroup' : 'Organization',
      name: title,
      description: description || undefined,
      image: image || undefined,
      url: canonical,
    };
    const tags =
      `<title>${escapeHtml(title)}</title>` +
      `<link rel="canonical" href="${escapeHtml(canonical)}"/>` +
      `<meta property="og:url" content="${escapeHtml(canonical)}"/>` +
      `<meta property="og:title" content="${escapeHtml(title)}"/>` +
      (description ? `<meta name="description" content="${escapeHtml(description)}"/>` : '') +
      (description ? `<meta property="og:description" content="${escapeHtml(description)}"/>` : '') +
      (image ? `<meta property="og:image" content="${escapeHtml(image)}"/>` : '') +
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"/>` +
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;

    let customShell = '';
    if (isEvent) {
      const date = formatEventDate(fields[8]);
      const category = fields[7] || '';
      const subtitle = date ? (category ? `${date} — ${category}` : date) : category;
      customShell = `
  <div id="hero-flash"
    style="position:absolute;top:0;left:0;right:0;height:96vh;z-index:1;overflow:hidden;pointer-events:none;background:var(--stage,#191714);color:var(--on-stage,#fffffd)">
    <div style="max-width:80rem;margin:0 auto;padding:7.5rem 1.25rem 0">
      ${subtitle ? `<p style="margin:0;font-family:var(--font-mono-stack),ui-monospace,monospace;font-size:12px;letter-spacing:0.25em;text-transform:uppercase;color:var(--voltage-accent,#d4a574)">${escapeHtml(subtitle)}</p>` : ''}
      <h1 style="margin:1.75rem 0 0;font-family:var(--font-display-stack),Georgia,serif;font-weight:500;line-height:1.05;font-size:clamp(3rem,6.5vw,4.6rem);color:var(--on-stage,#fffffd)">
        ${escapeHtml(title)}</h1>
      ${description ? `<p style="margin:1.5rem 0 0;max-width:42rem;font-family:var(--font-body-stack),system-ui,sans-serif;font-size:16px;line-height:1.6;color:var(--on-stage-soft,#e5e2de);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(description)}</p>` : ''}
    </div>
  </div>`;
    } else {
      customShell = `
  <div id="hero-flash"
    style="position:absolute;top:0;left:0;right:0;height:96vh;z-index:1;overflow:hidden;pointer-events:none;background:var(--canvas,#faf8f5);color:var(--ink,#1c1917)">
    <div style="max-width:80rem;margin:0 auto;padding:7.5rem 1.25rem 0;display:flex;flex-direction:row;gap:2rem;align-items:flex-end">
      ${image ? `<img src="${escapeHtml(image)}" style="width:160px;height:160px;border-radius:12px;object-fit:cover;flex-shrink:0" />` : ''}
      <div>
        <h1 style="margin:0;font-family:var(--font-display-stack),Georgia,serif;font-weight:500;line-height:1.05;font-size:clamp(2.5rem,5.5vw,3.8rem);color:var(--ink,#1c1917)">
          ${escapeHtml(title)}</h1>
        ${description ? `<p style="margin:1.25rem 0 0;max-width:42rem;font-family:var(--font-body-stack),system-ui,sans-serif;font-size:15px;line-height:1.5;color:var(--ink-soft,#57534e);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(description)}</p>` : ''}
      </div>
    </div>
  </div>`;
    }

    const shell = await env.ASSETS.fetch(new Request(url.origin, request));
    let html = await shell.text();

    html = html.replace('</head>', `${tags}</head>`);

    html = html.replace(/<div id="hero-flash"[\s\S]*?<\/div>\s*<\/div>/, customShell.trim());

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch {
    return env.ASSETS.fetch(request);
  }
};
