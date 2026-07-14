interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  VITE_BACKEND_URL?: string;
}

const BOT = /bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|linkedinbot|whatsapp|telegrambot|discordbot|embedly|pinterest|googlebot|bingbot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexity|google-extended|duckassistbot|cohere-ai|ccbot|meta-externalagent|applebot|amazonbot|youbot|bytespider/i;

const ROUTES: Record<string, { service: string; method: string }> = {
  events: { service: 'entryvine.event.EventService', method: 'GetEventBySlug' },
  performers: { service: 'entryvine.catalog.PerformerService', method: 'GetPerformerBySlug' },
  sponsors: { service: 'entryvine.catalog.SponsorService', method: 'GetSponsorBySlug' },
};

// ponytail: hand-rolled gRPC-Web framing for 3 unary slug lookups; the backend is
// gRPC-only (no REST read path) and bundling a full client at the edge is overkill.
// Upgrade path: add a JSON transcoding gateway and fetch that instead.
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
      readVarint();
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
  const ua = request.headers.get('user-agent') ?? '';
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const route = segments.length === 2 ? ROUTES[segments[0]] : undefined;

  if (!BOT.test(ua) || !route || !env.VITE_BACKEND_URL) {
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
    const description = isEvent ? fields[5] : '';
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

    const shell = await env.ASSETS.fetch(new Request(url.origin, request));
    const html = (await shell.text()).replace('</head>', `${tags}</head>`);
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch {
    return env.ASSETS.fetch(request);
  }
};
