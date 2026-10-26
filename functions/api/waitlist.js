// POST /api/waitlist  { email, consent: true, source_title, bot }
import { ensureSchema, json } from '../../lib/db.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  // Honeypot: bots fill the hidden field. Pretend it worked and store nothing.
  if (data.bot) return json({ ok: true });

  const email = String(data.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return json({ ok: false, error: 'invalid_email' }, 400);
  if (data.consent !== true) return json({ ok: false, error: 'consent_required' }, 400);
  if (!env.DB) return json({ ok: false, error: 'storage_not_configured' }, 500);

  await ensureSchema(env.DB);
  await env.DB.prepare('INSERT OR IGNORE INTO waitlist (email, source_title, consent, joined_at) VALUES (?1, ?2, 1, ?3)')
    .bind(email, String(data.source_title || '').slice(0, 40), new Date().toISOString())
    .run();
  return json({ ok: true });
}
