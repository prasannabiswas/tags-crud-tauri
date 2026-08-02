# Write-up

Parts D2 and E of the assessment.

---

## D2 — Sync design note

I'd sync the two local tables — `tags` and `item_tags` — rather than the asset
catalogue, since assets are static and only the tagging is user data. Writes go
onto a local outbound queue at mutation time and flush opportunistically, with a
pull on launch and on reconnect; that keeps the app fully usable offline and
avoids re-uploading the whole table on every change. Both tables would gain
`updated_at` and a `deleted_at` tombstone, because a row that simply vanishes
locally is indistinguishable from one that was never synced up, and without
tombstones a delete on device A gets silently resurrected by device B's next
push. For a tag edited in both places I'd take last-writer-wins on `updated_at`
— tag names are low-stakes and a merge UI isn't worth it — but I'd merge
`item_tags` as a set union instead of overwriting, since wrongly dropping an
assignment is more damaging to a user than briefly keeping a stale one. The
failure mode I'd most want to guard against is clock skew deciding those
conflicts, so `updated_at` would be stamped server-side by Supabase rather than
trusted from the device; secondarily, every upsert keys on the natural primary
key (`tags.id`, and the composite `(item_id, tag_id)`) so a retried request
after a dropped response is idempotent rather than duplicating rows.

---

## E1 — Async update

Shipped Collections & Tags end to end today. Tags can be created with a name and
colour, assigned to and removed from any asset, filtered by, and deleted — both
empty states covered. Persistence is SQLite via hand-written Tauri commands; the
frontend cache hydrates once at startup and updates optimistically, rolling back
and surfacing an error if a write fails, so nothing blocks on a round trip.

Still rough: assets are hardcoded rather than read from disk, there's no rename
for an existing tag, deleting one cascades with no undo, and no automated tests
yet.

Two judgement calls. I used Vite rather than Next.js — under Tauri it only runs
as a static export, which disables the server-side features that justify it. And
tag colour is stored as a stable string key rather than a palette index, since
an index silently repoints if the palette is reordered.

No blockers.

---

## E2 — AI-workflow reflection

I used Claude Code throughout. The prompts below are the actual ones I sent, not
cleaned-up versions.

### Prompt 1 — feature build + the Part C fix, constrained to house style

> can you go through the coding pattern in
> `/Users/…/gooups_social/frontend/src`, the design is done in tailwind and
> shadcn adding this in my tauri project … use context provider instead of redux
> … and use
>
> ```ts
> function useTagFilter(items: Item[], tags: string[]) { … }
> ```
>
> one of this hook and fix this let the data come from context for now

**What I changed, rejected, or double-checked**

I pointed it at an existing production codebase first rather than describing the
conventions, because the output needed to look like it belonged there — that got
me the right shadcn setup, `cn()` helper, provider shape and comment style
without specifying any of it.

On the hook, the obvious fix is adding `selected` to the dependency array. I
rejected that: `filtered` is a pure function of its inputs and shouldn't have
been state at all, so it became a `useMemo` and the effect disappeared. That
fixes the reported symptom and the loop symptom together, rather than patching
one. I also made the unused `tags` argument do real work — bounding the
selection so a deleted tag stops filtering.

The thing I'm glad I checked: the reference repo contains a `tailwind.config.js`
that implies Tailwind v3, and the first setup followed it. Its `package.json`
actually pins v4 — the config is a stale leftover. Had I trusted the file, I'd
have built the whole UI on the wrong major version and against the team's real
conventions.

### Prompt 2 — persistence, specified tightly enough to constrain the output

> Implement local SQLite persistence for a Tauri 2.0 + React + TypeScript (Vite)
> desktop app — NOT Next.js. … There is NO HTTP server and NO network layer. Do
> NOT use axios, fetch, or any HTTP client. … Use the `rusqlite` crate with the
> `bundled` feature. Do NOT use tauri-plugin-sql — I want hand-written
> `#[tauri::command]` functions. … Run `PRAGMA foreign_keys = ON;` on every
> connection open (SQLite defaults it off, so ON DELETE CASCADE won't fire
> otherwise). … Open the DB file in the OS app-data directory via
> `app.path().app_data_dir()` … do not use a temp dir or a path next to the
> binary.

**What I changed, rejected, or double-checked**

I wrote this one as a spec with explicit negatives, because the default answer
to "add SQLite to Tauri" is `tauri-plugin-sql`, and left unconstrained the data
layer tends to arrive shaped like a REST client even when there's no server.

I rejected keeping tag colour as the palette array index the existing code used.
Persisted colour has to survive the palette being reordered and a tag being
deleted and recreated, so it became a stable string key — which also kept the
light/dark colour pairs intact.

Two things I verified rather than trusted. First, Tauri's camelCase → snake_case
argument mapping: it's documented, but it fails silently at runtime rather than
at compile time, so `assign_tag` would have looked fine and just never worked. I
wrote a throwaway script that called each command and left observable rows in
SQLite, checked them from the shell, then deleted it. Second, the
`foreign_keys` pragma — I deleted a tag with 8 assignments and confirmed zero
orphaned rows, since a cascade that silently doesn't fire is exactly the kind of
bug that surfaces weeks later.

### Prompt 3 — pushing back on generated UI

> does tauri app have a UI like this only? because the outer part of dashboard is
> not necessary … State / Populated / Filter active … part needs to be removed
> from UI

**What I changed, rejected, or double-checked**

The generated UI had faithfully reproduced the design mock's fake macOS window
chrome — traffic lights and a title bar — *inside a real OS window*. Faithful to
the reference and wrong for the medium. Removing the frame and the demo-only
scenario switcher is the sort of call that needs someone looking at the running
app; the model had no reason to question its source material.

### Where I found the tooling least reliable

Anything asserted about the environment rather than the code. Three examples
from this build: a shell script used `timeout`, which doesn't exist on macOS, so
a test "passed" without running; a later run failed on port 1420 still being
held by a stale process and was nearly read as a real result; and documentation
was drafted claiming the Tauri CLI loads a root `.env`, which it does not — I
only found that by setting a variable there and confirming it never reached the
Rust process. Code that compiles gets checked by the compiler. Claims about
paths, ports, CLI flags and platform behaviour don't, and those are where I
stopped trusting output and ran it.
