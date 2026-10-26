// POST /api/event  { name, session, title?, ep?, source? }  Anonymous funnel events, no cookies, no personal data.
import { ensureSchema } from '../../lib/db.js';

const ALLOWED = new Set(['landing_view', 'title_view', 'episode_open', 'episode_finish', 'subscribe_click', 'waitlist_join']);
const done = () => new Response(null, { status: 204 });

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return done(); }
  const session = String(d.session || '').slice(0, 64);
  if (!env.DB || !ALLOWED.has(d.name) || !session) return done();

  await ensureSchema(env.DB);
  await env.DB.prepare('INSERT INTO events (ts, session, name, title, ep, source) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(
      new Date().toISOString(),
      session,
      d.name,
      d.title ? String(d.title).slice(0, 40) : null,
      Number.isInteger(d.ep) ? d.ep : null,
      d.source ? String(d.source).slice(0, 60) : null
    )
    .run();
  return done();
}
