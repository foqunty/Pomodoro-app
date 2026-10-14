/** Minimal typings for the parts of the official YouTube IFrame Player API that we use. */
export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  setVolume(volume: number): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getPlayerState(): number
  destroy(): void
}
export interface YTEvent {
  target: YTPlayer
  data: number
}
export interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      host?: string
      videoId: string
      width?: string | number
      height?: string | number
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (e: YTEvent) => void
        onStateChange?: (e: YTEvent) => void
        onError?: (e: YTEvent) => void
        onAutoplayBlocked?: (e: YTEvent) => void
      }
    },
  ) => YTPlayer
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

export const PlayerState = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const
export const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

let apiPromise: Promise<YTNamespace> | null = null

/**
 * Loads the official API script from www.youtube.com — only when the user has asked for the
 * YouTube source (nothing contacts YouTube on page load). Single-flight: one script tag ever.
 */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube API unavailable'))
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      apiPromise = null
      script.remove()
      reject(new Error('YouTube API failed to load'))
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

/** Human-readable reason for an official-API error code (no raw details are surfaced). */
export function describeError(code: number): string {
  if (code === 100 || code === 101 || code === 150 || code === 153)
    return 'This video can’t be played here (it may have been removed, made private or had embedding disabled).'
  if (code === 5) return 'Your browser couldn’t play this video.'
  return 'The video couldn’t be loaded.'
}
