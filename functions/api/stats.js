// GET /api/stats?days=30  with header  x-stats-key: <STATS_KEY>
import { ensureSchema, json } from '../../lib/db.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = request.headers.get('x-stats-key') || '';
  if (!env.STATS_KEY || key !== env.STATS_KEY) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!env.DB) return json({ ok: false, error: 'storage_not_configured' }, 500);
  await ensureSchema(env.DB);

  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const since = new Date(Date.now() - days * 864e5).toISOString();

  const funnel = await env.DB.prepare(`SELECT
      COUNT(DISTINCT CASE WHEN name = 'landing_view' THEN session END) AS visited,
      COUNT(DISTINCT CASE WHEN name = 'title_view' THEN session END) AS title_page,
      COUNT(DISTINCT CASE WHEN name = 'episode_open' AND ep = 1 THEN session END) AS ep1_opened,
      COUNT(DISTINCT CASE WHEN name = 'episode_finish' AND ep = 3 THEN session END) AS ep3_finished,
      COUNT(DISTINCT CASE WHEN name = 'subscribe_click' THEN session END) AS subscribe_clicked,
      COUNT(DISTINCT CASE WHEN name = 'waitlist_join' THEN session END) AS joined
    FROM events WHERE ts >= ?1`).bind(since).first();

  const titles = await env.DB.prepare(`SELECT title,
      COUNT(DISTINCT CASE WHEN name = 'title_view' THEN session END) AS title_views,
      COUNT(DISTINCT CASE WHEN name = 'episode_open' AND ep = 1 THEN session END) AS ep1_opens,
      COUNT(DISTINCT CASE WHEN name = 'episode_finish' AND ep = 3 THEN session END) AS ep3_finishes,
      COUNT(DISTINCT CASE WHEN name = 'subscribe_click' THEN session END) AS subscribe_clicks
    FROM events WHERE ts >= ?1 AND title IS NOT NULL
    GROUP BY title ORDER BY title_views DESC LIMIT 60`).bind(since).all();

  const sources = await env.DB.prepare(`SELECT l.source AS source,
      COUNT(DISTINCT l.session) AS visits,
      COUNT(DISTINCT c.session) AS subscribe_clicks,
      COUNT(DISTINCT j.session) AS joins
    FROM events l
    LEFT JOIN events c ON c.session = l.session AND c.name = 'subscribe_click'
    LEFT JOIN events j ON j.session = l.session AND j.name = 'waitlist_join'
    WHERE l.name = 'landing_view' AND l.ts >= ?1
    GROUP BY l.source ORDER BY visits DESC LIMIT 30`).bind(since).all();

  const daily = await env.DB.prepare(`SELECT substr(ts, 1, 10) AS day,
      COUNT(DISTINCT CASE WHEN name = 'landing_view' THEN session END) AS visits,
      COUNT(DISTINCT CASE WHEN name = 'subscribe_click' THEN session END) AS subscribe_clicks,
      COUNT(DISTINCT CASE WHEN name = 'waitlist_join' THEN session END) AS joins
    FROM events WHERE ts >= ?1 GROUP BY day ORDER BY day`).bind(since).all();

  const waitlist = await env.DB.prepare('SELECT COUNT(*) AS total FROM waitlist').first();

  return json({ ok: true, days, funnel, titles: titles.results, sources: sources.results, daily: daily.results, waitlist_total: waitlist.total });
}
