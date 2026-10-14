import { isMet, milestones, rewardMessages } from '../data/milestones'

export type Mode = 'focus' | 'short' | 'long'
export type Status = 'idle' | 'running' | 'paused' | 'completed'
export type Durations = Record<Mode, number> // minutes

export const MODE_LABEL: Record<Mode, string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
}
export const DEFAULT_DURATIONS: Durations = { focus: 25, short: 5, long: 15 }
export const DURATION_LIMITS: Record<Mode, { min: number; max: number }> = {
  focus: { min: 1, max: 90 },
  short: { min: 1, max: 30 },
  long: { min: 1, max: 60 },
}
export const DEFAULT_CYCLE_LENGTH = 4
/** Focus sessions per cycle. The *number of sessions you can complete* is unlimited; this only bounds one cycle. */
export const CYCLE_LIMITS = { min: 1, max: 99 }
const POINTS_PER_MINUTE = 4

export interface Reward {
  mode: Mode
  minutes: number
  points: number
  message: string
  unlocked: string[]
  nextMode: Mode
}

export interface TimerState {
  mode: Mode
  durations: Durations
  /** Focus sessions before a long break. */
  cycleLength: number
  status: Status
  remainingMs: number
  /** Wall-clock timestamp at which the running session ends. */
  endAt: number | null
  sessions: number
  focusMinutes: number
  points: number
  unlocked: string[]
  reward: Reward | null
  /** Number of sessions (focus or break) completed so far; the chime/notification dedupe key. */
  completions: number
}

export type TimerAction =
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'reset' }
  | { type: 'skip' }
  | { type: 'startNext'; now: number }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setDuration'; mode: Mode; minutes: number }
  | { type: 'setCycleLength'; length: number }
  | { type: 'resetProgress' }

const minutesToMs = (m: number) => m * 60_000

export const initialState = (): TimerState => ({
  mode: 'focus',
  durations: DEFAULT_DURATIONS,
  cycleLength: DEFAULT_CYCLE_LENGTH,
  status: 'idle',
  remainingMs: minutesToMs(DEFAULT_DURATIONS.focus),
  endAt: null,
  sessions: 0,
  focusMinutes: 0,
  points: 0,
  unlocked: [],
  reward: null,
  completions: 0,
})

/** Mode that should follow a *completed* session. */
function nextAfterComplete(mode: Mode, sessions: number, cycleLength: number): Mode {
  if (mode !== 'focus') return 'focus'
  return sessions > 0 && sessions % cycleLength === 0 ? 'long' : 'short'
}

/** Focus sessions completed in the current cycle (0 … cycleLength-1). */
export const completedInCycle = (sessions: number, cycleLength: number) => sessions % cycleLength

/** 1-based number of the focus session in progress / just finished, for display. */
export function focusSlot(s: Pick<TimerState, 'sessions' | 'cycleLength' | 'status'>) {
  const done = completedInCycle(s.sessions, s.cycleLength)
  if (s.status === 'completed') return done === 0 ? s.cycleLength : done
  return done + 1
}

function idleIn(s: TimerState, mode: Mode): TimerState {
  return { ...s, mode, status: 'idle', endAt: null, reward: null, remainingMs: minutesToMs(s.durations[mode]) }
}

function complete(s: TimerState): TimerState {
  const isFocus = s.mode === 'focus'
  const minutes = s.durations[s.mode]
  const sessions = isFocus ? s.sessions + 1 : s.sessions
  const focusMinutes = isFocus ? s.focusMinutes + minutes : s.focusMinutes
  const points = isFocus ? s.points + Math.round(minutes * POINTS_PER_MINUTE) : s.points
  const progress = { sessions, focusMinutes }
  const unlocked = milestones.filter((m) => isMet(m, progress)).map((m) => m.id)
  const newlyUnlocked = unlocked.filter((id) => !s.unlocked.includes(id))
  return {
    ...s,
    status: 'completed',
    completions: s.completions + 1,
    remainingMs: 0,
    endAt: null,
    sessions,
    focusMinutes,
    points,
    unlocked,
    reward: {
      mode: s.mode,
      minutes,
      points: isFocus ? points - s.points : 0,
      message: isFocus
        ? rewardMessages[(sessions - 1) % rewardMessages.length]
        : 'Rest taken. Ready when you are.',
      unlocked: newlyUnlocked,
      nextMode: nextAfterComplete(s.mode, sessions, s.cycleLength),
    },
  }
}

export function timerReducer(s: TimerState, a: TimerAction): TimerState {
  switch (a.type) {
    case 'start':
      if (s.status !== 'idle') return s
      return { ...s, status: 'running', endAt: a.now + s.remainingMs }

    case 'pause':
      if (s.status !== 'running' || s.endAt === null) return s
      return { ...s, status: 'paused', endAt: null, remainingMs: Math.max(0, s.endAt - a.now) }

    case 'resume':
      if (s.status !== 'paused') return s
      return { ...s, status: 'running', endAt: a.now + s.remainingMs }

    case 'tick': {
      if (s.status !== 'running' || s.endAt === null) return s
      const remaining = s.endAt - a.now
      if (remaining <= 0) return complete(s)
      // Avoid re-rendering until the displayed second changes.
      if (Math.ceil(remaining / 1000) === Math.ceil(s.remainingMs / 1000)) return s
      return { ...s, remainingMs: remaining }
    }

    case 'reset':
      return idleIn(s, s.mode)

    case 'skip': {
      // Skipping never awards anything.
      const next: Mode = s.mode === 'focus' ? 'short' : 'focus'
      return idleIn(s, s.status === 'completed' && s.reward ? s.reward.nextMode : next)
    }

    case 'startNext': {
      if (s.status !== 'completed' || !s.reward) return s
      const mode = s.reward.nextMode
      const remainingMs = minutesToMs(s.durations[mode])
      return { ...s, mode, status: 'running', reward: null, remainingMs, endAt: a.now + remainingMs }
    }

    case 'setMode':
      if (s.status === 'running' || s.status === 'paused') return s
      return idleIn(s, a.mode)

    case 'setDuration': {
      if (s.status !== 'idle') return s
      const { min, max } = DURATION_LIMITS[a.mode]
      const minutes = Math.min(max, Math.max(min, Math.round(a.minutes)))
      const durations = { ...s.durations, [a.mode]: minutes }
      return {
        ...s,
        durations,
        remainingMs: a.mode === s.mode ? minutesToMs(minutes) : s.remainingMs,
      }
    }

    case 'resetProgress':
      // Clears the running session and all counters; keeps the user's duration / cycle settings.
      return { ...initialState(), durations: s.durations, cycleLength: s.cycleLength, remainingMs: minutesToMs(s.durations.focus) }

    case 'setCycleLength': {
      // Allowed at any time. It never touches the running timer: it only changes when the *next*
      // long break is scheduled. If a focus session has just finished, its suggested next mode is refreshed.
      const length = Math.min(CYCLE_LIMITS.max, Math.max(CYCLE_LIMITS.min, Math.round(a.length)))
      if (length === s.cycleLength) return s
      const reward =
        s.status === 'completed' && s.reward
          ? { ...s.reward, nextMode: nextAfterComplete(s.reward.mode, s.sessions, length) }
          : s.reward
      return { ...s, cycleLength: length, reward }
    }
  }
}
