// Soft instrumental "Happy Birthday". Uses config.musicSrc if set, otherwise a gentle synth music-box (public-domain melody).
const NOTES = [[7,.75],[7,.25],[9,1],[7,1],[12,1],[11,2],[7,.75],[7,.25],[9,1],[7,1],[14,1],[12,2],
  [7,.75],[7,.25],[19,1],[16,1],[12,1],[11,1],[9,1],[17,.75],[17,.25],[16,1],[12,1],[14,1],[12,2]]
const VOL = 0.22
let el, ctx, master, timer, on = false, mode = 'synth'

function playSynth() {
  const beat = 0.62, base = 261.63
  let t = ctx.currentTime + 0.1
  for (const [s, b] of NOTES) {
    const f = base * Math.pow(2, s / 12)
    for (const [mult, g] of [[1, 0.5], [2, 0.12]]) {
      const o = ctx.createOscillator(), a = ctx.createGain()
      o.type = 'sine'; o.frequency.value = f * mult
      a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + 0.02)
      a.gain.exponentialRampToValueAtTime(0.0008, t + b * beat * 1.9)
      o.connect(a).connect(master); o.start(t); o.stop(t + b * beat * 2)
    }
    t += b * beat
  }
  timer = setTimeout(() => on && playSynth(), (t - ctx.currentTime + 1.5) * 1000)
}

function fade(to, dur = 3) {
  if (mode === 'file') {
    const from = el.volume, t0 = performance.now()
    const step = () => { const k = Math.min(1, (performance.now() - t0) / (dur * 1000)); el.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(step) }
    step()
  } else {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
    master.gain.linearRampToValueAtTime(to, ctx.currentTime + dur)
  }
}

export async function startMusic(src) {
  if (on) return true
  on = true
  try {
    if (src) { mode = 'file'; el = new Audio(src); el.loop = true; el.volume = 0; await el.play(); fade(VOL); return true }
  } catch (e) { console.warn('Music file failed, using built-in melody', e) }
  try {
    mode = 'synth'
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain(); master.gain.value = 0
    const delay = ctx.createDelay(); delay.delayTime.value = 0.28
    const fb = ctx.createGain(); fb.gain.value = 0.3
    delay.connect(fb); fb.connect(delay)
    master.connect(ctx.destination); master.connect(delay); delay.connect(ctx.destination)
    await ctx.resume(); playSynth(); fade(VOL)
    return true
  } catch (e) { console.warn('Audio unavailable', e); on = false; return false }
}
export function toggleMusic() {
  if (!(el || ctx)) return false
  on = !on
  if (mode === 'file') { on ? (el.play(), fade(VOL, 1)) : (fade(0, 0.6), setTimeout(() => el.pause(), 650)) }
  else if (on) { ctx.resume(); playSynth(); fade(VOL, 1) }
  else { clearTimeout(timer); fade(0, 0.6); setTimeout(() => ctx.suspend(), 650) }
  return on
}
