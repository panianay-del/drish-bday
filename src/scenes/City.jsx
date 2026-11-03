import { useEffect, useRef } from 'react'
import { config } from '../config.js'

// Original night-city flythrough drawn on a 2D canvas with perspective projection (light on mobile GPUs).
const DUR = 8, DEPTH = 2200, SIGNS = ['HAPPY BIRTHDAY', config.name.toUpperCase(), 'MAKE A WISH', 'HAPPY BIRTHDAY']
const hash = (a, b, c) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x) }

export default function City({ onDone }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current, g = cv.getContext('2d')
    let w, h, raf, dpr = Math.min(devicePixelRatio, 1.5)
    const resize = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize(); addEventListener('resize', resize)

    const bs = []
    for (let i = 0; i < 44; i++) for (const side of [-1, 1]) {
      const bw = 110 + hash(i, side, 1) * 120
      bs.push({ x: side * (150 + hash(i, side, 2) * 230 + bw / 2), w: bw, h: 500 + hash(i, side, 3) * 1300, z: 40 + i * (DEPTH / 44) + hash(i, side, 4) * 30,
        seed: i * 2 + (side > 0 ? 1 : 0), tint: 200 + hash(i, side, 5) * 40, sign: i % 9 === 3 ? SIGNS[(i / 9 | 0) % 4] : null })
    }
    const stars = Array.from({ length: 70 }, (_, i) => [hash(i, 1, 9), hash(i, 2, 9) * 0.5, hash(i, 3, 9)])
    const t0 = performance.now(); let last = t0, zOff = 0

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now
      if (t > DUR) { cancelAnimationFrame(raf); onDone(); return }
      const speed = 520 + 900 * Math.min(1, t / 2.5) * (t > DUR - 2 ? 1 - (t - (DUR - 2)) / 2 * 0.7 : 1); zOff += speed * dt
      const F = Math.min(w, h * 1.2) * 0.9, cx = w / 2 + Math.sin(t * 1.3) * 40, cy = h * 0.46 + Math.cos(t * 0.9) * 14
      const camX = Math.sin(t * 0.9) * 150 + Math.sin(t * 2.1) * 30, camY = 650 + Math.sin(t * 0.7) * 160
      const roll = Math.sin(t * 0.9 + 1.2) * 0.07

      g.save(); g.translate(w / 2, h / 2); g.rotate(roll); g.translate(-w / 2, -h / 2)
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#05060d'); sky.addColorStop(0.55, '#171228'); sky.addColorStop(1, '#3a2418')
      g.fillStyle = sky; g.fillRect(-100, -100, w + 200, h + 200)
      g.fillStyle = 'rgba(255,245,225,.8)'; stars.forEach(([x, y, r]) => g.fillRect(x * w, y * h, r * 1.6 + 0.4, r * 1.6 + 0.4))

      const list = bs.map((b) => ({ b, z: ((b.z - zOff) % DEPTH + DEPTH) % DEPTH + 30 })).sort((a, c) => c.z - a.z)
      for (const { b, z } of list) {
        const s = F / z, fog = Math.min(1, Math.max(0, 1 - z / DEPTH)), sx = cx + (b.x - b.w / 2 - camX) * s, sw = b.w * s
        const top = cy - (b.h - camY) * s, bot = cy + camY * s
        if (sx > w + 50 || sx + sw < -50) continue
        g.globalAlpha = Math.min(1, fog * 2.2)
        g.fillStyle = `hsl(${b.tint},30%,${5 + fog * 5}%)`; g.fillRect(sx, top, sw, bot - top)
        g.fillStyle = `hsla(${b.tint},40%,60%,.06)`; g.fillRect(sx + (b.x < 0 ? sw - 3 * s : 0), top, 3 * s, bot - top)
        // lit windows
        const step = 26, cols = Math.floor(b.w / 22)
        for (let row = 0; row < b.h / step; row++) {
          const wy = top + row * step * s; if (wy > h || wy + 14 * s < 0) continue
          for (let c = 0; c < cols; c++) {
            const v = hash(b.seed, row, c); if (v < 0.5) continue
            g.fillStyle = v > 0.9 ? 'rgba(160,200,255,.9)' : v > 0.7 ? 'rgba(255,214,140,.95)' : 'rgba(255,190,100,.7)'
            g.fillRect(sx + (c * 22 + 5) * s, wy, 12 * s, 14 * s)
          }
        }
        if (b.sign && z < 1500) { // glowing birthday signs on facades
          const fs = Math.max(6, (b.w * 0.98 / (b.sign.length * 0.62)) * s), y = cy - (b.h * 0.55 - camY) * s
          g.font = `500 ${fs}px Inter, sans-serif`; g.textAlign = 'center'; g.shadowColor = '#ffb347'; g.shadowBlur = 18 * s * 3
          g.fillStyle = '#fff4d6'; g.fillText(b.sign, sx + sw / 2, y); g.shadowBlur = 0
        }
      }
      g.globalAlpha = 1
      // speed streaks
      g.strokeStyle = 'rgba(255,230,190,.12)'; g.lineWidth = 1
      for (let i = 0; i < 26; i++) { const a = hash(i, 5, 5) * 6.283, r0 = 80 + ((i * 97 + t * speed * 0.6) % Math.max(w, h)), r1 = r0 + 40 + speed * 0.03
        g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7); g.stroke() }
      g.restore()

      // hero moment
      const k = Math.min(1, Math.max(0, (t - 4.6) / 1.2)), out = Math.min(1, Math.max(0, (t - (DUR - 0.8)) / 0.8))
      if (k > 0) {
        g.save(); g.globalAlpha = k * (1 - out); g.textAlign = 'center'; g.shadowColor = '#ffb347'; g.shadowBlur = 40
        g.fillStyle = '#fff4d6'; const sc = 0.92 + 0.08 * k
        g.font = `400 ${Math.min(w * 0.12, 90) * sc}px "Pinyon Script", cursive`; g.fillText('Happy Birthday', w / 2, h * 0.47)
        g.font = `500 ${Math.min(w * 0.17, 140) * sc}px "Cormorant Garamond", serif`; g.fillText(config.name, w / 2, h * 0.47 + Math.min(w * 0.17, 140) * 0.95)
        g.restore()
      }
      const vg = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)')
      g.fillStyle = vg; g.fillRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize) }
  }, [onDone])
  return <section className="scene city" aria-label="New York at night"><canvas ref={ref} /></section>
}
