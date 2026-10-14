import { useCallback, useEffect, useRef, useState } from 'react'

export type WakeLockState = 'unsupported' | 'idle' | 'held' | 'failed'

/**
 * Keeps the screen awake while `wanted` is true (a session is running and the user allows it).
 * - Requests only when the page is visible; the browser drops the lock when the tab is hidden, so it is
 *   re-requested once when the page becomes visible again (one attempt per event — no retry loops).
 * - Releases when no longer wanted, and on unmount.
 * - A website cannot keep the screen on once the device is locked or the page is left; that is up to the OS.
 */
export function useWakeLock(wanted: boolean): WakeLockState {
  const supported = typeof navigator !== 'undefined' && Boolean((navigator as { wakeLock?: unknown }).wakeLock)
  const [state, setState] = useState<WakeLockState>(supported ? 'idle' : 'unsupported')
  const sentinel = useRef<WakeLockSentinel | null>(null)
  const pending = useRef(false)
  const wantedRef = useRef(wanted)
  wantedRef.current = wanted

  const acquire = useCallback(async () => {
    if (!supported || sentinel.current || pending.current || document.visibilityState !== 'visible') return
    pending.current = true
    try {
      const lock = await navigator.wakeLock.request('screen')
      if (!wantedRef.current) {
        await lock.release() // no longer needed by the time the request resolved
        return
      }
      sentinel.current = lock
      lock.addEventListener('release', () => {
        if (sentinel.current === lock) {
          sentinel.current = null
          setState('idle')
        }
      })
      setState('held')
    } catch {
      setState('failed') // e.g. battery saver, permissions policy, or the page was not focused
    } finally {
      pending.current = false
    }
  }, [supported])

  const release = useCallback(async () => {
    const lock = sentinel.current
    sentinel.current = null
    if (lock) {
      try {
        await lock.release()
      } catch {
        /* already released */
      }
    }
    setState((s) => (s === 'unsupported' ? s : 'idle'))
  }, [])

  useEffect(() => {
    if (wanted) void acquire()
    else void release()
  }, [wanted, acquire, release])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && wantedRef.current && !sentinel.current) void acquire()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void release()
    }
  }, [acquire, release])

  return state
}
