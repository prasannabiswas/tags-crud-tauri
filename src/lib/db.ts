import { invoke } from '@tauri-apps/api/core';
import type { Assignment, Tag, TagColor } from '@/types/library';

/**
 * Typed wrappers over the Rust commands in src-tauri/src/db.rs.
 *
 * There is no HTTP server and no network layer in this app — the frontend
 * reaches the database exclusively through Tauri IPC. This module is the only
 * place `invoke` is called; everything else imports these functions, so the
 * command names and argument shapes exist in exactly one place and stay
 * checkable against the Rust signatures.
 *
 * Argument naming: Tauri v2 converts camelCase keys from JS into the
 * snake_case parameters declared in Rust, so `itemId` here reaches `item_id`
 * there. Return values are deserialized straight from the Rust structs, which
 * is why `Assignment` keeps its snake_case fields.
 *
 * Every command returns `Result<T, String>` in Rust; an `Err` surfaces here as
 * a rejected promise carrying that string.
 */

export const listTags = (): Promise<Tag[]> => invoke<Tag[]>('list_tags');

export const addTag = (id: string, name: string, color: TagColor): Promise<Tag> =>
  invoke<Tag>('add_tag', { id, name, color });

export const deleteTag = (id: string): Promise<void> => invoke<void>('delete_tag', { id });

export const listAssignments = (): Promise<Assignment[]> =>
  invoke<Assignment[]>('list_assignments');

export const assignTag = (itemId: number, tagId: string): Promise<void> =>
  invoke<void>('assign_tag', { itemId, tagId });

export const removeAssignment = (itemId: number, tagId: string): Promise<void> =>
  invoke<void>('remove_assignment', { itemId, tagId });

export const seedDb = (): Promise<void> => invoke<void>('seed_db');

/** Normalises a rejected invoke into a message suitable for the UI. */
export const toErrorMessage = (error: unknown): string =>
  typeof error === 'string' ? error : error instanceof Error ? error.message : String(error);
