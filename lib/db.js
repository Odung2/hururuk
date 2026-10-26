// Shared helpers for Pages Functions. Tables are created on first use, so no manual SQL step is needed.
let ready = false;

export async function ensureSchema(db) {
  if (ready) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS waitlist (
      email TEXT PRIMARY KEY,
      source_title TEXT,
      consent INTEGER NOT NULL,
      joined_at TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      session TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT,
      ep INTEGER,
      source TEXT)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS events_name_ts ON events (name, ts)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS events_session ON events (session)`)
  ]);
  ready = true;
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
