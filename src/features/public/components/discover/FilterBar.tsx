import { Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/cn';

interface FilterBarProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  search: string;
  onSearch: (value: string) => void;
}

export function FilterBar({ categories, selected, onSelect, search, onSearch }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/60 p-3 backdrop-blur-md md:flex-row md:items-center md:justify-between">
      {}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            aria-pressed={selected === cat}
            className={cn(
              'cursor-pointer rounded-full px-4 py-1.5 font-mono text-xs font-semibold tracking-wide transition-all duration-200',
              selected === cat
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search box office events…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="h-10 w-full rounded-xl border-border/60 bg-background/80 pl-10 pr-9 text-xs placeholder:text-muted-foreground focus:border-primary"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            title="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
