/* -------------------------------------------------------------------------- */
/*                              Library domain types                          */
/* -------------------------------------------------------------------------- */

/**
 * Stable palette keys. Persisted verbatim in `tags.color`, so these strings are
 * part of the on-disk format — renaming one orphans every tag already stored
 * under the old key. Add new keys freely; do not repurpose existing ones.
 */
export const TAG_COLORS = ['blue', 'green', 'amber', 'purple', 'pink', 'teal', 'grey'] as const;

export type TagColor = (typeof TAG_COLORS)[number];

/** A resolved tag colour — dot, chip background and chip foreground. */
export interface TagSwatch {
  dot: string;
  bg: string;
  fg: string;
}

/**
 * A palette entry carries both themes. The light chips are pastel-on-white,
 * which turns to mud on a dark surface, so dark gets its own tuned triple
 * rather than an opacity trick.
 */
export interface TagPaletteEntry {
  light: TagSwatch;
  dark: TagSwatch;
}

/* -------------------------------------------------------------------------- */
/*                         Persisted records (see db.rs)                      */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors the `Tag` struct in src-tauri/src/db.rs and the `tags` table.
 *
 * `color` is a `TagColor` key rather than a palette index: an index would
 * silently repoint at a different colour if the palette were reordered, and
 * would not survive a tag being deleted and recreated.
 */
export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

/** Mirrors the `Assignment` struct in db.rs and one row of `item_tags`. */
export interface Assignment {
  item_id: number;
  tag_id: string;
}

/* -------------------------------------------------------------------------- */
/*                            Frontend-only records                           */
/* -------------------------------------------------------------------------- */

export interface Asset {
  id: number;
  name: string;
  /** Hex fill of the card swatch. */
  color: string;
  /** File-kind badge shown next to the asset name (SVG / PNG / FIG). */
  meta: string;
}

/**
 * An asset joined with its resolved tag ids.
 *
 * `useTagFilter` is generic over anything shaped like this, so the hook stays
 * usable for any tagged collection — not just library assets.
 */
export interface TaggedItem {
  id: number | string;
  tags: string[];
}

export interface LibraryItem extends Asset, TaggedItem {
  id: number;
  tags: string[];
}
