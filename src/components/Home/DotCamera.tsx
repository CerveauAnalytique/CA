'use client'

import React, { useEffect, useRef } from 'react'

const W = 560
const H = 470
const GRID = 4.6

type Pt = [number, number]

function poly(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

function grad(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, v0: number, v1: number) {
  const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1])
  g.addColorStop(0, `rgb(${v0},${v0},${v0})`)
  g.addColorStop(1, `rgb(${v1},${v1},${v1})`)
  return g
}

/** Draws the camera as grayscale shapes; luminance later becomes dot size. */
function drawShapes(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  // Mount neck + base (behind the body)
  poly(ctx, [[215, 330], [330, 345], [345, 410], [225, 400]])
  ctx.fillStyle = grad(ctx, [215, 330], [345, 410], 110, 45)
  ctx.fill()
  poly(ctx, [[170, 405], [340, 385], [470, 430], [300, 462]])
  ctx.fillStyle = grad(ctx, [170, 405], [470, 462], 200, 80)
  ctx.fill()

  // Body side face (right), with vent stripes
  const side: Pt[] = [[262, 112], [520, 205], [545, 335], [270, 305]]
  poly(ctx, side)
  ctx.fillStyle = grad(ctx, [262, 112], [545, 335], 85, 35)
  ctx.fill()
  ctx.save()
  poly(ctx, side)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 3
  for (let i = 0; i < 9; i++) {
    const x = 330 + i * 24
    ctx.beginPath()
    ctx.moveTo(x, 150 + i * 9)
    ctx.lineTo(x + 12, 320 + i * 3)
    ctx.stroke()
  }
  ctx.restore()

  // Body underside
  poly(ctx, [[60, 310], [270, 305], [545, 335], [330, 345], [250, 330]])
  ctx.fillStyle = grad(ctx, [60, 310], [545, 345], 90, 40)
  ctx.fill()

  // Top visor (sunshield)
  poly(ctx, [[48, 62], [215, 6], [535, 150], [522, 208], [262, 112], [190, 58]])
  ctx.fillStyle = grad(ctx, [48, 62], [535, 208], 235, 80)
  ctx.fill()
  poly(ctx, [[215, 6], [535, 150], [520, 172], [205, 40]])
  ctx.fillStyle = grad(ctx, [215, 6], [535, 172], 255, 150)
  ctx.fill()

  // Front hood face
  const F: Pt[] = [[14, 112], [48, 70], [190, 58], [285, 112], [292, 302], [250, 334], [60, 312], [14, 218]]
  poly(ctx, F)
  ctx.fillStyle = grad(ctx, [14, 70], [292, 334], 190, 60)
  ctx.fill()

  // Inner bezel
  const inner: Pt[] = [[44, 128], [66, 100], [188, 92], [256, 134], [262, 288], [236, 306], [74, 290], [44, 214]]
  poly(ctx, inner)
  ctx.fillStyle = '#0b0b0b'
  ctx.fill()
  poly(ctx, inner)
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = 4
  ctx.stroke()

  // Lens: concentric rings
  const cx = 160
  const cy = 205
  const rings = [
    [118, 0.55],
    [100, 0.12],
    [84, 0.8],
    [66, 0.15],
    [50, 0.7],
    [34, 0.2],
    [22, 0.95],
    [10, 0.25],
    [5, 1],
  ] as const
  rings.forEach(([r, v]) => {
    const c = Math.round(v * 255)
    ctx.beginPath()
    ctx.ellipse(cx, cy, r * 0.82, r, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgb(${c},${c},${c})`
    ctx.fill()
  })
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
