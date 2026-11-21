#!/usr/bin/env node
// CA7 Camera Agent (preview). Polls JPEG snapshot URLs, compares each frame with the previous one
// (32x32 grayscale) and sends a movement score to CA7 as a record.
import sharp from 'sharp'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const site = (args.site || process.env.CA7_SITE || 'https://cloud.ca7.io').replace(/\/$/, '')
const token = args.token || process.env.CA7_TOKEN
const cameras = (args.camera || process.env.CA7_CAMERAS || '').split(',').filter(Boolean) // name=url,name=url
const every = Number(args.every || process.env.CA7_EVERY || 10) * 1000

if (!token || !cameras.length) {
  console.error('Usage: node agent.mjs --token=cs_... --camera=door=http://192.168.1.20/snapshot.jpg[,name=url] [--site=https://cloud.ca7.io] [--every=10]')
  process.exit(1)
}

const SIZE = 32
const previous = new Map()

async function frame(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`camera answered ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return sharp(buf).resize(SIZE, SIZE, { fit: 'fill' }).greyscale().raw().toBuffer()
}

/** 0 = identical, 100 = completely different */
const score = (a, b) => {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i])
  return Math.round((sum / a.length / 255) * 1000) / 10
}

async function tick() {
  const records = []
  for (const entry of cameras) {
    const [name, ...rest] = entry.split('=')
    const url = rest.join('=')
    try {
      const now = await frame(url)
      const before = previous.get(name)
      previous.set(name, now)
      if (before) records.push({ camera: name, motion: score(before, now), timestamp: new Date().toISOString() })
    } catch (e) {
      console.error(`[${name}] ${e.message}`)
    }
  }
  if (!records.length) return
  const res = await fetch(`${site}/api/ca/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CA7-Token': token },
    body: JSON.stringify({ records }),
  })
  console.log(new Date().toLocaleTimeString(), res.status, records.map((r) => `${r.camera}:${r.motion}`).join(' '))
}

console.log(`CA7 Camera Agent: ${cameras.length} camera(s), every ${every / 1000}s -> ${site}`)
await tick()
setInterval(() => tick().catch((e) => console.error(e.message)), every)
