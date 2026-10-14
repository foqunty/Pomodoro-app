/**
 * Tiny Web Audio synth — no audio files. The AudioContext is only created after
 * a user gesture (turning sound on), so nothing ever autoplays. All sounds are
 * soft sine tones with short attack/decay envelopes (no harsh edges).
 */
class SoundEngine {
  private ctx: AudioContext | null = null

  /** The shared AudioContext (exists only after the user has turned sound on). */
  get context() {
    return this.ctx
  }

  /** Must be called from a user gesture. Safe to call repeatedly; never throws. */
  async unlock() {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return
        this.ctx = new Ctor()
      }
      if (this.ctx.state !== 'running') await this.ctx.resume()
      // iOS Safari only fully unlocks output after something has been played in a gesture.
      const silent = this.ctx.createBuffer(1, 1, 22050)
      const src = this.ctx.createBufferSource()
      src.buffer = silent
      src.connect(this.ctx.destination)
      src.start(0)
    } catch {
      /* Audio unavailable or blocked: stay silent. */
    }
  }

  /** Resume a context the OS suspended (e.g. after a screen lock) before playing. */
  private async ready(): Promise<AudioContext | null> {
    const ctx = this.ctx
    if (!ctx) return null
    if (ctx.state !== 'running') {
      try {
        await ctx.resume()
      } catch {
        return null
      }
    }
    return ctx.state === 'running' ? ctx : null
  }

  private tone(ctx: AudioContext, freq: number, at: number, duration: number, peak: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + at
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }

  async click() {
    const ctx = await this.ready()
    if (ctx) this.tone(ctx, 880, 0, 0.07, 0.025)
  }

  async complete() {
    const ctx = await this.ready()
    if (!ctx) return
    // A soft rising triad (C5–E5–G5) with long tails.
    this.tone(ctx, 523.25, 0, 1.6, 0.05)
    this.tone(ctx, 659.25, 0.18, 1.6, 0.045)
    this.tone(ctx, 783.99, 0.36, 2.2, 0.04)
  }
}

export const soundEngine = new SoundEngine()
