import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { config } from '../config.js'

function Photo({ p, i }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <figure className={`frame f${i}`} style={{ aspectRatio: p.ratio }}>
      <div className="frame-inner">
        {p.src
          ? <img src={p.src} alt={p.alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} className={loaded ? 'in' : ''} />
          : <div className="ph"><span>PHOTO {i + 1}</span><small>Replace in src/config.js</small></div>}
      </div>
    </figure>
  )
}

export default function Letter({ onNext }) {
  const full = config.letter.join('\n\n')
  const [n, setN] = useState(0)
  const scroller = useRef(null), root = useRef(null)
  const done = n >= full.length
  const reduce = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => { if (reduce.current) setN(full.length) }, [full.length])
  useEffect(() => {
    if (done) return
    const ch = full[n], delay = '.!?'.includes(ch) ? 380 : ',;'.includes(ch) ? 160 : ch === '\n' ? 260 : 22 + Math.random() * 28
    const id = setTimeout(() => setN((v) => v + 1), n === 0 ? 1400 : delay)
    return () => clearTimeout(id)
  }, [n, done, full])
  useEffect(() => { const s = scroller.current; if (s) s.scrollTop = s.scrollHeight }, [n])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.frame', { clipPath: 'inset(0 0 100% 0)', opacity: 0, scale: 1.08, duration: 1.4, stagger: 0.35, ease: 'power3.out', delay: 0.3 })
      gsap.from('.letter-head', { opacity: 0, y: 14, duration: 1.2 })
      if (reduce.current) return
      const move = (e) => { const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5
        gsap.to('.frame', { x: (i) => x * (8 + i * 6), y: (i) => y * (6 + i * 4), duration: 1.2, ease: 'power2.out' }) }
      addEventListener('pointermove', move); return () => removeEventListener('pointermove', move)
    }, root)
    return () => ctx.revert()
  }, [])

  const paras = full.slice(0, n).split('\n\n')
  return (
    <section ref={root} className="scene letter" aria-label="Birthday letter">
      <div className="grain" />
      <header className="letter-head"><span>A letter for</span><b>{config.name}</b></header>
      <div className="letter-grid">
        <div className="letter-text" ref={scroller} aria-live="off">
          {paras.map((t, i) => (
            <p key={i} className={i === 0 ? 'greet' : ''}>{t}{i === paras.length - 1 && !done && <span className="cursor" />}</p>
          ))}
          {done && <span className="cursor idle" />}
        </div>
        <div className="photos" aria-label="Photographs">{config.photos.map((p, i) => <Photo key={i} p={p} i={i} />)}</div>
      </div>
      <div className="letter-actions">
        {!done
          ? <button className="ghost" onClick={() => setN(full.length)}>Skip typing</button>
          : <button className="gold" onClick={onNext}>Continue</button>}
      </div>
      <noscript>{full}</noscript>
    </section>
  )
}
