import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLibrary } from '@/context/LibraryContext';
import { AssetCard } from './AssetCard';

/**
 * AssetGrid
 * ---------------------------------------------------------
 * Scrollable results area. Renders the filtered assets, or the zero-result
 * state when the active tag has nothing assigned to it.
 */
export const AssetGrid = () => {
  const { filtered, selectedTag, clearFilter, status } = useLibrary();

  // Skeletons rather than an empty grid: assets are static, only their tags
  // are being read from the database, so the layout is already known.
  if (status === 'loading') {
    return (
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-[18px]">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="h-[168px] animate-pulse rounded-[10px] border border-atlas-line bg-atlas-hover"
            />
          ))}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-1.5 text-center">
          <SearchX className="mb-2.5 size-[34px] stroke-[1.5] text-atlas-ink-faint" />
          <div className="text-[14.5px] font-semibold">
            Nothing matches “{selectedTag?.name ?? ''}”
          </div>
          <div className="max-w-[300px] text-[12.5px] leading-[1.5] text-atlas-ink-4">
            No assets carry this tag yet. Assign it from any card, or clear the filter to see the
            whole library.
          </div>
          <Button
            variant="atlas-surface"
            className="mt-3.5 h-auto px-3.5 py-1.5 text-[12.5px]"
            onClick={clearFilter}
          >
            Clear filter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-[18px]">
        {filtered.map((item) => (
          <AssetCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
