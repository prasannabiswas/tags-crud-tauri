import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  ASSETS,
  BASE_ASSIGNMENTS,
  BASE_TAGS,
  NEUTRAL_PALETTE_ENTRY,
  TAG_PALETTE,
} from '@/data/library';
import { useTagFilter } from '@/hooks/useTagFilter';
import { useTheme } from '@/context/ThemeContext';
import type { LibraryItem, Tag, TagAssignments, TagSwatch } from '@/types/library';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface LibraryContextType {
  /** Every asset in the vault, joined with its assigned tag ids. */
  items: LibraryItem[];
  /** `items` narrowed by the active tag filter. */
  filtered: LibraryItem[];
  tags: Tag[];
  /** Asset count per tag id, across the whole vault (not the filtered view). */
  counts: Record<string, number>;
  totalCount: number;

  selectedTagId: string | null;
  selectedTag: Tag | undefined;
  selectTag: (tagId: string) => void;
  clearFilter: () => void;

  createTag: (name: string, color: number) => void;
  toggleAssetTag: (assetId: number, tagId: string) => void;
  /** Next unused palette index, so new tags do not repeat a colour. */
  nextColor: () => number;
  /** Resolves a tag id to its palette swatch for the active theme. */
  swatchFor: (tagId: string | null | undefined) => TagSwatch;

  /* View state — shared because the card menus and the sidebar composer drive
     each other ("New tag…" inside a card opens the composer in the sidebar). */
  openMenuId: number | null;
  toggleMenu: (assetId: number) => void;
  composing: boolean;
  startNewTag: () => void;
  cancelCompose: () => void;
  closeMenus: () => void;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/* -------------------------------------------------------------------------- */
/*                                  Context                                   */
/* -------------------------------------------------------------------------- */

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                                  Provider                                  */
/* -------------------------------------------------------------------------- */

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const [tags, setTags] = useState<Tag[]>(() => clone(BASE_TAGS));
  const [assignments, setAssignments] = useState<TagAssignments>(() => clone(BASE_ASSIGNMENTS));
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  /* ── Derived collections ─────────────────────────────────────────────── */

  const items = useMemo<LibraryItem[]>(
    () => ASSETS.map((asset) => ({ ...asset, tags: assignments[asset.id] ?? [] })),
    [assignments]
  );

  const tagIds = useMemo(() => tags.map((tag) => tag.id), [tags]);

  const { filtered, selected, toggle, clear } = useTagFilter(items, tagIds);

  const counts = useMemo(() => {
    const tally: Record<string, number> = {};
    tags.forEach((tag) => {
      tally[tag.id] = 0;
    });
    items.forEach((item) => {
      item.tags.forEach((tagId) => {
        if (tally[tagId] != null) tally[tagId] += 1;
      });
    });
    return tally;
  }, [items, tags]);

  const selectedTag = useMemo(
    () => tags.find((tag) => tag.id === selected),
    [tags, selected]
  );

  /* ── Mutations ───────────────────────────────────────────────────────── */

  const nextColor = useCallback(() => {
    const used = tags.map((tag) => tag.color);
    for (let i = 0; i < TAG_PALETTE.length; i += 1) {
      if (!used.includes(i)) return i;
    }
    return used.length % TAG_PALETTE.length;
  }, [tags]);

  const createTag = useCallback((name: string, color: number) => {
    const trimmed = name.trim();
    setComposing(false);
    if (!trimmed) return;

    const id = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random()
      .toString(36)
      .slice(2, 5)}`;

    setTags((current) => [...current, { id, name: trimmed, color }]);
  }, []);

  const toggleAssetTag = useCallback((assetId: number, tagId: string) => {
    setAssignments((current) => {
      const assigned = current[assetId] ?? [];
      const next = assigned.includes(tagId)
        ? assigned.filter((id) => id !== tagId)
        : [...assigned, tagId];

      return { ...current, [assetId]: next };
    });
  }, []);

  const swatchFor = useCallback(
    (tagId: string | null | undefined): TagSwatch => {
      const tag = tags.find((entry) => entry.id === tagId);
      const entry = tag ? TAG_PALETTE[tag.color % TAG_PALETTE.length] : NEUTRAL_PALETTE_ENTRY;
      return entry[resolvedTheme];
    },
    [tags, resolvedTheme]
  );

  /* ── View state ──────────────────────────────────────────────────────── */

  const toggleMenu = useCallback(
    (assetId: number) => setOpenMenuId((current) => (current === assetId ? null : assetId)),
    []
  );

  const startNewTag = useCallback(() => {
    setComposing(true);
    setOpenMenuId(null);
  }, []);

  const cancelCompose = useCallback(() => setComposing(false), []);

  const closeMenus = useCallback(() => {
    setOpenMenuId(null);
    setComposing(false);
  }, []);

  /* ── Value ───────────────────────────────────────────────────────────── */

  const value = useMemo<LibraryContextType>(
    () => ({
      items,
      filtered,
      tags,
      counts,
      totalCount: ASSETS.length,
      selectedTagId: selected,
      selectedTag,
      selectTag: toggle,
      clearFilter: clear,
      createTag,
      toggleAssetTag,
      nextColor,
      swatchFor,
      openMenuId,
      toggleMenu,
      composing,
      startNewTag,
      cancelCompose,
      closeMenus,
    }),
    [
      items,
      filtered,
      tags,
      counts,
      selected,
      selectedTag,
      toggle,
      clear,
      createTag,
      toggleAssetTag,
      nextColor,
      swatchFor,
      openMenuId,
      toggleMenu,
      composing,
      startNewTag,
      cancelCompose,
      closeMenus,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within a LibraryProvider');
  return context;
};
