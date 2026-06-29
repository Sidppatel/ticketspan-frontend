export interface MetaItem {
  key: string;
  value: string;
  isPublic: boolean;
  sortOrder: number;
}

export interface CatalogLink {
  id: string;
  name: string;
  slug: string;
  primaryImagePath: string;
  meta: MetaItem[];
}

function toMeta(raw: unknown): MetaItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => ({
      key: String(item?.key ?? ''),
      value: String(item?.value ?? ''),
      isPublic: item?.isPublic !== false,
      sortOrder: Number(item?.sortOrder ?? 0),
    }))
    .filter((item) => item.key)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parseMeta(json: string): MetaItem[] {
  try {
    return toMeta(JSON.parse(json || '[]'));
  } catch {
    return [];
  }
}

export function publicMeta(meta: MetaItem[]): MetaItem[] {
  return meta.filter((item) => item.isPublic);
}

export function metaValue(meta: MetaItem[], key: string): string {
  return meta.find((item) => item.key.toLowerCase() === key.toLowerCase())?.value ?? '';
}

export function parseCatalogLinks(json: string, idKey: string): CatalogLink[] {
  try {
    const parsed = JSON.parse(json || '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => ({
        id: String(item?.[idKey] ?? ''),
        name: String(item?.name ?? ''),
        slug: String(item?.slug ?? ''),
        primaryImagePath: String(item?.primaryImagePath ?? ''),
        meta: publicMeta(toMeta(item?.effectiveMeta)),
      }))
      .filter((item) => item.id);
  } catch {
    return [];
  }
}
