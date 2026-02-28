// meal-tracker-sync: Cloudflare Worker
//
// A dead-simple key-value sync endpoint for two-parent data sharing.
// Each family picks a shared code (e.g. "SMITH42"). The app fetches
// the stored JSON on sync, merges it locally, then writes back.
//
// Deploy:
//   1. npm install -g wrangler
//   2. wrangler login
//   3. wrangler kv:namespace create SYNC_KV
//      → copy the id into wrangler.toml
//   4. wrangler deploy
//
// The worker URL (e.g. https://meal-tracker-sync.you.workers.dev)
// goes in the app's Family → Sync settings.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Strip leading slash, uppercase, strip non-alphanumeric
    const code = url.pathname.slice(1).toUpperCase().replace(/[^A-Z0-9]/g, '');

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing family code' }), { status: 400, headers });
    }

    // GET: return stored data (or null if nothing stored yet)
    if (request.method === 'GET') {
      const data = await env.SYNC_KV.get(code);
      return new Response(data ?? 'null', { status: 200, headers });
    }

    // PUT: store incoming data
    if (request.method === 'PUT') {
      const body = await request.text();
      try {
        JSON.parse(body); // validate JSON before storing
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
      }
      await env.SYNC_KV.put(code, body);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  },
};
