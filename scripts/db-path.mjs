// Prints the absolute path of the SQLite file the app uses, so it can be
// pasted straight into a GUI client (TablePlus, DB Browser, `sqlite3`).
//
// Mirrors the resolution order in src-tauri/src/db.rs: ATLAS_DB_PATH wins,
// otherwise the OS app-data directory keyed by the bundle identifier from
// tauri.conf.json.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const { identifier } = JSON.parse(
  readFileSync(join(root, 'src-tauri', 'tauri.conf.json'), 'utf8')
);

const override = process.env.ATLAS_DB_PATH?.trim();

const defaultDir = {
  darwin: () => join(homedir(), 'Library', 'Application Support', identifier),
  win32: () => join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), identifier),
  linux: () =>
    join(process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), identifier),
};

const resolver = defaultDir[process.platform] ?? defaultDir.linux;

console.log(override ? resolve(override) : join(resolver(), 'library.db'));
