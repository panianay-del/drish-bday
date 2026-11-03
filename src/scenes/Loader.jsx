import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { config } from '../config.js'

export default function Loader({ onDone }) {
  const root = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ onComplete: onDone })
        .fromTo('.ld-letter', { opacity: 0, y: 30, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.09, ease: 'power3.out' })
        .fromTo('.ld-line i', { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'power1.inOut' }, 0.3)
        .fromTo('.ld-sub', { opacity: 0 }, { opacity: 0.7, duration: 1 }, 0.8)
        .to('.ld-inner', { opacity: 0, scale: 1.06, duration: 0.7, ease: 'power2.in' }, '+=0.3')
      gsap.to('.ld-dust span', { y: 'random(-120,-40)', x: 'random(-30,30)', opacity: 0, duration: 'random(2.5,4)', repeat: -1, ease: 'none', stagger: { each: 0.1, from: 'random' } })
    }, root)
    return () => ctx.revert()
  }, [onDone])
  return (
    <section ref={root} className="scene loader" aria-label="Loading">
      <div className="ld-dust" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <span key={i} style={{ left: `${(i * 37) % 100}%`, top: `${40 + (i * 53) % 55}%` }} />)}</div>
      <div className="ld-inner">
        <h2 aria-label={config.name}>{[...config.name].map((c, i) => <span className="ld-letter" key={i}>{c}</span>)}</h2>
        <div className="ld-line"><i /></div>
        <p className="ld-sub">A letter is being written</p>
      </div>
    </section>
  )
}
