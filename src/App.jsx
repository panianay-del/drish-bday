import { useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import Cake from './scenes/Cake.jsx'
import City from './scenes/City.jsx'
import Loader from './scenes/Loader.jsx'
import Letter from './scenes/Letter.jsx'
import Gift from './scenes/Gift.jsx'
import { startMusic, toggleMusic } from './audio.js'
import { config } from './config.js'

export default function App() {
  const [scene, setScene] = useState('cake')
  const [music, setMusic] = useState(null) // null = not started yet
  const veil = useRef(null)

  // Each transition has its own character: cream flash, dark dive, soft dissolve.
  const go = useCallback((next, kind = 'dark', dur = 0.7) => {
    const color = kind === 'flash' ? '#fff3dc' : '#050505'
    gsap.timeline()
      .set(veil.current, { background: color, display: 'block' })
      .to(veil.current, { opacity: 1, duration: dur, ease: kind === 'flash' ? 'power4.in' : 'power2.inOut' })
      .add(() => setScene(next))
      .to(veil.current, { opacity: 0, duration: dur * 1.3, ease: 'power2.out', onComplete: () => gsap.set(veil.current, { display: 'none' }) })
  }, [])

  const onCake = async () => {
    const ok = await startMusic(config.musicSrc)
    setMusic(ok)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    go(reduce ? 'loader' : 'city', 'flash', 0.9)
  }
  const onMusic = () => setMusic(toggleMusic())

  return (
    <main className="app">
      {scene === 'cake' && <Cake onNext={onCake} />}
      {scene === 'city' && <City onDone={() => go('loader', 'dark', 0.5)} />}
      {scene === 'loader' && <Loader onDone={() => go('letter', 'dark', 0.6)} />}
      {scene === 'letter' && <Letter onNext={() => go('gift', 'dark', 0.9)} />}
      {scene === 'gift' && <Gift />}
      <div ref={veil} className="veil" aria-hidden="true" />
      {music !== null && (
        <button className="music" onClick={onMusic} aria-label={music ? 'Mute music' : 'Play music'} title="Music">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4z" />
            {music ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> : <path d="m16 9 5 6m0-6-5 6" />}
          </svg>
        </button>
      )}
    </main>
  )
}
