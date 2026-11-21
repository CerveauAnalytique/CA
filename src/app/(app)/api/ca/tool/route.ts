export const dynamic = 'force-dynamic'

const html = (origin: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cerveau Analytique – Sync tool</title>
<style>
  :root{--bg:#f6f6f7;--card:#fff;--line:#e4e4e7;--text:#0a0a0a;--mut:#71717a;--blue:#1a3df0}
  *{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;background:var(--bg);color:var(--text);padding:24px}
  main{max-width:720px;margin:0 auto;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:28px}
  h1{font-size:22px;margin:0 0 4px}p{color:var(--mut);margin:0 0 20px}
  label{display:block;font-size:13px;font-weight:600;margin:16px 0 6px}
  input[type=text],input[type=password],input[type=url]{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:10px;font:inherit}
  .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
  button{font:inherit;font-weight:600;padding:10px 18px;border-radius:999px;border:1px solid var(--line);background:#fff;cursor:pointer}
  button.primary{background:var(--text);color:#fff;border-color:var(--text)}
  pre{background:#0a0a0a;color:#d4d4d8;border-radius:12px;padding:14px;max-height:260px;overflow:auto;font-size:12.5px;margin-top:20px;white-space:pre-wrap}
  small{color:var(--mut)}
</style>
</head>
<body>
<main>
  <h1>Cerveau Analytique – Sync tool</h1>
  <p>Fetch all your data through the API and save it, or send it to your own server.</p>

  <label for="base">Site URL</label>
  <input id="base" type="url" value="${origin}">

  <label for="key">Your API key</label>
  <input id="key" type="password" placeholder="ca_..." autocomplete="off">
  <small>Create one in your dashboard under API keys. It stays in this page and is only sent to the site URL above.</small>

  <label for="cols">Collections (optional, comma separated)</label>
  <input id="cols" type="text" placeholder="orders,products,posts">

  <label for="target">Your own server (optional)</label>
  <input id="target" type="url" placeholder="https://my-server.example/ingest">
  <small>The data is sent there with POST as JSON. Your server must allow requests from this page (CORS).</small>

  <label for="auth">Authorization header for your server (optional)</label>
  <input id="auth" type="password" placeholder="Bearer ..." autocomplete="off">

  <div class="row">
    <button id="preview">Preview</button>
    <button id="download">Download JSON</button>
    <button id="send" class="primary">Send to my server</button>
  </div>
  <pre id="log">Ready.</pre>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  const log = (m) => { $('log').textContent = m; };

  async function load() {
    const key = $('key').value.trim();
    if (!key) throw new Error('Enter your API key first.');
    const url = new URL('/api/ca/export', $('base').value.trim());
    if ($('cols').value.trim()) url.searchParams.set('collections', $('cols').value.trim());
    log('Fetching ' + url + ' ...');
    const res = await fetch(url, { headers: { Authorization: 'users API-Key ' + key } });
    if (!res.ok) throw new Error('Site answered ' + res.status + ': ' + (await res.text()));
    return res.json();
  }
  const summary = (d) => Object.entries(d.collections).map(([k, v]) => k + ': ' + v.length + ' records').join('\\n');

  $('preview').onclick = async () => {
    try { const d = await load(); log('OK – ' + d.exportedAt + '\\n' + summary(d)); } catch (e) { log('Error: ' + e.message); }
  };
  $('download').onclick = async () => {
    try {
      const d = await load();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
      a.download = 'cerveau-analytique-' + d.exportedAt.slice(0, 10) + '.json';
      a.click();
      log('Downloaded.\\n' + summary(d));
    } catch (e) { log('Error: ' + e.message); }
  };
  $('send').onclick = async () => {
    try {
      const target = $('target').value.trim();
      if (!target) throw new Error('Enter your server URL first.');
      const d = await load();
      log('Sending to ' + target + ' ...');
      const headers = { 'Content-Type': 'application/json' };
      if ($('auth').value.trim()) headers.Authorization = $('auth').value.trim();
      const res = await fetch(target, { method: 'POST', headers, body: JSON.stringify(d) });
      log('Your server answered ' + res.status + '.\\n' + summary(d));
    } catch (e) { log('Error: ' + e.message); }
  };
</script>
</body>
</html>`

/** GET /api/ca/tool – downloads the standalone HTML sync tool, pre-filled with this site's URL. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  return new Response(html(origin), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cerveau-analytique-sync-tool.html"',
    },
  })
}
