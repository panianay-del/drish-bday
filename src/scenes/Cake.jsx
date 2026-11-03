import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { config } from '../config.js'

const CANDLES = 12, CAKE_R = 2.6, CAKE_H = 1.35

function radialTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// Piped-cream lettering: an alpha mask + a blurred bump map so the cream reads as raised icing.
function frostingMaps(lines) {
  const S = 1024, mask = document.createElement('canvas'), bump = document.createElement('canvas')
  mask.width = mask.height = bump.width = bump.height = S
  const m = mask.getContext('2d'), b = bump.getContext('2d')
  m.fillStyle = b.fillStyle = '#000'; m.fillRect(0, 0, S, S); b.fillRect(0, 0, S, S)
  const draw = (ctx, w) => {
    ctx.fillStyle = ctx.strokeStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.lineJoin = ctx.lineCap = 'round'
    lines.forEach((t, i) => {
      const size = i === 0 ? 150 : 210, y = S / 2 + (i === 0 ? -110 : 80)
      ctx.font = `${size}px "Pinyon Script", cursive`
      ctx.lineWidth = w; ctx.strokeText(t, S / 2, y); ctx.fillText(t, S / 2, y)
    })
  }
  draw(m, 7); b.filter = 'blur(7px)'; draw(b, 12); b.filter = 'none'
  return [new THREE.CanvasTexture(mask), new THREE.CanvasTexture(bump)]
}

export default function Cake({ onNext }) {
  const mount = useRef(null), fade = useRef(null), hint = useRef(null)
  const [ready, setReady] = useState(false)
  const readyRef = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = mount.current
    let raf, disposed = false, tl
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, innerWidth < 700 ? 1.5 : 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030303); scene.fog = new THREE.FogExp2(0x030303, 0.045)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60)

    // Table + plate
    const table = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 0.35, metalness: 0.2 }))
    table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table)
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.6, 0.1, 96), new THREE.MeshStandardMaterial({ color: 0xcfa86a, roughness: 0.25, metalness: 0.9 }))
    plate.position.y = 0.05; plate.receiveShadow = true; scene.add(plate)

    // Cake body (cream)
    const cream = new THREE.MeshPhysicalMaterial({ color: 0xfff6e8, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color(0xffe6bf), sheenRoughness: 0.5 })
    const cake = new THREE.Mesh(new THREE.CylinderGeometry(CAKE_R, CAKE_R, CAKE_H, 128), cream)
    cake.position.y = 0.1 + CAKE_H / 2; cake.castShadow = cake.receiveShadow = true; scene.add(cake)
    const topY = 0.1 + CAKE_H

    // Piped bead borders (instanced)
    const beadGeo = new THREE.SphereGeometry(0.1, 20, 14), N = 56
    ;[topY, 0.2].forEach((y) => {
      const beads = new THREE.InstancedMesh(beadGeo, cream, N), d = new THREE.Object3D()
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2
        d.position.set(Math.cos(a) * (CAKE_R - 0.02), y, Math.sin(a) * (CAKE_R - 0.02)); d.scale.set(1, 0.85, 1); d.updateMatrix(); beads.setMatrixAt(i, d.matrix)
      }
      beads.castShadow = true; scene.add(beads)
    })
    // Drip-like scallops on the side
    const sc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 16, 12), cream, 28), d2 = new THREE.Object3D()
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; d2.position.set(Math.cos(a) * CAKE_R, topY - 0.25, Math.sin(a) * CAKE_R); d2.scale.set(1, 1.5 + 0.5 * Math.sin(i * 2.3), 0.6); d2.rotation.y = -a; d2.updateMatrix(); sc.setMatrixAt(i, d2.matrix) }
    scene.add(sc)

    // Frosting lettering on top
    document.fonts.load('150px "Pinyon Script"').finally(() => {
      if (disposed) return
      const [alpha, bump] = frostingMaps(config.cakeLines)
      const txt = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 3.7), new THREE.MeshStandardMaterial({
        color: 0xfffaf0, roughness: 0.4, alphaMap: alpha, transparent: true, bumpMap: bump, bumpScale: 9, depthWrite: false }))
      txt.rotation.x = -Math.PI / 2; txt.position.y = topY + 0.012; scene.add(txt)
    })

    // Candles + flames + shared warm lights
    const flameTex = radialTex([[0, 'rgba(255,250,220,1)'], [0.25, 'rgba(255,200,90,0.95)'], [0.6, 'rgba(255,120,20,0.35)'], [1, 'rgba(255,90,0,0)']])
    const glowTex = radialTex([[0, 'rgba(255,190,100,0.35)'], [1, 'rgba(255,150,40,0)']])
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xf3e8d4, roughness: 0.6 })
    const flames = [], lights = []
    for (let g = 0; g < 4; g++) { const l = new THREE.PointLight(0xffa850, 0, 9, 2); l.position.set(0, topY + 1.4, 0); scene.add(l); lights.push(l) }
    for (let i = 0; i < CANDLES; i++) {
      const a = (i / CANDLES) * Math.PI * 2, x = Math.cos(a) * 2.0, z = Math.sin(a) * 2.0
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 16), candleMat); c.position.set(x, topY + 0.375, z); c.castShadow = true; scene.add(c)
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
      f.position.set(x, topY + 0.98, z); glow.position.copy(f.position); f.scale.set(0, 0, 1); glow.scale.set(0, 0, 1)
      scene.add(f, glow); flames.push({ f, glow, k: 0, seed: Math.random() * 10, x, z })
    }
    scene.add(new THREE.AmbientLight(0x221a14, 0.5))
    const rim = new THREE.DirectionalLight(0x8fa3ff, 0.25); rim.position.set(-6, 5, -6); scene.add(rim)

    // Camera choreography
    const cam = { a: 0, r: 12, h: 3.4, ty: 1.4 }
    const place = () => { camera.position.set(Math.sin(cam.a) * cam.r, cam.h, Math.cos(cam.a) * cam.r); camera.lookAt(0, cam.ty, 0) }
    const lit = new Array(CANDLES).fill(false)
    const light = (i) => { lit[i] = true; gsap.to(flames[i], { k: 1, duration: 0.7, ease: 'power2.out' }) }
    const finish = () => { readyRef.current = true; setReady(true); gsap.fromTo(hint.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.6, ease: 'power2.out' }) }
    if (reduce) {
      Object.assign(cam, { a: Math.PI * 2, r: 1.3, h: 8.6, ty: 1.2 }); lit.fill(true); flames.forEach((f) => (f.k = 1)); gsap.set(fade.current, { opacity: 0 }); finish()
    } else {
      tl = gsap.timeline()
      tl.to(fade.current, { opacity: 0, duration: 3.2, ease: 'power1.inOut' }, 0.3)
        .to(cam, { r: 6.8, h: 2.7, a: Math.PI * 1.8, ty: 1.5, duration: 11.5, ease: 'sine.inOut' }, 0)
      for (let i = 0; i < CANDLES; i++) tl.add(() => light(i), 2.4 + i * 0.6)
      tl.to(cam, { a: Math.PI * 2, r: 1.5, h: 8.4, ty: 1.2, duration: 3.6, ease: 'power3.inOut' }, 11.7).add(finish, '>-0.3')
    }

    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 52 : 38; camera.updateProjectionMatrix() }
    resize(); addEventListener('resize', resize)

    const clock = new THREE.Clock()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const t = clock.getElapsedTime(); place()
      flames.forEach((o, i) => {
        const fl = 1 + 0.12 * Math.sin(t * 11 + o.seed) + 0.08 * Math.sin(t * 23 + o.seed * 2)
        o.f.scale.set(0.3 * o.k * fl * 0.9, 0.55 * o.k * fl, 1); o.glow.scale.set(1.5 * o.k, 1.5 * o.k, 1)
        o.f.position.x = o.x + 0.012 * Math.sin(t * 7 + o.seed); o.glow.position.x = o.f.position.x
      })
      lights.forEach((l, g) => {
        let n = 0; for (let i = g; i < CANDLES; i += 4) n += flames[i].k
        l.intensity = n * 7 * (0.92 + 0.08 * Math.sin(t * 13 + g)); const a = ((g + 0.5) / 4) * Math.PI * 2 + 0.4; l.position.set(Math.cos(a) * 1.6, topY + 1.3, Math.sin(a) * 1.6)
      })
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true; cancelAnimationFrame(raf); removeEventListener('resize', resize); tl && tl.kill(); gsap.killTweensOf(flames)
      scene.traverse((o) => { o.geometry && o.geometry.dispose(); const m = o.material; m && [].concat(m).forEach((x) => { ['map', 'alphaMap', 'bumpMap'].forEach((k) => x[k] && x[k].dispose()); x.dispose() }) })
      renderer.dispose(); renderer.forceContextLoss(); el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <section className={`scene cake ${ready ? 'ready' : ''}`} aria-label="Birthday cake">
      <div ref={mount} className="cake-canvas" onClick={() => readyRef.current && onNext()} />
      <div ref={fade} className="cake-fade" />
      <div className="grain" />
      <p ref={hint} className="cake-hint" style={{ opacity: 0 }}>{config.cakeInstruction}</p>
      {ready && <button className="sr-btn" onClick={onNext}>Click the cake to continue</button>}
    </section>
  )
}
