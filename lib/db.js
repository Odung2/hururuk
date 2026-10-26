// Shared helpers for Pages Functions. Tables are created on first use, so no manual SQL step is needed.
let ready = false;

// Columns added after launch. Existing rows keep their data and get NULL in the new columns.
const WAITLIST_ADDED = { genres: 'TEXT', comment: 'TEXT' };

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
  const { results } = await db.prepare('PRAGMA table_info(waitlist)').all();
  const have = new Set(results.map(c => c.name));
  for (const [col, type] of Object.entries(WAITLIST_ADDED)) {
    if (have.has(col)) continue;
    try { await db.prepare(`ALTER TABLE waitlist ADD COLUMN ${col} ${type}`).run(); }
    catch (err) { if (!/duplicate column/i.test(String(err))) throw err; } // another request added it first
  }
  ready = true;
}

// Genre keys offered on the waitlist form (same keys as GENRES in public/index.html).
export const GENRE_KEYS = ['rofan', 'action', 'drama', 'bl', 'gl', 'family', 'hist', 'thriller', 'comedy', 'sports', 'sf'];

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
