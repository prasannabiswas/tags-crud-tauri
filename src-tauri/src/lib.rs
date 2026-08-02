mod db;

use std::sync::Mutex;

use tauri::Manager;

/// True when the process was started to seed the database and then quit,
/// rather than to show a window. Both a CLI flag and an env var are accepted:
/// the flag is the documented interface, the env var survives the layers of
/// argument forwarding between pnpm, the Tauri CLI and cargo.
fn seed_requested() -> bool {
    std::env::args().any(|arg| arg == "--seed")
        || std::env::var("ATLAS_SEED").is_ok_and(|value| !value.is_empty())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Opened once, here, rather than per command: the schema is applied
            // before any window can call in, and every command then shares this
            // one connection through managed state.
            let mut conn = db::open(app.handle())?;

            if seed_requested() {
                db::seed(&mut conn)?;
                println!("seeded {}", db::resolve_path(app.handle())?.display());
                // Exit before the window opens — this process exists only to
                // write starter rows into the same file the app reads.
                app.handle().exit(0);
                return Ok(());
            }

            app.manage(db::Db(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::list_tags,
            db::add_tag,
            db::delete_tag,
            db::list_assignments,
            db::assign_tag,
            db::remove_assignment,
            db::seed_db,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
