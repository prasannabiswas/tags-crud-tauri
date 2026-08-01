import { cn } from '@/lib/utils';
import type { TagSwatch } from '@/types/library';

interface TagChipProps {
  name: string;
  swatch: TagSwatch;
  /** Plays the shrink-out animation before the tag is actually unassigned. */
  removing?: boolean;
  onRemove?: () => void;
  className?: string;
}

/**
 * TagChip
 * ---------------------------------------------------------
 * A tag pill on an asset card. The remove affordance only materialises on
 * hover — handled with a `group` variant rather than hover state in React,
 * so hovering a chip never re-renders the grid.
 *
 * The × eases open by animating its own width from zero rather than toggling
 * `display`, which cannot be transitioned. Width carves out the space, opacity
 * and scale carry the reveal, and the chip's right padding tightens in step so
 * the pill grows as one piece instead of snapping wider.
 *
 * It stays mounted at zero width — collapsed it has no hit area, and revealing
 * on `focus-visible` keeps it reachable by keyboard.
 */
export const TagChip = ({ name, swatch, removing = false, onRemove, className }: TagChipProps) => {
  return (
    <span
      className={cn(
        'group/chip inline-flex h-5 max-w-[140px] items-center gap-0.5 rounded-full pl-2 pr-2 text-[11px] font-medium transition-[padding] duration-200 ease-atlas',
        onRemove && 'hover:pr-[3px]',
        removing ? 'animate-chip-out' : 'animate-chip-in',
        className
      )}
      style={{ backgroundColor: swatch.bg, color: swatch.fg }}
    >
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>

      {onRemove && (
        <button
          type="button"
          title="Remove tag"
          aria-label={`Remove tag ${name}`}
          onClick={onRemove}
          className={cn(
            'flex h-[13px] w-0 flex-none scale-50 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-atlas-overlay p-0 text-[11px] leading-none text-inherit opacity-0',
            'transition-all duration-200 ease-atlas',
            'group-hover/chip:w-[13px] group-hover/chip:scale-100 group-hover/chip:opacity-100',
            'focus-visible:w-[13px] focus-visible:scale-100 focus-visible:opacity-100'
          )}
        >
          ×
        </button>
      )}
    </span>
  );
};
