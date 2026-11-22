// Records the vertical (1080x1920) walkthrough of the running CA7 site, sharp at 2x, with a blue tap circle at every tap.
//   node record.js <voice-folder> <out-folder>      (voice-folder: output of make_voice.py)
// The site (Flutter web + backend) must answer on https://cloud.ca7.io (see README.md in this folder: local mirror of the domain).
// Writes <out>/video.webm and <out>/timeline.json (when every voice clip starts).
const fs = require('fs')
const path = require('path')
const { launch } = require('./lib.cjs')

const BASE = process.env.CA7_BASE || 'https://cloud.ca7.io'
const [voiceDir, outDir] = process.argv.slice(2)
const { durations } = JSON.parse(fs.readFileSync(path.join(voiceDir, 'durations.json'), 'utf8'))
fs.mkdirSync(outDir, { recursive: true })
const b64 = (f) => fs.readFileSync(path.join(__dirname, 'assets', f)).toString('base64')

const EMAIL = `inv${Date.now() % 100000}@demo.io`
const PASS = 'Demo-pass-1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(p, pathname, opts = {}, token) {
  const res = await fetch((process.env.CA7_LOCAL_API || 'http://localhost:3000') + pathname, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}), ...(opts.headers || {}) } })
  return res.json().catch(() => ({}))
}

const END_CARD = () => `<!doctype html><meta charset="utf-8"><style>html{transform:scale(2);transform-origin:0 0;width:540px!important;height:960px!important;overflow:hidden!important}</style><body style="margin:0;width:540px;height:960px;overflow:hidden;background:#0b2447;font-family:system-ui,sans-serif;color:#fff;position:relative">
<img src="data:image/svg+xml;base64,${b64('login-city.svg')}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,36,71,.2),rgba(11,36,71,.85))"></div>
<div style="position:absolute;left:0;right:0;top:250px;text-align:center"><img src="data:image/svg+xml;base64,${b64('ca7-wordmark-white.svg')}" style="width:190px">
<div style="font-size:34px;font-weight:300;margin-top:26px;letter-spacing:-.5px">The AI brain for business data</div>
<div id="cta" style="display:inline-block;margin-top:56px;background:#fff;color:#0b2447;padding:16px 38px;border-radius:99px;font-size:22px;font-weight:600">Start for free</div>
<div style="margin-top:34px;font-size:30px;letter-spacing:1px">ca7.io</div></div></body>`

;(async () => {
  const { b, c, p } = await launch({ recordVideo: { dir: outDir, size: { width: 1080, height: 1920 } } })
  // move inside the app without reloading it (go_router listens to popstate)
  p.nav = async (pathname, wait = 1200) => { await p.evaluate((u) => { history.pushState({}, '', u); window.dispatchEvent(new PopStateEvent('popstate', { state: {} })) }, pathname); await p.waitForTimeout(wait) }
  const t0 = Date.now()
  const now = () => (Date.now() - t0) / 1000
  const timeline = []
  let pending = null

  const scenes = [
    // 1 what is CA7
    async () => {
      await p.goto(BASE + '/en'); await p.waitForTimeout(3500); pending.voice()
      await p.waitForTimeout(1500); await p.tap(205, 906); await p.waitForTimeout(800)
      await p.scroll(330, 3, 100)
    },
    // 2 how it works
    async () => {
      pending.voice()
      for (let i = 0; i < 4; i++) { await p.scroll(420, 3, 60); await p.waitForTimeout(1700) }
    },
    // 3 create an account
    async () => {
      await p.nav('/en/create-account', 2500); pending.voice()
      await p.tap(270, 320); await p.type(EMAIL, 28)
      await p.tap(270, 400); await p.keyboard.insertText(PASS)
      await p.tap(270, 480); await p.keyboard.insertText(PASS)
      await p.waitForTimeout(500); await p.tap(270, 624, 3500)
    },
    // 4 dashboard
    async () => {
      pending.voice(); await p.scroll(380, 4, 700)
    },
    // 5 connect a data source
    async () => {
      await p.nav('/en/dashboard/connect', 1500); pending.voice()
      await p.tap(268, 373, 900); await p.tap(135, 470, 700)
      await p.tap(268, 420, 400); await p.type('Warehouse sensors', 50); await p.waitForTimeout(400)
      await p.tap(93, 474, 2000)
      await p.scroll(260, 3, 200)
    },
    // 6 API key
    async () => {
      await p.nav('/en/dashboard/api', 1500); pending.voice()
      await p.tap(440, 265, 2200); await p.scroll(200, 3, 150)
    },
    // 7 gateway
    async () => {
      pending.voice(); await p.scroll(420, 3, 120); await p.waitForTimeout(600)
      await p.tap(475, 419, 2200)
      await p.scroll(260, 3, 200); await p.waitForTimeout(600)
    },
    // 8 intelligence (put some sensor records in first)
    async () => {
      const login = await api(p, '/api/users/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASS }) })
      const src = await api(p, '/api/data-sources?limit=1&sort=-createdAt', {}, login.token)
      const sid = src.docs?.[0]?.id
      if (sid) {
        const rows = Array.from({ length: 80 }, (_, i) => ({ temperature: +(20 + Math.sin(i / 7) * 1.8 + (i === 61 ? 14 : 0)).toFixed(1), humidity: 44 + (i % 9), timestamp: new Date(Date.now() - (80 - i) * 600000).toISOString() }))
        await api(p, '/api/ca/v1/records', { method: 'POST', body: JSON.stringify({ source: sid, records: rows }) }, login.token)
      }
      await p.nav('/en/dashboard/intelligence', 2000); pending.voice()
      await p.scroll(380, 4, 900)
    },
    // 9 shop
    async () => {
      await p.nav('/en/shop/iot-gateway-box', 2500); pending.voice()
      await p.scroll(500, 3, 150); await p.waitForTimeout(700)
      await p.tap(81, 370, 1500)
      await p.tap(343, 67, 2500)
    },
    // 10 AI assistant
    async () => {
      await p.nav('/en/assistant', 2000); pending.voice()
      await p.waitForTimeout(600); await p.tap(240, 367, 500); await p.type('I need a temperature sensor', 35); await p.tap(495, 367, 3500); await p.scroll(200, 3, 200)
    },
    // 11 support, security, cookies, log out
    async () => {
      await p.nav('/en/dashboard/settings', 2000); pending.voice()
      await p.scroll(1400, 4, 250); await p.waitForTimeout(800)
      await p.tap(91, 112, 2500)
    },
    // 12 end card
    async () => {
      await p.setContent(END_CARD()); await p.waitForTimeout(1200); pending.voice()
      await p.waitForTimeout(1600); await p.tap(270, 480, 800)
    },
  ]

  for (let i = 0; i < scenes.length; i++) {
    const start = now()
    let voiceAt = null
    pending = { voice: () => { if (voiceAt === null) voiceAt = now() + 0.25 } }
    await scenes[i]()
    if (voiceAt === null) voiceAt = start + 0.25
    const end = Math.max(now(), voiceAt + durations[i] + 0.8)
    await sleep(Math.max(0, (end - now()) * 1000))
    timeline.push({ scene: i, start, voice: voiceAt, end: now() })
    console.log('scene', i + 1, 'voice at', voiceAt.toFixed(2), 'ends', now().toFixed(2))
  }
  const total = now()
  await c.close(); await b.close()
  fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify({ total, scenes: timeline, email: EMAIL }))
  const webm = fs.readdirSync(outDir).find((f) => f.endsWith('.webm'))
  fs.renameSync(path.join(outDir, webm), path.join(outDir, 'video.webm'))
  console.log('done', total.toFixed(1), 's')
})()
