import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLibrary } from '@/context/LibraryContext';
import { cn } from '@/lib/utils';
import { AssignTagsMenu } from './AssignTagsMenu';
import { TagChip } from './TagChip';
import type { LibraryItem } from '@/types/library';

/** Matches the chipOut keyframe duration so the pill finishes shrinking first. */
const CHIP_EXIT_MS = 140;

interface AssetCardProps {
  item: LibraryItem;
}

/**
 * AssetCard
 * ---------------------------------------------------------
 * One asset in the library grid: colour swatch with a hover action overlay,
 * name/meta row, assigned tag chips, and the tag assignment popover.
 */
export const AssetCard = ({ item }: AssetCardProps) => {
  const { openMenuId, toggleMenu, toggleAssetTag, swatchFor, tags } = useLibrary();
  const [removingTagId, setRemovingTagId] = useState<string | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuOpen = openMenuId === item.id;

  useEffect(() => {
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  /** Let the chip play its exit animation before dropping the assignment. */
  const removeTag = useCallback(
    (tagId: string) => {
      setRemovingTagId(tagId);
      exitTimer.current = setTimeout(() => {
        void toggleAssetTag(item.id, tagId);
        setRemovingTagId(null);
      }, CHIP_EXIT_MS);
    },
    [item.id, toggleAssetTag]
  );

  return (
    <div className="relative rounded-[10px] border border-atlas-line bg-atlas-elevated p-2 shadow-atlas-card">
      {/* Swatch + hover actions */}
      <div className="group/swatch relative overflow-hidden rounded-md">
        <div
          className="h-[104px] rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,.25),inset_0_0_0_1px_rgba(0,0,0,.06)] transition-transform duration-200 group-hover/swatch:scale-[1.03]"
          style={{ backgroundColor: item.color }}
        />
        <div className="absolute inset-0 hidden animate-overlay-in items-center justify-center gap-[7px] bg-atlas-scrim backdrop-blur-[7px] group-hover/swatch:flex">
          <Button variant="atlas-glass" size="atlas-pill" className="animate-btn-in">
            Open
          </Button>
          <Button
            variant="atlas"
            size="atlas-pill"
            className="animate-btn-in [animation-delay:50ms]"
            onClick={() => toggleMenu(item.id)}
          >
            Tags
          </Button>
        </div>
      </div>

      {/* Name + file kind */}
      <div className="mt-[9px] flex items-center gap-1.5 px-0.5">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium">
          {item.name}
        </div>
        <div className="ml-auto text-[11px] tabular-nums text-atlas-ink-5">{item.meta}</div>
      </div>

      {/* Assigned tags */}
      <div className="mt-2 flex flex-wrap items-center gap-1 px-0.5 pb-0.5">
        {item.tags.map((tagId) => {
          const tag = tags.find((entry) => entry.id === tagId);
          return (
            <TagChip
              key={tagId}
              name={tag ? tag.name : tagId}
              swatch={swatchFor(tagId)}
              removing={removingTagId === tagId}
              onRemove={() => removeTag(tagId)}
            />
          );
        })}

        <button
          type="button"
          onClick={() => toggleMenu(item.id)}
          className={cn(
            'flex size-5 cursor-pointer items-center justify-center rounded-full border border-dashed border-atlas-line text-xs leading-none text-atlas-ink-4 transition-colors duration-150 hover:border-atlas-line-strong hover:bg-atlas-hover hover:text-atlas-ink-2',
            item.tags.length ? 'bg-transparent' : 'bg-atlas-hover'
          )}
        >
          +
        </button>
      </div>

      {menuOpen && <AssignTagsMenu assetId={item.id} assignedTagIds={item.tags} />}
    </div>
  );
};
