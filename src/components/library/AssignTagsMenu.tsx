import { useLibrary } from '@/context/LibraryContext';

interface AssignTagsMenuProps {
  assetId: number;
  assignedTagIds: string[];
}

/**
 * AssignTagsMenu
 * ---------------------------------------------------------
 * Popover anchored to an asset card for toggling tag assignment. Rendered only
 * while the card owns the open menu; the backdrop in `LibraryWindow` dismisses it.
 */
export const AssignTagsMenu = ({ assetId, assignedTagIds }: AssignTagsMenuProps) => {
  const { tags, toggleAssetTag, swatchFor, startNewTag } = useLibrary();

  return (
    <div className="absolute right-1.5 top-[calc(100%-26px)] z-20 w-[196px] origin-top-right animate-pop-in rounded-[9px] border border-atlas-line bg-atlas-popover/98 p-[5px] shadow-atlas-pop backdrop-blur-xl">
      <div className="px-2 pb-1.5 pt-[5px] text-[11px] font-semibold uppercase tracking-[0.04em] text-atlas-ink-4">
        Assign tags
      </div>

      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => void toggleAssetTag(assetId, tag.id)}
          className="flex w-full cursor-pointer items-center gap-2 rounded-[5px] border-none bg-transparent px-2 py-[5px] text-left text-[13px] text-atlas-ink transition-colors duration-150 hover:bg-atlas-hover"
        >
          <span className="w-[13px] text-xs text-atlas-accent">
            {assignedTagIds.includes(tag.id) ? '✓' : ''}
          </span>
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: swatchFor(tag.id).dot }}
          />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{tag.name}</span>
        </button>
      ))}

      {tags.length === 0 && (
        <div className="px-2 pb-2 pt-0.5 text-xs leading-[1.4] text-atlas-ink-4">
          No tags exist yet.
        </div>
      )}

      <div className="mx-1.5 my-1 h-px bg-atlas-line-soft" />

      <button
        type="button"
        onClick={startNewTag}
        className="flex w-full cursor-pointer items-center gap-2 rounded-[5px] border-none bg-transparent px-2 py-[5px] text-left text-[13px] text-atlas-ink-2 transition-colors duration-150 hover:bg-atlas-hover"
      >
        <span className="w-[13px] text-center">+</span> New tag…
      </button>
    </div>
  );
};
