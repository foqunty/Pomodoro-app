import { LOCAL_TRACK } from '../config/music'

/** Optional looping local file (public/audio/). Created lazily; one element at most. */
class LocalTrack {
  private audio: HTMLAudioElement | null = null

  async start(volume: number): Promise<boolean> {
    if (!LOCAL_TRACK) return false
    if (!this.audio) {
      this.audio = new Audio(LOCAL_TRACK.src)
      this.audio.loop = true
      this.audio.preload = 'none'
    }
    this.audio.volume = volume
    try {
      await this.audio.play()
      return true
    } catch {
      return false
    }
  }

  stop() {
    this.audio?.pause()
  }

  setVolume(volume: number) {
    if (this.audio) this.audio.volume = volume
  }

  dispose() {
    if (!this.audio) return
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    this.audio = null
  }
}

export const localTrack = new LocalTrack()
