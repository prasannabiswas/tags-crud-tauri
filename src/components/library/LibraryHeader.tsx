import { useLibrary } from '@/context/LibraryContext';

/**
 * LibraryHeader
 * ---------------------------------------------------------
 * Title bar of the results pane: heading, subheading, the active filter chip
 * with its dismiss control, and the visible item count.
 */
export const LibraryHeader = () => {
  const { filtered, selectedTag, clearFilter, swatchFor } = useLibrary();

  const swatch = swatchFor(selectedTag?.id);

  return (
    <div className="flex flex-none items-center gap-3 border-b border-atlas-line-soft px-6 pb-3.5 pt-[18px]">
      <div>
        <div className="text-[17px] font-semibold tracking-[-0.01em]">
          {selectedTag ? selectedTag.name : 'All items'}
        </div>
        <div className="mt-0.5 text-[12.5px] text-atlas-ink-4">
          {selectedTag
            ? `Assets tagged ${selectedTag.name} in this vault`
            : 'Every asset in your local vault'}
        </div>
      </div>

      {selectedTag && (
        <div
          className="ml-1 flex items-center gap-[7px] rounded-full py-1 pl-2.5 pr-1.5 text-[12.5px] font-medium"
          style={{ backgroundColor: swatch.bg, color: swatch.fg }}
        >
          Filtered by {selectedTag.name}
          <button
            type="button"
            onClick={clearFilter}
            className="flex size-4 cursor-pointer items-center justify-center rounded-full border-none bg-atlas-overlay text-xs leading-none text-inherit"
          >
            ×
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 text-[12.5px] tabular-nums text-atlas-ink-4">
        {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
};
