import { useEffect, useRef, useState } from 'react';
import { TAG_PALETTE } from '@/data/library';
import { useLibrary } from '@/context/LibraryContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

/**
 * TagComposer
 * ---------------------------------------------------------
 * Inline "new tag" row in the sidebar: an autofocused name field plus the
 * palette swatches. Enter or blur commits, Escape discards.
 *
 * The colour swatches commit on `mousedown` so picking one does not blur the
 * input and commit the tag out from under the click.
 */
export const TagComposer = () => {
  const { createTag, cancelCompose, nextColor } = useLibrary();
  const { resolvedTheme } = useTheme();
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState(() => nextColor());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = () => {
    if (!draft.trim()) {
      cancelCompose();
      return;
    }
    createTag(draft, color);
  };

  return (
    <div className="mt-0.5 flex flex-col gap-[7px] px-2 pb-2 pt-[5px]">
      <div className="flex items-center gap-2">
        <span
          className="size-2 flex-none rounded-full transition-colors duration-150"
          style={{
            backgroundColor: TAG_PALETTE[color % TAG_PALETTE.length][resolvedTheme].dot,
          }}
        />
        <input
          ref={inputRef}
          value={draft}
          placeholder="Tag name"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') cancelCompose();
          }}
          className="min-w-0 flex-1 rounded-[5px] border border-atlas-accent bg-atlas-elevated px-1.5 py-[3px] text-[13px] text-atlas-ink outline-none ring-[3px] ring-atlas-accent/20"
        />
      </div>

      <div className="flex items-center gap-1.5 pl-4">
        {TAG_PALETTE.map((entry, index) => {
          const swatch = entry[resolvedTheme];
          const selected = color === index;

          return (
            <button
              key={entry.light.dot}
              type="button"
              title="Tag color"
              onMouseDown={(event) => {
                event.preventDefault();
                setColor(index);
              }}
              className={cn(
                'size-[14px] cursor-pointer rounded-full border-[1.5px] p-0 transition-[box-shadow,border-color] duration-150',
                // The gap ring reads as the surface behind it, so the dot's own
                // outer glow stays legible against either theme.
                selected ? 'border-atlas-chrome' : 'border-transparent'
              )}
              style={{
                backgroundColor: swatch.dot,
                boxShadow: selected ? `0 0 0 2px ${swatch.dot}` : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
