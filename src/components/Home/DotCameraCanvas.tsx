'use client'

import React, { useEffect, useRef } from 'react'

type Data = { w: number; h: number; palette: string[]; dots: number[] }

const RADIUS = 180 // pointer influence radius, in source pixels
const SPRING = 0.045
const DAMPING = 0.86

// How far the camera turns toward the pointer (degrees) and how much the dots shift in depth (source px)
const TURN_Y = 18
const TURN_X = 11
const PARALLAX_X = 46
const PARALLAX_Y = 30
const FOLLOW = 0.07

/**
 * Camera made of dots.
 * - Idle: every dot softly switches on and off in waves.

 * - Pointer anywhere on the page: the camera turns to face it (tilt + per-dot depth parallax),
 *   so it looks like a real 3D object that follows the cursor.
 * - Pointer on the camera: dots also scatter away from the pointer, then pull back together.
 */
export function DotCameraCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let raf = 0
    let cancelled = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pointer = { x: -9999, y: -9999, active: false }
    // normalised pointer position, -1..1 from the centre of the window
    const look = { tx: 0, ty: 0, x: 0, y: 0 }

    fetch('/camera-dots.json')
      .then((r) => r.json())
      .then((data: Data) => {
        if (cancelled) return
        const { w, h, palette, dots } = data
        const n = dots.length / 4
        const hx = new Float32Array(n)
        const hy = new Float32Array(n)
        const px = new Float32Array(n)
        const py = new Float32Array(n)
        const vx = new Float32Array(n)
        const vy = new Float32Array(n)
        const rad = new Float32Array(n)
        const col = new Uint8Array(n)
        const depth = new Float32Array(n)
        const phase = new Float32Array(n)
        const speed = new Float32Array(n)
        for (let i = 0; i < n; i++) {
          hx[i] = px[i] = dots[i * 4]
          hy[i] = py[i] = dots[i * 4 + 1]
          rad[i] = dots[i * 4 + 2] / 10
          col[i] = dots[i * 4 + 3]
          // waves across the camera + a bit of randomness per dot
          phase[i] = (hx[i] * 0.004 + hy[i] * 0.006) * 2 + Math.random() * 2.2
          speed[i] = 0.7 + Math.random() * 0.9
        }
        // depth from dot size: big (bright, lit) dots are the parts nearest to the viewer
        let rMin = Infinity
        let rMax = -Infinity
        for (let i = 0; i < n; i++) {
          rMin = Math.min(rMin, rad[i])
          rMax = Math.max(rMax, rad[i])
        }
        for (let i = 0; i < n; i++) depth[i] = (rad[i] - rMin) / (rMax - rMin || 1) - 0.5

        const ctx = canvas.getContext('2d')!
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const resize = () => {
          const cssW = canvas.clientWidth || w
          canvas.width = Math.round(cssW * dpr)
          canvas.height = Math.round((cssW * h * dpr) / w)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(canvas)

        const toSource = (e: PointerEvent) => {
          const r = canvas.getBoundingClientRect()
          pointer.x = ((e.clientX - r.left) / r.width) * w
          pointer.y = ((e.clientY - r.top) / r.height) * h
          pointer.active = true
        }
        const onMove = (e: PointerEvent) => {
          toSource(e)
          look.tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2))
          look.ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2))
        }
        const onLeave = () => {
          pointer.active = false
          pointer.x = pointer.y = -9999
          look.tx = look.ty = 0
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        window.addEventListener('pointerdown', onMove, { passive: true })
        document.addEventListener('pointerleave', onLeave)
        window.addEventListener('blur', onLeave)

        const draw = (t: number) => {
          const s = canvas.width / w
          ctx.setTransform(s, 0, 0, s, 0, 0)
          ctx.clearRect(0, 0, w, h)
          const time = t / 1000
          let lastCol = -1

          // ease toward the pointer, then turn the whole camera and shift dots by their depth
          if (!reduce) {
            look.x += (look.tx - look.x) * FOLLOW
            look.y += (look.ty - look.y) * FOLLOW
            canvas.style.transform = `perspective(1100px) rotateY(${(look.x * TURN_Y).toFixed(2)}deg) rotateX(${(-look.y * TURN_X).toFixed(2)}deg)`
          }

          for (let i = 0; i < n; i++) {
            if (!reduce) {
              if (pointer.active) {
                const dx = px[i] - pointer.x
                const dy = py[i] - pointer.y
                const d2 = dx * dx + dy * dy
                if (d2 < RADIUS * RADIUS) {
                  const d = Math.sqrt(d2) || 1
                  const f = (1 - d / RADIUS) ** 2 * 12
                  vx[i] += (dx / d) * f + (-dy / d) * f * 0.25
                  vy[i] += (dy / d) * f + (dx / d) * f * 0.25
                }
              }
              vx[i] += (hx[i] - px[i]) * SPRING
              vy[i] += (hy[i] - py[i]) * SPRING
              vx[i] *= DAMPING
              vy[i] *= DAMPING
              px[i] += vx[i]
              py[i] += vy[i]
            }

            // idle: dots switch on and off in waves
            let a = 1
            if (!reduce) {
              const wave = Math.sin(time * 1.7 * speed[i] + phase[i])
              a = 0.12 + 0.88 * Math.min(1, Math.max(0, wave * 1.6 + 0.55))
              // scattered dots stay lit while they fly
              const away = Math.min(1, Math.hypot(px[i] - hx[i], py[i] - hy[i]) / 40)
              a = a + (1 - a) * away
            }

            if (col[i] !== lastCol) {
              ctx.fillStyle = palette[col[i]]
              lastCol = col[i]
            }
            ctx.globalAlpha = a
            ctx.beginPath()
            const ox = look.x * depth[i] * PARALLAX_X
            const oy = look.y * depth[i] * PARALLAX_Y
            ctx.arc(px[i] + ox, py[i] + oy, rad[i], 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalAlpha = 1
          if (!reduce) raf = requestAnimationFrame(draw)
        }
        raf = requestAnimationFrame(draw)

        const cleanup = () => {
          cancelAnimationFrame(raf)
          ro.disconnect()
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerdown', onMove)
          document.removeEventListener('pointerleave', onLeave)
          window.removeEventListener('blur', onLeave)
        }
        ;(canvas as any).__cleanup = cleanup
      })
      .catch(() => {})

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ;(canvas as any).__cleanup?.()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: '100%', height: 'auto', aspectRatio: '1536 / 1024', willChange: 'transform' }}
      role="img"
      aria-label="Security camera made of dots"
    />
  )
}
