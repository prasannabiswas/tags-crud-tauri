# Part C — Bug Fix & Polish

Corrected file: [`useTagFilter.ts`](useTagFilter.ts), with a one-line comment
above each change.

The fix ships in the running app at
[`src/hooks/useTagFilter.ts`](../src/hooks/useTagFilter.ts) — same behaviour,
plus `toggle`/`clear` helpers the sidebar uses. It is consumed by
[`src/context/LibraryContext.tsx`](../src/context/LibraryContext.tsx), which
calls the hook once so the sidebar, header and grid all read one shared filter.

## Reported symptoms → causes

**"Changing the tag filter doesn't update the visible list until you interact
with something else."**

`filtered` was a second copy of the item list held in `useState` and refreshed
inside an effect whose dependency array was `[items]`. `selected` was not in
that array, so choosing a tag never re-ran the effect — the list only caught up
when something *else* changed `items` and incidentally triggered it.

The dependency array is the proximate cause, but adding `selected` to it would
have been the wrong fix. `filtered` is a pure function of `items` and
`selected`, so it should never have been state at all. Deriving it with
`useMemo` during render eliminates the failure mode entirely, and also closes a
subtler problem the original had: even when the effect did fire, it ran *after*
paint, so there was always one frame showing the previous list.

**"Occasionally the app re-renders in a loop under heavy tag counts."**

`setSelected(selected)` inside the effect wrote state back to the value it
already held. React bails out of a re-render when a `useState` setter receives
`Object.is`-equal input, which is why this is intermittent rather than a hard
hang — but an effect that writes the same state it depends on is one identity
change away from cycling, and it does extra work on every run regardless. With
filtering derived instead of synced, the effect no longer exists on the hot
path; the only remaining write clears a selection whose tag has actually been
deleted, which converges.

## Third issue — not in the reported symptoms

The `tags` parameter was accepted and never read. That is not cosmetic: without
it the hook cannot tell that its active tag has been deleted, so the view stays
filtered by something that no longer exists and the user has no way to see the
full list again. It now bounds the selection, and the hook returns the
validated value rather than the raw stored one.

This matters more since Part D — tags are deletable from the sidebar, and
deleting one cascades its assignments in SQLite.
