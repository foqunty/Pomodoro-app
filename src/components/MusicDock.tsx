import { useEffect, useRef, useState } from 'react'
import { YOUTUBE } from '../config/music'
import { describeError, loadYouTubeApi, PlayerState, VIDEO_ID_PATTERN, type YTPlayer } from '../lib/youtube'

type Status = 'loading' | 'playing' | 'paused' | 'blocked' | 'error'

/** Shown under the label only when something needs attention (nothing while it is simply playing). */
const STATUS_TEXT: Record<Exclude<Status, 'error'>, string> = {
  loading: 'Loading…',
  playing: '',
  paused: 'Paused',
  blocked: 'Autoplay blocked — press play',
}

/**
 * Official YouTube IFrame Player (privacy-enhanced host). It is created only while the YouTube source is
 * on, and is destroyed when it is switched off, so there is never more than one player. YouTube requires
 * the player to stay visible, so it is shown here rather than hidden as an invisible audio-only player.
 */
export function MusicDock({ active, volume }: { active: boolean; volume: number }) {
  const dockRef = useRef<HTMLElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const volumeRef = useRef(volume)
  volumeRef.current = volume
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active || !VIDEO_ID_PATTERN.test(YOUTUBE.videoId)) return
    let cancelled = false
    let blockedTimer: number | undefined
    let loadTimer: number | undefined
    let playing = false
    setStatus('loading')
    setError(null)

    loadYouTubeApi()
      .then((YT) => {
        const host = hostRef.current
        if (cancelled || !host) return
        // If the player never becomes ready (blocked embed, offline iframe), say so instead of spinning forever.
        loadTimer = window.setTimeout(() => {
          if (cancelled) return
          setError('The player did not load. Check your connection, or choose a generated sound instead.')
          setStatus('error')
        }, 15000)
        const mount = document.createElement('div') // the API replaces this node with the iframe
        host.replaceChildren(mount)
        playerRef.current = new YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId: YOUTUBE.videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            start: YOUTUBE.startSeconds,
            // No loop/playlist parameters: they make YouTube draw previous/next arrows. We loop in code instead.
            // Most minimal configuration YouTube officially supports: no control bar, no keyboard
            // shortcuts, no fullscreen button, no annotations/captions, no related videos from other channels.
            controls: 0,
            disablekb: 1,
            rel: 0,
            fs: 0,
            playsinline: 1,
            iv_load_policy: 3,
            cc_load_policy: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              window.clearTimeout(loadTimer)
              e.target.setVolume(volumeRef.current)
              e.target.playVideo()
              // No PLAYING event soon after asking to play means the browser blocked autoplay.
              blockedTimer = window.setTimeout(() => {
                if (!cancelled && !playing) setStatus('blocked')
              }, 4000)
            },
            onStateChange: (e) => {
              if (cancelled) return
              if (e.data === PlayerState.PLAYING) {
                playing = true
                setStatus('playing')
              } else if (e.data === PlayerState.ENDED) {
                e.target.seekTo(YOUTUBE.startSeconds, true)
                e.target.playVideo()
              } else if (e.data === PlayerState.PAUSED) {
                playing = false
                setStatus('paused')
              }
            },
            onAutoplayBlocked: () => !cancelled && setStatus('blocked'),
            onError: (e) => {
              if (cancelled) return
              setError(describeError(e.data))
              setStatus('error')
            },
          },
        })
      })
      .catch(() => {
        if (cancelled) return
        setError(
          navigator.onLine
            ? 'YouTube could not be reached. Check your connection, or choose a generated sound instead.'
            : 'You are offline, and YouTube needs a connection. Choose a generated sound — they work offline.',
        )
        setStatus('error')
      })

    return () => {
      cancelled = true
      window.clearTimeout(blockedTimer)
      window.clearTimeout(loadTimer)
      try {
        playerRef.current?.destroy()
      } catch {
        /* player never finished loading */
      }
      playerRef.current = null
      hostRef.current?.replaceChildren()
    }
  }, [active])

  useEffect(() => {
    try {
      playerRef.current?.setVolume?.(volume)
    } catch {
      /* not ready yet; onReady applies the current volume */
    }
  }, [volume])

  // When the browser needs a tap on the player itself, make sure the player is on screen.
  useEffect(() => {
    if (status !== 'blocked') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    dockRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [status])

  if (!active) return null
  // Only surface text when something needs attention (blocked autoplay / failure).
  const note = status === 'error' ? error : status === 'blocked' ? STATUS_TEXT.blocked : ''
  return (
    <aside ref={dockRef} aria-label="Background music player" className="music-dock">
      {/* YouTube requires an unobscured player of at least 200×200, so it cannot be hidden; no other UI is drawn around it. */}
      <div ref={hostRef} className="h-[200px] w-[200px] overflow-hidden rounded-xl bg-black/60 [&_iframe]:h-full [&_iframe]:w-full" />
      {note && (
        <p className="m-0 mt-1 text-[11px] leading-snug text-white/75" role="status" aria-live="polite">
          {note}
        </p>
      )}
    </aside>
  )
}
