// Part C — corrected version of the provided useTagFilter snippet.
//
// This is the annotated copy for review. The version the app actually runs is
// src/hooks/useTagFilter.ts, which is identical in behaviour and additionally
// returns `toggle`/`clear` helpers used by the sidebar.
//
// Original snippet, for reference:
//
//   function useTagFilter(items: Item[], tags: string[]) {
//     const [selected, setSelected] = useState<string | null>(null);
//     const [filtered, setFiltered] = useState<Item[]>(items);
//     useEffect(() => {
//       if (selected) {
//         setFiltered(items.filter(i => i.tags.includes(selected)));
//       } else {
//         setFiltered(items);
//       }
//       setSelected(selected);
//     }, [items]);
//     return { filtered, selected, setSelected };
//   }

import { useEffect, useMemo, useState } from 'react';

interface Item {
  id: number | string;
  tags: string[];
}

export function useTagFilter<T extends Item>(items: T[], tags: string[]) {
  const [selected, setSelected] = useState<string | null>(null);

  // FIX: the `tags` parameter was accepted but never used — it now bounds the
  // selection, so a tag that is deleted while active stops filtering instead of
  // leaving the list stuck on a tag that no longer exists.
  const selectionIsValid = selected !== null && tags.includes(selected);
  const active = selectionIsValid ? selected : null;

  // FIX: `filtered` was a second piece of state kept in sync by hand inside an
  // effect. It is derived data, so it becomes a `useMemo` computed during
  // render — this is the fix for "changing the tag filter doesn't update the
  // visible list until you interact with something else", because the effect
  // only ran on `[items]` and `selected` was missing from its dependencies.
  // Deriving instead of syncing removes that entire class of bug rather than
  // patching the one instance, and closes the one-frame window where the list
  // rendered stale before the effect caught up.
  const filtered = useMemo(
    () => (active ? items.filter((item) => item.tags.includes(active)) : items),
    [items, active]
  );

  // FIX: the original called `setSelected(selected)` — setting state to the
  // value it already held. Dead on its own, but it is also the "re-renders in a
  // loop under heavy tag counts" symptom: an effect that writes the state it
  // depends on will re-run whenever that write is not bailed out of. This now
  // only fires to clear a selection whose tag has genuinely disappeared, so it
  // converges instead of cycling.
  useEffect(() => {
    if (selected !== null && !selectionIsValid) setSelected(null);
  }, [selected, selectionIsValid]);

  // FIX: returns the validated `active`, not the raw stored value, so callers
  // can never render a filter chip for a tag that is gone.
  return { filtered, selected: active, setSelected };
}
