//! SQLite persistence for the Collections & Tags feature.
//!
//! # Where the database lives
//!
//! The file is opened at `app.path().app_data_dir()` + `library.db` — the
//! OS-provided per-application data directory (on macOS,
//! `~/Library/Application Support/<bundle identifier>/`). This is the whole
//! reason data survives a restart. Two paths that look convenient are wrong:
//! a temp dir is cleared by the OS, and a path next to the binary is inside
//! the `.app` bundle, which is read-only once installed and replaced wholesale
//! on every update. The directory may not exist on first run, so we create it.
//!
//! # Why `Mutex<Connection>` in managed state
//!
//! `rusqlite::Connection` is not `Sync`, so it cannot be shared across Tauri's
//! command threads on its own. Wrapping it in a `Mutex` makes the whole thing
//! `Sync` and serialises access, which SQLite wants anyway for writes. The
//! connection is opened once in `setup()` and handed to commands as
//! `State<'_, Db>`, so no command pays reconnection cost and there is exactly
//! one writer.
//!
//! # Why `PRAGMA foreign_keys = ON`
//!
//! SQLite ships with foreign key enforcement **off** for backwards
//! compatibility, and the setting is per-connection, not stored in the file.
//! Without it the `ON DELETE CASCADE` on `item_tags` is silently inert:
//! deleting a tag would leave its assignments behind as orphan rows, and they
//! would reappear against a new tag that reused the id. It is set immediately
//! after opening, before any statement runs.

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

/// Managed state wrapper. One connection, guarded, for the app's lifetime.
pub struct Db(pub Mutex<Connection>);

/// The schema is embedded from the same file that is checked into the repo, so
/// `/data/schema.sql` and the runtime schema cannot drift apart.
const SCHEMA: &str = include_str!("../../data/schema.sql");

#[derive(Debug, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    /// Stable palette key ("blue", "green", …), never an array index.
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Assignment {
    pub item_id: i64,
    pub tag_id: String,
}

/// Anything that can go wrong becomes a plain `String` — that is what crosses
/// the IPC boundary as a rejected promise on the JS side.
fn to_err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

/* -------------------------------------------------------------------------- */
/*                                   Setup                                    */
/* -------------------------------------------------------------------------- */

/// Resolves the database file location.
///
/// `ATLAS_DB_PATH` overrides the default, which is useful when you want the
/// file somewhere easy to open in a GUI client, or when pointing a throwaway
/// run at a scratch database. Note that the Tauri CLI does **not** load `.env`
/// into this process — the variable has to be exported into the shell that
/// launches the app (see `.env.example`).
///
/// With no override, the file sits in the OS app-data directory; on macOS that
/// is `~/Library/Application Support/<bundle identifier>/library.db`.
pub fn resolve_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Ok(custom) = std::env::var("ATLAS_DB_PATH") {
        let trimmed = custom.trim();
        if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).map_err(to_err)?;
            }
            return Ok(path);
        }
    }

    let dir = app.path().app_data_dir().map_err(to_err)?;
    fs::create_dir_all(&dir).map_err(to_err)?;
    Ok(dir.join("library.db"))
}

/// Opens (creating if needed) the database and applies the schema.
/// Called once from `setup()`.
pub fn open(app: &tauri::AppHandle) -> Result<Connection, String> {
    let path = resolve_path(app)?;

    // Printed so the exact file can be pasted into a GUI client like TablePlus
    // without guessing at the app-data path.
    println!("[atlas] database: {}", path.display());

    let conn = Connection::open(&path).map_err(to_err)?;

    // Must come before anything else — see the module comment.
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(to_err)?;

    conn.execute_batch(SCHEMA).map_err(to_err)?;

    Ok(conn)
}

/* -------------------------------------------------------------------------- */
/*                                  Commands                                  */
/* -------------------------------------------------------------------------- */

#[tauri::command]
pub fn list_tags(db: State<'_, Db>) -> Result<Vec<Tag>, String> {
    let conn = db.0.lock().map_err(to_err)?;

    let mut stmt = conn
        .prepare("SELECT id, name, color FROM tags ORDER BY rowid")
        .map_err(to_err)?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })
        .map_err(to_err)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(to_err)
}

#[tauri::command]
pub fn add_tag(db: State<'_, Db>, id: String, name: String, color: String) -> Result<Tag, String> {
    let conn = db.0.lock().map_err(to_err)?;

    conn.execute(
        "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
        params![&id, &name, &color],
    )
    .map_err(to_err)?;

    Ok(Tag { id, name, color })
}

/// The `ON DELETE CASCADE` on `item_tags` removes this tag's assignments, so
/// long as `PRAGMA foreign_keys = ON` was applied when the connection opened.
#[tauri::command]
pub fn delete_tag(db: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(to_err)?;

    conn.execute("DELETE FROM tags WHERE id = ?1", params![&id])
        .map_err(to_err)?;

    Ok(())
}

#[tauri::command]
pub fn list_assignments(db: State<'_, Db>) -> Result<Vec<Assignment>, String> {
    let conn = db.0.lock().map_err(to_err)?;

    let mut stmt = conn
        .prepare("SELECT item_id, tag_id FROM item_tags")
        .map_err(to_err)?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Assignment {
                item_id: row.get(0)?,
                tag_id: row.get(1)?,
            })
        })
        .map_err(to_err)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(to_err)
}

/// `INSERT OR IGNORE` makes this idempotent: assigning a tag twice is a no-op
/// rather than a primary key violation.
#[tauri::command]
pub fn assign_tag(db: State<'_, Db>, item_id: i64, tag_id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(to_err)?;

    conn.execute(
        "INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?1, ?2)",
        params![item_id, &tag_id],
    )
    .map_err(to_err)?;

    Ok(())
}

#[tauri::command]
pub fn remove_assignment(db: State<'_, Db>, item_id: i64, tag_id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(to_err)?;

    conn.execute(
        "DELETE FROM item_tags WHERE item_id = ?1 AND tag_id = ?2",
        params![item_id, &tag_id],
    )
    .map_err(to_err)?;

    Ok(())
}

#[tauri::command]
pub fn seed_db(db: State<'_, Db>) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(to_err)?;
    seed(&mut conn)
}

/* -------------------------------------------------------------------------- */
/*                                  Seeding                                   */
/* -------------------------------------------------------------------------- */

/// Starter tags. Colours are palette keys and are chosen semantically —
/// green reads as approved, amber as needs-attention, grey as inactive.
const SEED_TAGS: &[(&str, &str, &str)] = &[
    ("approved", "Approved", "green"),
    ("needs-review", "Needs Review", "amber"),
    ("q3-campaign", "Q3 Campaign", "purple"),
    ("in-progress", "In Progress", "blue"),
    ("archived", "Archived", "grey"),
];

/// Sample assignments over the frontend's static asset catalogue (ids 1–18).
/// `archived` is deliberately assigned to nothing so the zero-result empty
/// state stays reachable by clicking a tag that has no assets.
const SEED_ASSIGNMENTS: &[(i64, &str)] = &[
    (1, "approved"),
    (1, "q3-campaign"),
    (2, "approved"),
    (2, "needs-review"),
    (3, "q3-campaign"),
    (4, "approved"),
    (5, "q3-campaign"),
    (5, "in-progress"),
    (6, "needs-review"),
    (7, "approved"),
    (8, "approved"),
    (8, "in-progress"),
    (9, "in-progress"),
    (10, "approved"),
    (11, "q3-campaign"),
    (12, "approved"),
    (13, "in-progress"),
    (14, "needs-review"),
    (14, "approved"),
    (15, "q3-campaign"),
    (17, "needs-review"),
];

/// Populates starter data only when the tags table is empty, so running it
/// twice adds nothing. Everything happens in one transaction: a half-seeded
/// database would look "non-empty" and never get repaired by a later run.
pub fn seed(conn: &mut Connection) -> Result<(), String> {
    let tx = conn.transaction().map_err(to_err)?;

    let existing: i64 = tx
        .query_row("SELECT COUNT(*) FROM tags", [], |row| row.get(0))
        .map_err(to_err)?;

    if existing > 0 {
        return Ok(());
    }

    for (id, name, color) in SEED_TAGS {
        tx.execute(
            "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
            params![id, name, color],
        )
        .map_err(to_err)?;
    }

    for (item_id, tag_id) in SEED_ASSIGNMENTS {
        tx.execute(
            "INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?1, ?2)",
            params![item_id, tag_id],
        )
        .map_err(to_err)?;
    }

    tx.commit().map_err(to_err)?;

    Ok(())
}
