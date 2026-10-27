// POST /api/profile  { email, gender?, age? }  Optional answers shown right after joining the waitlist.
import { ensureSchema, json, GENDER_KEYS, AGE_KEYS } from '../../lib/db.js';

// Only a signup from the last 30 minutes with no answers yet can be filled in, so a known email can't be overwritten later.
const WINDOW_MS = 30 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const email = String(data.email || '').trim().toLowerCase();
  const gender = GENDER_KEYS.includes(data.gender) ? data.gender : null;
  const age = AGE_KEYS.includes(data.age) ? data.age : null;
  if (!email || (!gender && !age)) return json({ ok: true });
  if (!env.DB) return json({ ok: false, error: 'storage_not_configured' }, 500);

  await ensureSchema(env.DB);
  await env.DB.prepare(`UPDATE waitlist SET gender = ?2, age_band = ?3
    WHERE email = ?1 AND gender IS NULL AND age_band IS NULL AND joined_at >= ?4`)
    .bind(email, gender, age, new Date(Date.now() - WINDOW_MS).toISOString())
    .run();
  return json({ ok: true });
}
