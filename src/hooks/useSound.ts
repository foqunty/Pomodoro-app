import { useCallback, useEffect, useRef, useState } from 'react'
import { LOCAL_TRACK } from '../config/music'
import { ambientEngine, type AmbientId } from '../lib/ambient'
import { localTrack } from '../lib/localTrack'
import { soundEngine } from '../lib/sound'
import { loadPrefs, savePrefs } from '../lib/storage'

export type MusicSource = 'youtube' | AmbientId | 'local'
export const DEFAULT_MUSIC_VOLUME = 30

export interface MusicState {
  on: boolean
  source: MusicSource
  /** 0–100 */
  volume: number
  error: string | null
}

const isGenerated = (s: MusicSource): s is AmbientId => s === 'brown' || s === 'soft' || s === 'rain'

/**
 * Three independent audio settings, off by default. Their *preferences* (switches, source, volume) are
 * remembered locally and validated on load; whether music is playing is never restored, so nothing
 * can start by itself after a reload.
 *  - background music (YouTube reference mix / generated noise / optional local file) + its volume,
 *  - UI sound effects (clicks),
 *  - the session-completion chime.
 * Changing one never changes another. The YouTube source is played by <MusicDock>; this hook only
 * holds its on/off, source and volume state (and drives the generated / local sources directly).
 */
export function useSound() {
  const [prefs] = useState(loadPrefs)
  const [uiSounds, setUiSounds] = useState(prefs.uiSounds)
  const [completionSound, setCompletionSound] = useState(prefs.completionSound)
  const uiRef = useRef(prefs.uiSounds)
  const completionRef = useRef(prefs.completionSound)

  const [music, setMusic] = useState<MusicState>({ on: false, source: prefs.musicSource, volume: prefs.musicVolume, error: null })
  const musicRef = useRef(music)
  const update = useCallback((patch: Partial<MusicState>) => {
    musicRef.current = { ...musicRef.current, ...patch }
    setMusic(musicRef.current)
  }, [])

  useEffect(() => {
    savePrefs({ uiSounds, completionSound, musicSource: music.source, musicVolume: music.volume })
  }, [uiSounds, completionSound, music.source, music.volume])

  // After a reload the browser has no audio permission yet: unlock the context on the first interaction
  // (only if a remembered preference needs it). This never plays anything by itself.
  useEffect(() => {
    if (!prefs.uiSounds && !prefs.completionSound) return
    const unlock = () => void soundEngine.unlock()
    const opts = { once: true, passive: true } as const
    window.addEventListener('pointerdown', unlock, opts)
    window.addEventListener('keydown', unlock, opts)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [prefs.uiSounds, prefs.completionSound])

  useEffect(
    () => () => {
      ambientEngine.dispose()
      localTrack.dispose()
    },
    [],
  )

  const stopEngines = () => {
    ambientEngine.stop()
    localTrack.stop()
  }

  /** Starts the non-YouTube sources. YouTube is started by the dock once it is on screen. */
  const startSource = async (source: MusicSource, volume: number) => {
    if (isGenerated(source)) return ambientEngine.start(source, volume / 100)
    if (source === 'local') return localTrack.start(volume / 100)
    return true
  }

  const failIfStale = (started: boolean, source: MusicSource) => {
    const m = musicRef.current
    if (!m.on || m.source !== source) {
      stopEngines() // the user changed their mind while the source was starting
      return
    }
    if (!started) {
      stopEngines()
      update({ on: false, error: 'Your browser did not allow audio to start. Try pressing the button again.' })
    }
  }

  const toggleUiSounds = useCallback(async () => {
    const next = !uiRef.current
    uiRef.current = next
    setUiSounds(next)
    if (next) {
      await soundEngine.unlock()
      void soundEngine.click().catch(() => {})
    }
  }, [])

  const toggleCompletionSound = useCallback(async () => {
    const next = !completionRef.current
    completionRef.current = next
    setCompletionSound(next)
    if (next) await soundEngine.unlock() // so the chime is allowed to play later, even from a background tab
  }, [])

  const toggleMusic = useCallback(async () => {
    const m = musicRef.current
    if (m.on) {
      stopEngines()
      update({ on: false, error: null })
      return
    }
    update({ on: true, error: null })
    const started = await startSource(m.source, m.volume)
    failIfStale(started, m.source)
  }, [update])

  const selectSource = useCallback(
    async (source: MusicSource) => {
      if (source === 'local' && !LOCAL_TRACK) return
      stopEngines()
      update({ source, error: null })
      if (!musicRef.current.on) return
      const started = await startSource(source, musicRef.current.volume)
      failIfStale(started, source)
    },
    [update],
  )

  const setVolume = useCallback(
    (volume: number) => {
      const v = Math.min(100, Math.max(0, Math.round(volume)))
      update({ volume: v })
      ambientEngine.setVolume(v / 100)
      localTrack.setVolume(v / 100)
    },
    [update],
  )

  /** UI clicks and the completion chime each obey only their own switch. */
  const play = useCallback((name: 'click' | 'complete') => {
    const allowed = name === 'click' ? uiRef.current : completionRef.current
    if (allowed) void soundEngine[name]().catch(() => {})
  }, [])

  return { uiSounds, completionSound, music, toggleUiSounds, toggleCompletionSound, toggleMusic, selectSource, setVolume, play }
}
