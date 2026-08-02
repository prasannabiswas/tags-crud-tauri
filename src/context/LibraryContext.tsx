import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { ASSETS, NEUTRAL_COLOR, TAG_PALETTE } from '@/data/library';
import * as db from '@/lib/db';
import { useTagFilter } from '@/hooks/useTagFilter';
import { useTheme } from '@/context/ThemeContext';
import { TAG_COLORS } from '@/types/library';
import type { Assignment, LibraryItem, Tag, TagColor, TagSwatch } from '@/types/library';

/* -------------------------------------------------------------------------- */
/*                              Cache (reducer)                               */
/* -------------------------------------------------------------------------- */

/**
 * The in-memory cache mirrors the two persisted tables. It is the source of
 * truth for rendering; the database is the source of truth for durability.
 * Mutations are applied here first (optimistically) and rolled back if the
 * Rust command rejects, so the UI never waits on a round trip and never
 * re-fetches the whole dataset.
 */
interface CacheState {
  tags: Tag[];
  assignments: Assignment[];
}

type CacheAction =
  | { type: 'hydrated'; tags: Tag[]; assignments: Assignment[] }
  | { type: 'tagAdded'; tag: Tag }
  | { type: 'tagRemoved'; tagId: string }
  | { type: 'assigned'; itemId: number; tagId: string }
  | { type: 'unassigned'; itemId: number; tagId: string }
  | { type: 'restore'; snapshot: CacheState };

const EMPTY_CACHE: CacheState = { tags: [], assignments: [] };

const cacheReducer = (state: CacheState, action: CacheAction): CacheState => {
  switch (action.type) {
    case 'hydrated':
      return { tags: action.tags, assignments: action.assignments };

    case 'tagAdded':
      return { ...state, tags: [...state.tags, action.tag] };

    // Mirrors ON DELETE CASCADE: dropping a tag drops its assignments here too,
    // otherwise the cache would show orphans the database no longer holds.
    case 'tagRemoved':
      return {
        tags: state.tags.filter((tag) => tag.id !== action.tagId),
        assignments: state.assignments.filter((a) => a.tag_id !== action.tagId),
      };

    // Mirrors INSERT OR IGNORE — assigning twice is a no-op, not a duplicate.
    case 'assigned':
      return state.assignments.some(
        (a) => a.item_id === action.itemId && a.tag_id === action.tagId
      )
        ? state
        : {
            ...state,
            assignments: [...state.assignments, { item_id: action.itemId, tag_id: action.tagId }],
          };

    case 'unassigned':
      return {
        ...state,
        assignments: state.assignments.filter(
          (a) => !(a.item_id === action.itemId && a.tag_id === action.tagId)
        ),
      };

    case 'restore':
      return action.snapshot;

    default:
      return state;
  }
};

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type LoadStatus = 'loading' | 'ready' | 'error';

interface LibraryContextType {
  /** Every asset in the catalogue, joined with its assigned tag ids. */
  items: LibraryItem[];
  /** `items` narrowed by the active tag filter. */
  filtered: LibraryItem[];
  tags: Tag[];
  /** Asset count per tag id, across the whole vault (not the filtered view). */
  counts: Record<string, number>;
  totalCount: number;

  status: LoadStatus;
  /** Last failed mutation or hydration, surfaced for the UI to show. */
  error: string | null;
  dismissError: () => void;

  selectedTagId: string | null;
  selectedTag: Tag | undefined;
  selectTag: (tagId: string) => void;
  clearFilter: () => void;

  createTag: (name: string, color: TagColor) => Promise<void>;
  removeTag: (tagId: string) => Promise<void>;
  toggleAssetTag: (assetId: number, tagId: string) => Promise<void>;
  /** Next unused palette key, so new tags do not repeat a colour. */
  nextColor: () => TagColor;
  /** Resolves a tag id to its palette swatch for the active theme. */
  swatchFor: (tagId: string | null | undefined) => TagSwatch;
  /** Resolves a palette key directly — used by the colour picker. */
  swatchForColor: (color: TagColor) => TagSwatch;

  openMenuId: number | null;
  toggleMenu: (assetId: number) => void;
  composing: boolean;
  startNewTag: () => void;
  cancelCompose: () => void;
  closeMenus: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                                  Provider                                  */
/* -------------------------------------------------------------------------- */

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();

  const [cache, dispatch] = useReducer(cacheReducer, EMPTY_CACHE);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  // Snapshot source for rollback. Held in a ref so the mutation callbacks can
  // capture the latest committed cache without being rebuilt on every change.
  const cacheRef = useRef(cache);
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  /* ── Startup hydration ───────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    Promise.all([db.listTags(), db.listAssignments()])
      .then(([tags, assignments]) => {
        if (cancelled) return;
        dispatch({ type: 'hydrated', tags, assignments });
        setStatus('ready');
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(db.toErrorMessage(cause));
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Optimistic mutation helper ──────────────────────────────────────── */

  /**
   * Applies `action` to the cache immediately, then runs `persist`. If the
   * command rejects, the pre-mutation snapshot is restored and the message is
   * surfaced — so a failed write can never leave the UI showing state the
   * database does not have.
   */
  const optimistic = useCallback(
    async (action: CacheAction, persist: () => Promise<unknown>): Promise<void> => {
      const snapshot = cacheRef.current;

      dispatch(action);
      setError(null);

      try {
        await persist();
      } catch (cause) {
        dispatch({ type: 'restore', snapshot });
        setError(db.toErrorMessage(cause));
      }
    },
    []
  );

  /* ── Derived collections ─────────────────────────────────────────────── */

  /** Assignments regrouped as asset id → tag ids, for rendering. */
  const tagsByItem = useMemo(() => {
    const grouped = new Map<number, string[]>();
    cache.assignments.forEach(({ item_id, tag_id }) => {
      const existing = grouped.get(item_id);
      if (existing) existing.push(tag_id);
      else grouped.set(item_id, [tag_id]);
    });
    return grouped;
  }, [cache.assignments]);

  const items = useMemo<LibraryItem[]>(
    () => ASSETS.map((asset) => ({ ...asset, tags: tagsByItem.get(asset.id) ?? [] })),
    [tagsByItem]
  );

  const tagIds = useMemo(() => cache.tags.map((tag) => tag.id), [cache.tags]);

  const { filtered, selected, toggle, clear } = useTagFilter(items, tagIds);

  const counts = useMemo(() => {
    const tally: Record<string, number> = {};
    cache.tags.forEach((tag) => {
      tally[tag.id] = 0;
    });
    cache.assignments.forEach(({ tag_id }) => {
      if (tally[tag_id] != null) tally[tag_id] += 1;
    });
    return tally;
  }, [cache.tags, cache.assignments]);

  const selectedTag = useMemo(
    () => cache.tags.find((tag) => tag.id === selected),
    [cache.tags, selected]
  );

  /* ── Colour resolution ───────────────────────────────────────────────── */

  const swatchForColor = useCallback(
    (color: TagColor): TagSwatch => (TAG_PALETTE[color] ?? TAG_PALETTE[NEUTRAL_COLOR])[resolvedTheme],
    [resolvedTheme]
  );

  const swatchFor = useCallback(
    (tagId: string | null | undefined): TagSwatch => {
      const tag = cache.tags.find((entry) => entry.id === tagId);
      return swatchForColor(tag ? tag.color : NEUTRAL_COLOR);
    },
    [cache.tags, swatchForColor]
  );

  const nextColor = useCallback((): TagColor => {
    const used = new Set(cache.tags.map((tag) => tag.color));
    return TAG_COLORS.find((color) => !used.has(color)) ?? TAG_COLORS[cache.tags.length % TAG_COLORS.length];
  }, [cache.tags]);

  /* ── Mutations ───────────────────────────────────────────────────────── */

  const createTag = useCallback(
    async (name: string, color: TagColor) => {
      const trimmed = name.trim();
      setComposing(false);
      if (!trimmed) return;

      // Generated here rather than in Rust so the optimistic row and the
      // persisted row share an id without waiting for the round trip.
      const id = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random()
        .toString(36)
        .slice(2, 5)}`;

      await optimistic({ type: 'tagAdded', tag: { id, name: trimmed, color } }, () =>
        db.addTag(id, trimmed, color)
      );
    },
    [optimistic]
  );

  const removeTag = useCallback(
    async (tagId: string) => {
      setOpenMenuId(null);
      await optimistic({ type: 'tagRemoved', tagId }, () => db.deleteTag(tagId));
    },
    [optimistic]
  );

  const toggleAssetTag = useCallback(
    async (assetId: number, tagId: string) => {
      const assigned = cacheRef.current.assignments.some(
        (a) => a.item_id === assetId && a.tag_id === tagId
      );

      await optimistic(
        assigned
          ? { type: 'unassigned', itemId: assetId, tagId }
          : { type: 'assigned', itemId: assetId, tagId },
        () => (assigned ? db.removeAssignment(assetId, tagId) : db.assignTag(assetId, tagId))
      );
    },
    [optimistic]
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

  const dismissError = useCallback(() => setError(null), []);

  /* ── Value ───────────────────────────────────────────────────────────── */

  const value = useMemo<LibraryContextType>(
    () => ({
      items,
      filtered,
      tags: cache.tags,
      counts,
      totalCount: ASSETS.length,
      status,
      error,
      dismissError,
      selectedTagId: selected,
      selectedTag,
      selectTag: toggle,
      clearFilter: clear,
      createTag,
      removeTag,
      toggleAssetTag,
      nextColor,
      swatchFor,
      swatchForColor,
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
      cache.tags,
      counts,
      status,
      error,
      dismissError,
      selected,
      selectedTag,
      toggle,
      clear,
      createTag,
      removeTag,
      toggleAssetTag,
      nextColor,
      swatchFor,
      swatchForColor,
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
