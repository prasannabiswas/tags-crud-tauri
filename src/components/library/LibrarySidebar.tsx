import { Tag as TagIcon } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
import { cn } from '@/lib/utils';
import { TagComposer } from './TagComposer';

/**
 * LibrarySidebar
 * ---------------------------------------------------------
 * Vault navigation: the "All items" row, every tag with its asset count, the
 * inline tag composer, and the first-run empty state when no tags exist.
 */
export const LibrarySidebar = () => {
  const {
    tags,
    counts,
    totalCount,
    selectedTagId,
    selectTag,
    clearFilter,
    swatchFor,
    composing,
    startNewTag,
  } = useLibrary();

  const filterActive = selectedTagId !== null;

  return (
    <aside className="flex w-60 flex-none flex-col gap-0.5 overflow-y-auto border-r border-atlas-line-soft bg-atlas-chrome px-2.5 py-3">
      <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-atlas-ink-4">
        Library
      </div>

      {/* All items */}
      <button
        type="button"
        onClick={clearFilter}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-150 hover:bg-atlas-hover',
          filterActive ? 'bg-transparent font-normal text-atlas-ink-2' : 'bg-atlas-active font-semibold text-atlas-ink'
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 rounded-[3px] border-[1.5px]',
            filterActive ? 'border-atlas-ink-5' : 'border-atlas-ink-3'
          )}
        />
        All items
        <span
          className={cn(
            'ml-auto text-[11.5px] tabular-nums',
            filterActive ? 'text-atlas-ink-5' : 'text-atlas-ink-3'
          )}
        >
          {totalCount}
        </span>
      </button>

      <div className="h-3.5" />

      {/* Tags header */}
      <div className="flex items-center px-2 py-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-atlas-ink-4">
          Tags
        </div>
        <button
          type="button"
          onClick={startNewTag}
          className="ml-auto cursor-pointer rounded border-none bg-transparent px-[3px] py-0.5 text-[15px] leading-none text-atlas-ink-4 transition-colors duration-150 hover:bg-atlas-hover hover:text-atlas-ink-2"
        >
          +
        </button>
      </div>

      {/* Tag rows */}
      {tags.map((tag) => {
        const swatch = swatchFor(tag.id);
        const active = selectedTagId === tag.id;

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => selectTag(tag.id)}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-150 hover:bg-atlas-hover',
              active ? 'font-semibold' : 'font-normal text-atlas-ink-2'
            )}
            style={active ? { backgroundColor: swatch.bg, color: swatch.fg } : undefined}
          >
            <span
              className="size-2 flex-none rounded-full"
              style={{ backgroundColor: swatch.dot }}
            />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{tag.name}</span>
            <span
              className={cn('ml-auto text-[11.5px] tabular-nums', !active && 'text-atlas-ink-5')}
              style={active ? { color: swatch.fg } : undefined}
            >
              {counts[tag.id]}
            </span>
          </button>
        );
      })}

      {/* First-run empty state */}
      {tags.length === 0 && (
        <div className="mx-1 mt-1.5 rounded-lg border border-dashed border-atlas-line bg-atlas-hover px-3 py-3.5">
          <TagIcon className="mx-auto mb-[9px] block size-[22px] stroke-[1.6] text-atlas-ink-faint" />
          <div className="mb-[3px] text-center text-[12.5px] font-semibold text-atlas-ink-2">
            No tags yet
          </div>
          <div className="text-center text-xs leading-[1.45] text-atlas-ink-4">
            Tags let you group assets across the library. Make your first one.
          </div>
          <button
            type="button"
            onClick={startNewTag}
            className="mt-2.5 w-full cursor-pointer rounded-md border border-atlas-line bg-atlas-elevated px-2 py-[5px] text-[12.5px] font-medium text-atlas-ink-2 transition-colors duration-150 hover:bg-atlas-elevated-hover"
          >
            + New tag
          </button>
        </div>
      )}

      {composing && <TagComposer />}

      <div className="mt-auto flex items-center gap-1.5 px-2 pb-0.5 pt-2.5 text-[11.5px] text-atlas-ink-5">
        <span className="size-1.5 rounded-full bg-atlas-online" />
        Local vault · synced to disk
      </div>
    </aside>
  );
};
