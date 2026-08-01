import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TaggedItem } from '@/types/library';

export interface UseTagFilterResult<T> {
  /** `items` narrowed to the selected tag, or all of `items` when nothing is selected. */
  filtered: T[];
  /** The active tag id, guaranteed to still exist in `tags`. */
  selected: string | null;
  setSelected: (tagId: string | null) => void;
  /** Select a tag, or clear it when it is already the active one. */
  toggle: (tagId: string) => void;
  clear: () => void;
}

/**
 * useTagFilter
 * ---------------------------------------------------------
 * Filters a tagged collection down to a single selected tag.
 *
 * Fixes over the original draft:
 *
 * 1. `filtered` was mirrored into `useState` and recomputed inside an effect
 *    whose dependency array was `[items]` — so picking a tag never refiltered
 *    anything. Filtering is derived data, so it is a `useMemo`, not state kept
 *    in sync by hand. That removes the stale-render window (one paint with the
 *    old list) and the whole class of missing-dependency bugs.
 * 2. `setSelected(selected)` inside the effect set the value to itself. Dead
 *    code at best, an extra render at worst.
 * 3. The `tags` parameter was unused. It now bounds the selection: when the
 *    active tag is deleted or the dataset swaps, the filter prunes itself
 *    instead of leaving the view stuck on a tag that no longer exists.
 */
export function useTagFilter<T extends TaggedItem>(
  items: T[],
  tags: string[]
): UseTagFilterResult<T> {
  const [selected, setSelected] = useState<string | null>(null);

  // Render-time guard: a selection is only honoured while its tag still exists.
  const selectionIsValid = selected !== null && tags.includes(selected);
  const active = selectionIsValid ? selected : null;

  const filtered = useMemo(
    () => (active ? items.filter((item) => item.tags.includes(active)) : items),
    [items, active]
  );

  // Drop a dangling selection so a tag re-created under the same id does not
  // silently re-apply the old filter.
  useEffect(() => {
    if (selected !== null && !selectionIsValid) setSelected(null);
  }, [selected, selectionIsValid]);

  const toggle = useCallback(
    (tagId: string) => setSelected((current) => (current === tagId ? null : tagId)),
    []
  );

  const clear = useCallback(() => setSelected(null), []);

  return { filtered, selected: active, setSelected, toggle, clear };
}
