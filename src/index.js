// Hururuk Worker: routes /api/* to the handlers in functions/api, everything else to the static site in public/.
import { onRequestPost as waitlist } from '../functions/api/waitlist.js';
import { onRequestPost as event } from '../functions/api/event.js';
import { onRequestGet as stats } from '../functions/api/stats.js';
import { json } from '../lib/db.js';

const ROUTES = {
  '/api/waitlist': ['POST', waitlist],
  '/api/event': ['POST', event],
  '/api/stats': ['GET', stats]
};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const route = ROUTES[pathname];
    if (!route) return env.ASSETS.fetch(request);
    if (request.method !== route[0]) return json({ ok: false, error: 'method_not_allowed' }, 405);
    try {
      return await route[1]({ request, env, ctx });
    } catch (err) {
      console.error(pathname, err);
      return json({ ok: false, error: 'server_error' }, 500);
    }
  }
};
