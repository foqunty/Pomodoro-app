import { useEffect, useReducer } from 'react'
import { loadTimerState, saveTimerState } from '../lib/storage'
import { timerReducer } from '../lib/timerReducer'

/**
 * Timer state lives in a reducer; the running session is defined by a wall-clock
 * `endAt`, so the interval only *reads* the time and can never drift or restart
 * on re-render. Nothing here is persisted.
 */
export function useTimer() {
  const [state, dispatch] = useReducer(timerReducer, undefined, () => loadTimerState(Date.now()))

  useEffect(() => {
    if (state.status !== 'running') return
    const tick = () => dispatch({ type: 'tick', now: Date.now() })
    const id = window.setInterval(tick, 250)
    // Background tabs throttle timers; re-sync the moment the tab is visible again.
    // Also re-sync when the page is restored from the back/forward cache or regains focus.
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('pageshow', tick)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('pageshow', tick)
      window.removeEventListener('focus', tick)
    }
  }, [state.status])

  // Persist on every meaningful change. While running, endAt (not the ticking remainder) defines the
  // session, so ticks don't write; paused/idle store their remainder.
  const { mode, status, endAt, durations, cycleLength, sessions, focusMinutes, points, unlocked, reward, completions } = state
  const remainder = status === 'running' ? 0 : state.remainingMs
  useEffect(() => {
    saveTimerState(state)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status, endAt, durations, cycleLength, sessions, focusMinutes, points, unlocked, reward, completions, remainder])

  return { state, dispatch }
}
