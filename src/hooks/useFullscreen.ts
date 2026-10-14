import { useCallback, useEffect, useState } from 'react'

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitFullscreenEnabled?: boolean
  webkitExitFullscreen?: () => Promise<void> | void
}
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

const doc = () => document as FsDocument
const isSupported = () => Boolean(document.fullscreenEnabled || doc().webkitFullscreenEnabled)
const current = () => document.fullscreenElement ?? doc().webkitFullscreenElement ?? null

/**
 * Standard Fullscreen API with the WebKit-prefixed fallback. `supported` is false where the
 * browser offers no element fullscreen (notably iPhone Safari); callers should hide the control.
 * State is driven by the fullscreenchange events, so Esc / browser UI exits stay in sync.
 */
export function useFullscreen() {
  const [supported] = useState(isSupported)
  const [active, setActive] = useState(() => current() !== null)

  useEffect(() => {
    const sync = () => setActive(current() !== null)
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (current()) {
        await (document.exitFullscreen?.() ?? doc().webkitExitFullscreen?.())
      } else {
        const el = document.documentElement as FsElement
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.())
      }
    } catch {
      // Request rejected (permissions policy, not a user gesture, …): carry on; nothing else depends on it.
    }
  }, [])

  return { supported, active, toggle }
}
