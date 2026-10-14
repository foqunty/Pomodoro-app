/**
 * Background-music sources that are not generated in the browser.
 *
 * YOUTUBE: the reference mix, played through the official YouTube IFrame Player API (no audio is
 * downloaded or extracted). YouTube's developer policies require the player to stay visible, so it is
 * shown in a small dock while this source is playing. The video can include ads, and can become
 * unavailable if its owner removes it or disables embedding.
 *
 * LOCAL_TRACK: optional. To use your own audio, put a file you have the rights to in public/audio/
 * and fill this in, e.g. { src: '/audio/focus.mp3', title: 'My track', credit: 'Artist, licence' }.
 * While it is null the option is not shown.
 */
export const YOUTUBE = {
  videoId: 'lkkGlVWvkLk',
  startSeconds: 10,
  /** Short in-app name. The full YouTube title/channel are intentionally not repeated in the UI. */
  label: 'Focus mix',
  title: 'Intense Study – 40Hz Gamma Binaural Beats',
  channel: 'Study Sonic Focus',
  watchUrl: 'https://www.youtube.com/watch?v=lkkGlVWvkLk&t=10s',
} as const

export const LOCAL_TRACK: { src: string; title: string; credit?: string } | null = null
