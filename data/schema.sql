-- Atlas library schema.
--
-- This file is the single source of truth: src-tauri/src/db.rs embeds it with
-- include_str! and executes it at startup, so the runtime schema and this file
-- can never drift apart. Every statement must stay IF NOT EXISTS — it runs on
-- every launch, against an existing database.

-- `color` is stored on the tag record as a stable palette key ("blue",
-- "green", …) rather than an array index. An index would silently repoint at a
-- different colour the moment the palette is reordered, and it would not
-- survive a tag being deleted and recreated.
CREATE TABLE IF NOT EXISTS tags (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  color TEXT NOT NULL
);

-- A normalized join table, not a JSON array on the tag or the item: it lets
-- SQLite enforce uniqueness through the composite primary key, and lets
-- ON DELETE CASCADE clean up assignments when a tag goes away.
--
-- item_id has no foreign key because assets are not stored in this database —
-- they come from the frontend's static catalogue.
CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER NOT NULL,
  tag_id  TEXT NOT NULL,
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Filtering the library by tag reads item_tags by tag_id, which the composite
-- primary key above cannot serve (it is ordered item_id first).
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);
