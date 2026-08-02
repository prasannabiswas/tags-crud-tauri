import type { Asset, TagColor, TagPaletteEntry } from '@/types/library';

/**
 * Static asset catalogue.
 *
 * Assets are not persisted — only tags and their assignments are (see
 * src-tauri/src/db.rs). `item_tags.item_id` refers to the ids below, which is
 * why they must stay stable.
 */
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
 * Tag palette, keyed by the stable `TagColor` strings that are written to
 * `tags.color`. Keyed rather than an array so a reorder here can never
 * repoint an already-persisted tag at a different colour.
 */
export const TAG_PALETTE: Record<TagColor, TagPaletteEntry> = {
  blue: {
    light: { dot: '#3b6fd4', bg: '#e8eefb', fg: '#2c56a8' },
    dark: { dot: '#5b8def', bg: '#1e2a44', fg: '#a8c3f5' },
  },
  green: {
    light: { dot: '#2f9e6e', bg: '#e4f2ea', fg: '#1f6b4a' },
    dark: { dot: '#4fbf8b', bg: '#17302a', fg: '#8fd9b8' },
  },
  amber: {
    light: { dot: '#c98a1e', bg: '#fbf0dd', fg: '#8a5c12' },
    dark: { dot: '#dda93c', bg: '#33291a', fg: '#e8c580' },
  },
  purple: {
    light: { dot: '#8a5cd6', bg: '#f0eafb', fg: '#5c3ba3' },
    dark: { dot: '#a37ce6', bg: '#2a2140', fg: '#c9b0f2' },
  },
  pink: {
    light: { dot: '#d4557f', bg: '#fbe9ef', fg: '#a13a5e' },
    dark: { dot: '#e3739a', bg: '#3a1f2c', fg: '#f0a8c0' },
  },
  teal: {
    light: { dot: '#2f9aa8', bg: '#e3f1f3', fg: '#1e6b75' },
    dark: { dot: '#45b3c2', bg: '#162e33', fg: '#8bd3dd' },
  },
  grey: {
    light: { dot: '#7a8088', bg: '#eeeef1', fg: '#54585e' },
    dark: { dot: '#9aa1aa', bg: '#2a2d33', fg: '#b8bec6' },
  },
};

/** Fallback for a tag id that no longer resolves (e.g. mid-rollback). */
export const NEUTRAL_COLOR: TagColor = 'grey';
