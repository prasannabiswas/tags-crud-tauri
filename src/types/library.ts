/* -------------------------------------------------------------------------- */
/*                              Library domain types                          */
/* -------------------------------------------------------------------------- */

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

export interface Tag {
  id: string;
  name: string;
  /** Index into the tag palette; wrapped modulo palette length when resolved. */
  color: number;
}

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

/** Map of asset id → assigned tag ids. */
export type TagAssignments = Record<number, string[]>;
