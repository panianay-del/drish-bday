import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { config } from '../config.js'

export default function Gift() {
  const [phase, setPhase] = useState('idle') // idle | asking | live | fallback
  const video = useRef(null), stream = useRef(null), root = useRef(null)
  const g = config.gift

  useEffect(() => {
    const ctx = gsap.context(() => gsap.from('.gift-sq, .gift-btn', { opacity: 0, y: 24, duration: 1.4, stagger: 0.3, ease: 'power3.out' }), root)
    return () => { ctx.revert(); stream.current && stream.current.getTracks().forEach((t) => t.stop()) }
  }, [])

  useEffect(() => {
    if (phase === 'live' && video.current) video.current.srcObject = stream.current
    if (phase === 'live' || phase === 'fallback') {
      const tl = gsap.timeline({ delay: 1 })
      tl.from('.final-title', { opacity: 0, y: 20, filter: 'blur(8px)', duration: 1.4, ease: 'power3.out' })
        .from('.final-body', { opacity: 0, y: 14, duration: 1.1 }, '-=0.5')
        .from('.final-close', { opacity: 0, letterSpacing: '0.6em', duration: 1.6, ease: 'power2.out' }, '-=0.3')
      return () => tl.kill()
    }
  }, [phase])

  const open = async () => {
    setPhase('asking')
    if (!navigator.mediaDevices?.getUserMedia) return setPhase('fallback')
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setPhase('live')
    } catch { setPhase('fallback') }
  }
  const revealed = phase === 'live' || phase === 'fallback'

  return (
    <section ref={root} className={`scene gift ${revealed ? 'revealed' : ''}`} aria-label="E-Gift">
      <div className="gift-sq" role="img" aria-label={phase === 'live' ? 'Live camera preview' : 'A mysterious square'}>
        {phase === 'live' && <video ref={video} autoPlay playsInline muted />}
        {phase === 'fallback' && <div className="gift-fb"><i /><p>{g.fallback}</p></div>}
      </div>
      {!revealed ? (
        <>
          <button className="gift-btn gold" onClick={open} disabled={phase === 'asking'}>{g.button}</button>
          <p className="gift-note" aria-live="polite">{phase === 'asking' ? g.cameraNotice : ''}</p>
        </>
      ) : (
        <div className="final">
          <h1 className="final-title">{g.title}</h1>
          <p className="final-body">{g.body}</p>
          <p className="final-close">{g.closing}</p>
        </div>
      )}
    </section>
  )
}
