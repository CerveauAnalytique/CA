'use client'

import React, { useEffect, useRef } from 'react'

const W = 560
const H = 470
const GRID = 4.4

type V3 = [number, number, number]

const YAW = 0.98
const PITCH = 0.3
const ROLL = -0.42
const LIGHT: V3 = (() => {
  const l: V3 = [-0.45, 0.75, 0.55]
  const n = Math.hypot(...l)
  return [l[0] / n, l[1] / n, l[2] / n]
})()

function rot([x, y, z]: V3): V3 {
  const cy = Math.cos(YAW)
  const sy = Math.sin(YAW)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(PITCH)
  const sp = Math.sin(PITCH)
  const y2 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const cr = Math.cos(ROLL)
  const sr = Math.sin(ROLL)
  return [x1 * cr - y2 * sr, x1 * sr + y2 * cr, z2]
}

type Face = { pts: V3[]; albedo: number; outline?: number; bias?: number; c?: V3 }

function normal(p: V3[]): V3 {
  const [a, b, c] = p
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}

/** Rounded-rectangle profile in the y/z plane. */
function profile(h: number, w: number, r: number, seg = 4): [number, number][] {
  const out: [number, number][] = []
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0],
    [-(w / 2 - r), h / 2 - r, 90],
    [-(w / 2 - r), -(h / 2 - r), 180],
    [w / 2 - r, -(h / 2 - r), 270],
  ]
  for (const [cz, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = ((a0 + (90 * i) / seg) * Math.PI) / 180
      out.push([cz + r * Math.cos(a), cy + r * Math.sin(a)])
    }
  }
  return out
}

/** Prism along x from x0 to x1 with a given y/z profile (+ optional y/z offset). */
function prism(prof: [number, number][], x0: number, x1: number, oy = 0, oz = 0, albedo = 0.8): Face[] {
  const faces: Face[] = []
  const n = prof.length
  for (let i = 0; i < n; i++) {
    const [y0, z0] = [prof[i][0] + oy, prof[i][1] + oz]
    const [y1, z1] = [prof[(i + 1) % n][0] + oy, prof[(i + 1) % n][1] + oz]
    // profile stored as [z, y]; swap below
    faces.push({
      pts: [
        [x0, z0, y0],
        [x1, z0, y0],
        [x1, z1, y1],
        [x0, z1, y1],
      ],
      albedo,
    })
  }
  return faces
}

function circle(x: number, cy: number, cz: number, ry: number, rz: number, n = 40): V3[] {
  const pts: V3[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push([x, cy + ry * Math.cos(a), cz + rz * Math.sin(a)])
  }
  return pts
}

function build(): Face[] {
  const faces: Face[] = []
  const L0 = -1.25
  const L1 = 1.0

  // main housing (rounded rectangle prism). profile entries are [z, y]
  const housing = prism(profile(0.95, 1.05, 0.3), L0, L1, 0, 0, 0.78)
  housing.forEach((f) => (f.c = [0, 0, 0]))
  faces.push(...housing)

  // front cap (flat), slightly bevelled look comes from prism edges
  const cap = profile(0.95, 1.05, 0.3).map(([z, y]) => [L0, y, z] as V3)
  faces.push({ pts: cap, albedo: 0.7, c: [0, 0, 0] })

  // sun visor on top
  const vy0 = 0.46
  const vy1 = 0.6
  const vx0 = L0 - 0.18
  const vx1 = L1 - 0.05
  const vz = 0.62
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, al: number) => [
    { pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] as V3[], albedo: al + 0.12 }, // top
    { pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] as V3[], albedo: al }, // +z
    { pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] as V3[], albedo: al - 0.05, outline: 1 }, // front
    { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] as V3[], albedo: al }, // -z
    { pts: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] as V3[], albedo: al }, // back
  ]
  const vb = box(vx0, vx1, vy0, vy1, -vz, vz, 0.85)
  vb.forEach((f) => ((f as Face).c = [(vx0 + vx1) / 2, (vy0 + vy1) / 2, 0]))
  faces.push(...(vb as Face[]))

  // lens bezel + rings on the front cap
  const fx = L0 - 0.004
  const rings: [number, number, number][] = [
    [0.4, 0.5, 1],
    [0.36, 0.06, 0],
    [0.32, 0.7, 0],
    [0.26, 0.1, 0],
    [0.21, 0.55, 0],
    [0.15, 0.08, 0],
    [0.1, 0.8, 0],
    [0.045, 0.18, 0],
  ]
  rings.forEach(([r, al], i) => {
    faces.push({ pts: circle(fx - i * 0.0006, 0, 0, r, r), albedo: al, bias: 1, c: [0, 0, 0] })
  })
  // lens highlight
  faces.push({
    pts: circle(fx - 0.01, 0.07, -0.06, 0.03, 0.03, 20),
    albedo: 1,
    bias: 1,
    c: [0, 0, 0],
  })

  // mount neck
  const nx = 0.25
  const nr = 0.16
  const n = 14
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    faces.push({
      pts: [
        [nx + nr * Math.cos(a0), -0.47, nr * Math.sin(a0)],
        [nx + nr * Math.cos(a1), -0.47, nr * Math.sin(a1)],
        [nx + nr * Math.cos(a1), -1.0, nr * Math.sin(a1)],
        [nx + nr * Math.cos(a0), -1.0, nr * Math.sin(a0)],
      ],
      albedo: 0.7,
      c: [nx, -0.75, 0],
    })
  }
  // base plate
  const br = 0.6
  const top: V3[] = []
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    top.push([nx + br * Math.cos(a), -1.0, br * Math.sin(a)])
  }
  for (let i = 0; i < 28; i++) {
    const a = top[i]
    const b = top[(i + 1) % 28]
    faces.push({
      pts: [[a[0], -1.12, a[2]], [b[0], -1.12, b[2]], [b[0], -1.0, b[2]], [a[0], -1.0, a[2]]],
      albedo: 0.6,
      c: [nx, -1.06, 0],
    })
  }
  faces.push({ pts: top, albedo: 0.9, c: [nx, -1.4, 0] })
  return faces
}

function drawShapes(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  const faces = build()
  const proj = faces.map((f) => {
    const pts = f.pts.map(rot)
    return { f, pts }
  })

  // fit to canvas
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  proj.forEach(({ pts }) =>
    pts.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }),
  )
  const s = Math.min((W - 24) / (maxX - minX), (H - 24) / (maxY - minY))
  const ox = (W - (maxX - minX) * s) / 2 - minX * s
  const oy = (H - (maxY - minY) * s) / 2 + maxY * s
  const P = ([x, y]: V3): [number, number] => [x * s + ox, -y * s + oy]

  const order = proj
    .map((p) => ({
      ...p,
      z: p.pts.reduce((a, q) => a + q[2], 0) / p.pts.length + (p.f.bias ? 5 : 0),
    }))
    .sort((a, b) => a.z - b.z)

  for (const { f, pts } of order) {
    let n = normal(pts)
    if (f.c) {
      const cc = rot(f.c)
      const fc = pts.reduce<V3>((a, q) => [a[0] + q[0], a[1] + q[1], a[2] + q[2]], [0, 0, 0])
      const k = pts.length
      const d = n[0] * (fc[0] / k - cc[0]) + n[1] * (fc[1] / k - cc[1]) + n[2] * (fc[2] / k - cc[2])
      if (d < 0) n = [-n[0], -n[1], -n[2]]
    }
    if (n[2] <= 0.001) continue
    const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
    let v = f.albedo * (0.22 + 0.95 * lam)
    if (f.bias) v = f.albedo
    const c = Math.round(Math.max(0, Math.min(1, v)) * 255)
    ctx.beginPath()
    pts.forEach((q, i) => {
      const [x, y] = P(q)
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = `rgb(${c},${c},${c})`
    ctx.fill()
    ctx.lineWidth = f.outline ? 2.5 : 1
    ctx.strokeStyle = f.outline ? '#000' : `rgb(${c},${c},${c})`
    ctx.stroke()
  }
}

export function DotCamera({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const scale = 2
    canvas.width = W * scale * dpr
    canvas.height = H * scale * dpr

    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const octx = off.getContext('2d', { willReadFrequently: true })!
    drawShapes(octx)
    const data = octx.getImageData(0, 0, W, H).data

    const dots: { x: number; y: number; r: number }[] = []
    for (let gy = 0, row = 0; gy < H; gy += GRID * 0.866, row++) {
      for (let gx = (row % 2) * (GRID / 2); gx < W; gx += GRID) {
        const px = Math.min(W - 1, Math.floor(gx))
        const py = Math.min(H - 1, Math.floor(gy))
        const l = data[(py * W + px) * 4] / 255
        if (l < 0.06) continue
        dots.push({ x: gx, y: gy, r: (GRID / 2) * 0.98 * Math.sqrt(l) })
      }
    }

    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const render = (t: number) => {
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#fff'
      const sweep = (t / 1000) * 220
      ctx.beginPath()
      for (const d of dots) {
        // a soft diagonal scan highlight sweeping across the camera
        const k = ((d.x + d.y * 0.6 - sweep) % 900 + 900) % 900
        const boost = k < 60 ? 1 + 0.35 * Math.sin((k / 60) * Math.PI) : 1
        const r = Math.min(GRID / 2, d.r * boost)
        ctx.moveTo(d.x + r, d.y)
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
      }
      ctx.fill()
      if (!reduce) raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: '100%', height: 'auto', aspectRatio: `${W} / ${H}` }}
      aria-label="Security camera drawn with dots"
      role="img"
    />
  )
}
