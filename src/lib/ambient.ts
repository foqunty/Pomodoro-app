import { soundEngine } from './sound'

/**
 * Optional ambient layer. Everything is synthesised locally with the Web Audio API
 * (no recordings, so there is no third-party audio licence to track), and it reuses the
 * shared AudioContext from `soundEngine`, so it stays separate from the click/chime sounds
 * but obeys the same user-gesture unlock.
 */
export type AmbientId = 'brown' | 'soft' | 'rain'

export const AMBIENT_SOUNDS: { id: AmbientId; label: string; hint: string }[] = [
  { id: 'brown', label: 'Brown noise', hint: 'Deep, warm rumble' },
  { id: 'soft', label: 'Soft noise', hint: 'Gentle pink noise' },
  { id: 'rain', label: 'Gentle rain', hint: 'Synthesised, not a recording' },
]

export const DEFAULT_AMBIENT_VOLUME = 0.3

const LOOP_SECONDS = 8
const SEAM_SECONDS = 0.5
const FADE_IN = 0.8
const FADE_OUT = 0.5

type NoiseKind = 'brown' | 'pink' | 'white'

/** One looping buffer per noise kind, generated once and reused (never per render). */
function makeNoise(ctx: AudioContext, kind: NoiseKind): AudioBuffer {
  const rate = ctx.sampleRate
  const loop = Math.floor(LOOP_SECONDS * rate)
  const seam = Math.floor(SEAM_SECONDS * rate)
  const raw = new Float32Array(loop + seam)
  let last = 0
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < raw.length; i++) {
    const white = Math.random() * 2 - 1
    if (kind === 'white') raw[i] = white
    else if (kind === 'brown') {
      last = (last + 0.02 * white) / 1.02
      raw[i] = last
    } else {
      // Paul Kellet's economy pink-noise filter
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      raw[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      b6 = white * 0.115926
    }
  }
  // Cross-fade the tail into the head so the loop point is inaudible.
  const out = new Float32Array(loop)
  for (let i = 0; i < loop; i++) {
    out[i] = i < seam ? raw[i] * (i / seam) + raw[loop + i] * (1 - i / seam) : raw[i]
  }
  let peak = 0
  for (let i = 0; i < loop; i++) peak = Math.max(peak, Math.abs(out[i]))
  const buffer = ctx.createBuffer(1, loop, rate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < loop; i++) data[i] = out[i] / (peak || 1)
  return buffer
}

interface Voice {
  gain: GainNode
  sources: AudioScheduledSourceNode[]
  nodes: AudioNode[]
  timer?: number
}

class AmbientEngine {
  private master: GainNode | null = null
  private masterCtx: AudioContext | null = null
  private voices = new Set<Voice>()
  private buffers = new Map<NoiseKind, AudioBuffer>()
  private volume = DEFAULT_AMBIENT_VOLUME

  private buffer(ctx: AudioContext, kind: NoiseKind) {
    let b = this.buffers.get(kind)
    if (!b) this.buffers.set(kind, (b = makeNoise(ctx, kind)))
    return b
  }

  private loop(ctx: AudioContext, kind: NoiseKind, voice: Voice) {
    const src = ctx.createBufferSource()
    src.buffer = this.buffer(ctx, kind)
    src.loop = true
    // Start each source at a random offset so layers never phase-lock.
    src.start(0, Math.random() * LOOP_SECONDS)
    voice.sources.push(src)
    return src
  }

  private spawn(ctx: AudioContext, master: GainNode, id: AmbientId) {
    const voice: Voice = { gain: ctx.createGain(), sources: [], nodes: [] }
    voice.gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    voice.gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_IN)
    voice.gain.connect(master)

    const chain = (src: AudioNode, ...rest: AudioNode[]) => {
      let node = src
      for (const n of rest) {
        node.connect(n)
        node = n
      }
      voice.nodes.push(...rest)
      return node
    }
    const filter = (type: BiquadFilterType, freq: number, q = 0.707) => {
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.Q.value = q
      return f
    }
    const gain = (v: number) => {
      const g = ctx.createGain()
      g.gain.value = v
      return g
    }

    if (id === 'brown') {
      chain(this.loop(ctx, 'brown', voice), gain(0.9), voice.gain)
    } else if (id === 'soft') {
      chain(this.loop(ctx, 'pink', voice), filter('lowpass', 4500), gain(0.8), voice.gain)
    } else {
      // Rain: a broad bed plus a faint, slowly shimmering high layer.
      chain(this.loop(ctx, 'pink', voice), filter('bandpass', 1400, 0.45), gain(1.0), voice.gain)
      const shimmer = gain(0.14)
      chain(this.loop(ctx, 'white', voice), filter('highpass', 3800), shimmer, voice.gain)
      const lfo = ctx.createOscillator()
      const depth = gain(0.07)
      lfo.frequency.value = 0.27
      lfo.connect(depth).connect(shimmer.gain)
      lfo.start()
      voice.sources.push(lfo)
      voice.nodes.push(depth)
    }
    voice.nodes.push(voice.gain)
    this.voices.add(voice)
  }

  private ensureMaster(ctx: AudioContext) {
    if (this.master && this.masterCtx === ctx) return this.master
    this.master = ctx.createGain()
    this.master.gain.value = this.curve(this.volume)
    this.master.connect(ctx.destination)
    this.masterCtx = ctx
    return this.master
  }

  private curve(v: number) {
    return v * v * 0.8
  }

  private fadeOut(voice: Voice, ctx: AudioContext) {
    const now = ctx.currentTime
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now)
    voice.gain.gain.linearRampToValueAtTime(0.0001, now + FADE_OUT)
    voice.timer = window.setTimeout(() => this.release(voice), (FADE_OUT + 0.1) * 1000)
  }

  /** Stop sources and disconnect nodes so nothing keeps running (or leaks). */
  private release(voice: Voice) {
    window.clearTimeout(voice.timer)
    for (const s of voice.sources) {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
      s.disconnect()
    }
    for (const n of voice.nodes) n.disconnect()
    this.voices.delete(voice)
  }

  private replaceWith(id: AmbientId) {
    const ctx = soundEngine.context
    if (!ctx || ctx.state !== 'running') return false
    const master = this.ensureMaster(ctx)
    for (const v of this.voices) if (!v.timer) this.fadeOut(v, ctx)
    this.spawn(ctx, master, id)
    return true
  }

  /** Call from a user gesture. Resolves false if the browser would not let audio run. */
  async start(id: AmbientId, volume: number): Promise<boolean> {
    await soundEngine.unlock()
    this.volume = volume
    const ctx = soundEngine.context
    if (ctx) this.ensureMaster(ctx).gain.value = this.curve(volume)
    try {
      return this.replaceWith(id)
    } catch {
      return false
    }
  }

  switchTo(id: AmbientId) {
    try {
      return this.replaceWith(id)
    } catch {
      return false
    }
  }

  setVolume(v: number) {
    this.volume = v
    const ctx = soundEngine.context
    if (ctx && this.master) this.master.gain.setTargetAtTime(this.curve(v), ctx.currentTime, 0.05)
  }

  /** Fade out and release. */
  stop() {
    const ctx = soundEngine.context
    if (!ctx) return
    for (const v of this.voices) if (!v.timer) this.fadeOut(v, ctx)
  }

  /** Immediate teardown (unmount). */
  dispose() {
    for (const v of [...this.voices]) this.release(v)
  }

  get activeVoices() {
    return this.voices.size
  }
}

export const ambientEngine = new AmbientEngine()
