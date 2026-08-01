import type { Asset, Tag, TagAssignments, TagPaletteEntry } from '@/types/library';

/**
 * Seed data for the library vault.
 *
 * Stands in for the Tauri/Rust side for now — the context provider is the only
 * consumer, so swapping this for `invoke('list_assets')` later touches one file.
 */

export const TAG_PALETTE: TagPaletteEntry[] = [
  {
    light: { dot: '#3b6fd4', bg: '#e8eefb', fg: '#2c56a8' },
    dark: { dot: '#5b8def', bg: '#1e2a44', fg: '#a8c3f5' },
  },
  {
    light: { dot: '#2f9e6e', bg: '#e4f2ea', fg: '#1f6b4a' },
    dark: { dot: '#4fbf8b', bg: '#17302a', fg: '#8fd9b8' },
  },
  {
    light: { dot: '#c98a1e', bg: '#fbf0dd', fg: '#8a5c12' },
    dark: { dot: '#dda93c', bg: '#33291a', fg: '#e8c580' },
  },
  {
    light: { dot: '#8a5cd6', bg: '#f0eafb', fg: '#5c3ba3' },
    dark: { dot: '#a37ce6', bg: '#2a2140', fg: '#c9b0f2' },
  },
  {
    light: { dot: '#d4557f', bg: '#fbe9ef', fg: '#a13a5e' },
    dark: { dot: '#e3739a', bg: '#3a1f2c', fg: '#f0a8c0' },
  },
  {
    light: { dot: '#2f9aa8', bg: '#e3f1f3', fg: '#1e6b75' },
    dark: { dot: '#45b3c2', bg: '#162e33', fg: '#8bd3dd' },
  },
  {
    light: { dot: '#7a8088', bg: '#eeeef1', fg: '#54585e' },
    dark: { dot: '#9aa1aa', bg: '#2a2d33', fg: '#b8bec6' },
  },
];

/** Neutral entry used for the filter chip when no tag resolves. */
export const NEUTRAL_PALETTE_ENTRY = TAG_PALETTE[6];

export const ASSETS: Asset[] = [
  { id: 1, name: 'Aurora Gradient', color: '#7C5CE0', meta: 'SVG' },
  { id: 2, name: 'Signal Blue', color: '#2F6BE0', meta: 'PNG' },
  { id: 3, name: 'Terracotta 400', color: '#D26A4A', meta: 'SVG' },
  { id: 4, name: 'Moss Card', color: '#4E7B58', meta: 'FIG' },
  { id: 5, name: 'Sand Panel', color: '#DCC7A1', meta: 'PNG' },
  { id: 6, name: 'Ink Cover', color: '#232733', meta: 'FIG' },
  { id: 7, name: 'Coral Badge', color: '#E56A6A', meta: 'SVG' },
  { id: 8, name: 'Mint Surface', color: '#8FD6BD', meta: 'PNG' },
  { id: 9, name: 'Lilac Sheet', color: '#B8A6E8', meta: 'SVG' },
  { id: 10, name: 'Slate Frame', color: '#5C6672', meta: 'FIG' },
  { id: 11, name: 'Amber Tile', color: '#E8A33D', meta: 'PNG' },
  { id: 12, name: 'Fog Backdrop', color: '#C9CFD6', meta: 'SVG' },
  { id: 13, name: 'Rose Divider', color: '#E29AB4', meta: 'SVG' },
  { id: 14, name: 'Deep Teal', color: '#1F6B75', meta: 'FIG' },
  { id: 15, name: 'Paper Grain', color: '#EDE6DA', meta: 'PNG' },
  { id: 16, name: 'Citrus Chip', color: '#D9DE55', meta: 'SVG' },
  { id: 17, name: 'Night Sky', color: '#2B3A6B', meta: 'PNG' },
  { id: 18, name: 'Clay Button', color: '#B57F6A', meta: 'FIG' },
];

/**
 * Review-workflow tags. Colours are chosen semantically rather than in palette
 * order — green reads as approved, amber as needs-attention, grey as inactive.
 *
 * Two palette slots are deliberately left unused (indices 4 and 5) so
 * `nextColor()` has fresh colours to hand out for user-created tags.
 */
export const BASE_TAGS: Tag[] = [
  { id: 'approved', name: 'Approved', color: 1 },
  { id: 'needs-review', name: 'Needs Review', color: 2 },
  { id: 'q3-campaign', name: 'Q3 Campaign', color: 3 },
  { id: 'in-progress', name: 'In Progress', color: 0 },
  { id: 'archived', name: 'Archived', color: 6 },
];

/**
 * `archived` is intentionally assigned to nothing — it keeps the zero-result
 * empty state reachable by clicking a tag that has no assets.
 */
export const BASE_ASSIGNMENTS: TagAssignments = {
  1: ['approved', 'q3-campaign'],
  2: ['approved', 'needs-review'],
  3: ['q3-campaign'],
  4: ['approved'],
  5: ['q3-campaign', 'in-progress'],
  6: ['needs-review'],
  7: ['approved'],
  8: ['approved', 'in-progress'],
  9: ['in-progress'],
  10: ['approved'],
  11: ['q3-campaign'],
  12: ['approved'],
  13: ['in-progress'],
  14: ['needs-review', 'approved'],
  15: ['q3-campaign'],
  16: [],
  17: ['needs-review'],
  18: [],
};
