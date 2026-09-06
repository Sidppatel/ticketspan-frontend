import { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { getPerformerBySlug } from '@/features/public/services/publicCatalogService';
import { PerformerProfileView } from '@/features/public/components/PerformerProfileView';
import { Seo } from '@/shared/components/Seo';
import { imageUrl } from '@/shared/upload';
import { metaValue, parseMeta } from '@/features/public/components/catalogJson';
import { Skeleton } from '@/shared/ui/skeleton';
import { Music2, ArrowLeft, RefreshCw } from 'lucide-react';

export function PerformerProfilePage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getPerformerBySlug(slug), [slug]);
  const { data, loading, error, reload } = useAsync(loader);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-10 pb-24 animate-in fade-in duration-300">
        <Skeleton className="h-9 w-36 rounded-full" />
        <div className="rounded-[2.5rem] border border-border/60 bg-card/60 p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <Skeleton className="size-48 rounded-[2rem]" />
            <div className="flex-1 space-y-4 w-full">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-12 w-3/4 rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-[2rem]" />
          <Skeleton className="h-64 rounded-[2rem]" />
          <Skeleton className="h-64 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md space-y-6 rounded-[2.5rem] border border-border/80 bg-card p-12 text-center shadow-lg my-12">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Music2 className="size-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Performer Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            {error || 'This performer profile is unavailable or may have been renamed.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
          >
            <ArrowLeft className="size-3.5" /> Back to Box Office
          </Link>
          <button
            type="button"
            onClick={() => reload()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <RefreshCw className="size-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const meta = parseMeta(data.metaJson);
  const description = metaValue(meta, 'description') || metaValue(meta, 'notes');

  return (
    <>
      <Seo
        title={`${data.name} | Official Artist Lineup`}
        description={description || `Upcoming shows and official lineup dates for ${data.name}.`}
        image={data.primaryImagePath ? imageUrl(data.primaryImagePath) : undefined}
      />
      <PerformerProfileView
        name={data.name}
        slug={data.slug}
        primaryImagePath={data.primaryImagePath}
        metaJson={data.metaJson}
        events={data.events}
      />
    </>
  );
}
