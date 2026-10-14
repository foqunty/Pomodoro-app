import { LOCAL_TRACK } from '../config/music'
import { milestones } from '../data/milestones'
import {
  CYCLE_LIMITS,
  DURATION_LIMITS,
  initialState,
  timerReducer,
  type Durations,
  type Mode,
  type Reward,
  type Status,
  type TimerState,
} from './timerReducer'

/**
 * Local persistence (localStorage only; nothing leaves the device and no secrets are stored).
 * Everything read back is untrusted: it is validated field-by-field and anything malformed,
 * out of range or inconsistent falls back to safe defaults. Storage can also be unavailable
 * (private mode, quota, disabled) — every call is guarded and the app then just runs in memory.
 */
const KEY = 'still-focus:v1'
const MAX_BYTES = 20_000
const MODES: Mode[] = ['focus', 'short', 'long']
const STATUSES: Status[] = ['idle', 'running', 'paused', 'completed']
const MAX_COUNT = 10_000_000

export type MusicSourcePref = 'youtube' | 'brown' | 'soft' | 'rain' | 'local'
export type NotificationPref = 'unset' | 'on' | 'off'

export interface Prefs {
  uiSounds: boolean
  completionSound: boolean
  musicSource: MusicSourcePref
  musicVolume: number
  notifications: NotificationPref
  keepAwake: boolean
}

export const DEFAULT_PREFS: Prefs = {
  uiSounds: false,
  completionSound: false,
  musicSource: 'youtube',
  musicVolume: 30,
  notifications: 'unset',
  keepAwake: true,
}

type Json = Record<string, unknown>
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max

function readAll(): Json {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw || raw.length > MAX_BYTES) return {}
    const parsed: unknown = JSON.parse(raw) // JSON.parse only — stored strings are never evaluated
    return isObj(parsed) && parsed.v === 1 ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(next: Json) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...next, v: 1 }))
  } catch {
    /* storage unavailable or full: continue in memory */
  }
}

// ---------------------------------------------------------------- preferences

export function loadPrefs(): Prefs {
  const raw = readAll().prefs
  const p = isObj(raw) ? raw : {}
  const sources: MusicSourcePref[] = ['youtube', 'brown', 'soft', 'rain', ...(LOCAL_TRACK ? (['local'] as const) : [])]
  return {
    uiSounds: p.uiSounds === true,
    completionSound: p.completionSound === true,
    musicSource: sources.includes(p.musicSource as MusicSourcePref) ? (p.musicSource as MusicSourcePref) : DEFAULT_PREFS.musicSource,
    musicVolume: isInt(p.musicVolume, 0, 100) ? p.musicVolume : DEFAULT_PREFS.musicVolume,
    notifications: p.notifications === 'on' || p.notifications === 'off' ? p.notifications : 'unset',
    keepAwake: typeof p.keepAwake === 'boolean' ? p.keepAwake : DEFAULT_PREFS.keepAwake,
  }
}

export function savePrefs(patch: Partial<Prefs>) {
  const all = readAll()
  writeAll({ ...all, prefs: { ...loadPrefs(), ...patch } })
}

// ---------------------------------------------------------------- timer state

function parseReward(raw: unknown): Reward | null {
  if (!isObj(raw)) return null
  const { mode, nextMode, minutes, points, message, unlocked } = raw
  if (!MODES.includes(mode as Mode) || !MODES.includes(nextMode as Mode)) return null
  if (!isInt(minutes, 0, 1000) || !isInt(points, 0, MAX_COUNT)) return null
  if (typeof message !== 'string' || message.length > 120) return null
  const known = new Set(milestones.map((m) => m.id))
  const ids = Array.isArray(unlocked) ? unlocked.filter((u): u is string => typeof u === 'string' && known.has(u)) : []
  return { mode: mode as Mode, nextMode: nextMode as Mode, minutes, points, message, unlocked: ids }
}

/**
 * Rebuilds the timer from storage using wall-clock time, never assuming JavaScript kept running:
 *  - running  → remaining = endAt − now. If the deadline passed while the page was closed or the
 *               device asleep, the session is completed (and counted) exactly once on restore.
 *  - paused   → stays paused with its remaining time.
 *  - completed→ restores the reward screen.
 * Implausible values (e.g. a deadline further away than the session length, from a clock change or
 * tampering) fall back to an idle timer rather than trusting the data.
 */
export function loadTimerState(now: number): TimerState {
  const raw = readAll().timer
  if (!isObj(raw)) return initialState()
  const d = raw.durations
  if (!isObj(d)) return initialState()
  const durations: Durations = { focus: 0, short: 0, long: 0 }
  for (const m of MODES) {
    const v = d[m]
    if (!isInt(v, DURATION_LIMITS[m].min, DURATION_LIMITS[m].max)) return initialState()
    durations[m] = v
  }
  const base = initialState()
  const mode = MODES.includes(raw.mode as Mode) ? (raw.mode as Mode) : 'focus'
  const known = new Set(milestones.map((m) => m.id))
  const s: TimerState = {
    ...base,
    mode,
    durations,
    cycleLength: isInt(raw.cycleLength, CYCLE_LIMITS.min, CYCLE_LIMITS.max) ? raw.cycleLength : base.cycleLength,
    sessions: isInt(raw.sessions, 0, MAX_COUNT) ? raw.sessions : 0,
    focusMinutes: isInt(raw.focusMinutes, 0, MAX_COUNT) ? raw.focusMinutes : 0,
    points: isInt(raw.points, 0, MAX_COUNT) ? raw.points : 0,
    completions: isInt(raw.completions, 0, MAX_COUNT) ? raw.completions : 0,
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked.filter((u): u is string => typeof u === 'string' && known.has(u)) : [],
    remainingMs: durations[mode] * 60_000,
  }
  const full = durations[mode] * 60_000
  const status = STATUSES.includes(raw.status as Status) ? (raw.status as Status) : 'idle'

  if (status === 'paused' && isNum(raw.remainingMs, 1, full)) return { ...s, status: 'paused', remainingMs: raw.remainingMs }
  if (status === 'running' && isNum(raw.endAt, 1, 1e15)) {
    const remaining = raw.endAt - now
    if (remaining > full + 60_000) return s // implausible deadline
    // endAt in the past completes the session here, awarding it once.
    return timerReducer({ ...s, status: 'running', endAt: raw.endAt, remainingMs: Math.max(1, remaining) }, { type: 'tick', now })
  }
  if (status === 'completed') {
    const reward = parseReward(raw.reward)
    if (reward && reward.mode === mode) return { ...s, status: 'completed', remainingMs: 0, reward }
  }
  return s
}

export function saveTimerState(s: TimerState) {
  const timer = {
    mode: s.mode,
    durations: s.durations,
    cycleLength: s.cycleLength,
    status: s.status,
    remainingMs: s.remainingMs,
    endAt: s.endAt,
    sessions: s.sessions,
    focusMinutes: s.focusMinutes,
    points: s.points,
    completions: s.completions,
    unlocked: s.unlocked,
    reward: s.reward,
  }
  writeAll({ ...readAll(), timer })
}

/** Wipes everything this app stored. */
export function clearAllStoredData() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
