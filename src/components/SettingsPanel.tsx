import { Minus, Plus } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { LOCAL_TRACK } from '../config/music'
import { AMBIENT_SOUNDS } from '../lib/ambient'
import type { MusicSource, MusicState } from '../hooks/useSound'
import type { WakeLockState } from '../hooks/useWakeLock'
import type { PermissionState } from '../lib/notify'
import type { NotificationPref } from '../lib/storage'
import { CYCLE_LIMITS } from '../lib/timerReducer'
import { Button } from './ui/Button'
import { Switch } from './ui/Switch'

interface Props {
  id: string
  cycleLength: number
  completedInCycle: number
  music: MusicState
  uiSounds: boolean
  completionSound: boolean
  onCycleLength: (n: number) => void
  onToggleMusic: () => void
  onSelectSource: (s: MusicSource) => void
  onVolume: (v: number) => void
  onToggleUi: () => void
  onToggleCompletion: () => void
  awake: { enabled: boolean; state: WakeLockState; onToggle: () => void }
  alerts: { pref: NotificationPref; permission: PermissionState; onToggle: () => void }
  onResetProgress: () => void
}

const SOURCES: { id: MusicSource; label: string; hint: string }[] = [
  { id: 'youtube', label: 'Reference mix', hint: 'YouTube player' },
  ...AMBIENT_SOUNDS.map((a) => ({ id: a.id as MusicSource, label: a.label, hint: a.id === 'rain' ? 'Synthesised' : 'Generated' })),
  ...(LOCAL_TRACK ? [{ id: 'local' as MusicSource, label: LOCAL_TRACK.title, hint: 'Local file' }] : []),
]

/** Non-modal popover: session-cycle length and the three independent sound settings. */
export const SettingsPanel = forwardRef<HTMLDivElement, Props>(function SettingsPanel(p, ref) {
  const { cycleLength, completedInCycle, music, uiSounds, completionSound, awake, alerts } = p
  const [confirmReset, setConfirmReset] = useState(false)
  const awakeHint = !awake.enabled
    ? 'Off'
    : awake.state === 'unsupported'
      ? 'Not supported by this browser'
      : awake.state === 'failed'
        ? 'The browser declined (battery saver?). The screen may dim.'
        : awake.state === 'held'
          ? 'Screen is being kept on'
          : 'Screen stays on while a session runs'
  const alertsOn = alerts.pref === 'on'
  const alertsHint =
    alerts.permission === 'unsupported'
      ? 'Not supported by this browser'
      : alerts.permission === 'denied'
        ? 'Blocked in your browser’s site settings — allow it there to use this'
        : alertsOn && alerts.permission === 'granted'
          ? 'On — you’ll be notified when a session ends (while the page is open)'
          : alertsOn
            ? 'Waiting for browser permission'
            : 'Off'

  return (
    <div
      ref={ref}
      id={p.id}
      role="dialog"
      aria-label="Session cycle and sound settings"
      className="liquid-glass absolute right-[max(1rem,env(safe-area-inset-right))] top-full z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-[hsl(201_100%_7%/0.82)] text-left backdrop-blur-xl md:right-6"
    >
      <div className="panel-scroll max-h-[calc(100vh-6.5rem)] overflow-y-auto p-5" style={{ maxHeight: 'calc(100dvh - 6.5rem)' }}>
      <section aria-labelledby={`${p.id}-cycle`}>
        <h2 id={`${p.id}-cycle`} className="m-0 font-display text-2xl">
          Focus cycle
        </h2>
        <p className="mb-3 mt-1 text-xs text-white/70">Focus sessions before each long break.</p>
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            aria-label="Fewer focus sessions per cycle"
            onClick={() => p.onCycleLength(cycleLength - 1)}
            disabled={cycleLength <= CYCLE_LIMITS.min}
          >
            <Minus size={16} />
          </Button>
          <output aria-label="Focus sessions per cycle" className="min-w-24 text-center text-sm tabular-nums">
            {cycleLength} {cycleLength === 1 ? 'session' : 'sessions'}
          </output>
          <Button
            size="icon"
            aria-label="More focus sessions per cycle"
            onClick={() => p.onCycleLength(cycleLength + 1)}
            disabled={cycleLength >= CYCLE_LIMITS.max}
          >
            <Plus size={16} />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: cycleLength }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i < completedInCycle ? 'bg-foreground' : 'bg-white/25'}`} />
          ))}
        </div>
        <p className="mb-0 mt-2 text-xs text-white/70" role="status">
          {completedInCycle} of {cycleLength} completed in this cycle. Changing this never interrupts a running timer.
        </p>
      </section>

      <hr className="my-5 border-0 border-t border-white/15" />

      <section aria-labelledby={`${p.id}-sound`}>
        <h2 id={`${p.id}-sound`} className="m-0 font-display text-2xl">
          Sound
        </h2>
        <p className="mb-2 mt-1 text-xs text-white/70">Three independent settings. All start switched off.</p>

        <Switch
          checked={music.on}
          onChange={p.onToggleMusic}
          label="Background music"
          hint={music.source === 'youtube' ? 'Plays in the player shown on screen' : 'Plays quietly in the background'}
        />
        <div role="radiogroup" aria-label="Music source" className="mb-2 mt-1 flex flex-col gap-1">
          {SOURCES.map((s) => {
            const selected = s.id === music.source
            return (
              <button
                key={s.id}
                role="radio"
                aria-checked={selected}
                onClick={() => p.onSelectSource(s.id)}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-2xl px-4 py-2 text-left text-sm transition-colors ${
                  selected ? 'bg-white/15 text-foreground' : 'text-white/75 hover:bg-white/10'
                }`}
              >
                <span>{s.label}</span>
                <span className="text-[11px] text-white/60">{s.hint}</span>
              </button>
            )
          })}
        </div>
        <label className="flex min-h-11 items-center gap-3 text-xs text-white/75">
          <span className="w-12 shrink-0">Volume</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={music.volume}
            onChange={(e) => p.onVolume(Number(e.target.value))}
            aria-label="Music volume"
            aria-valuetext={`${music.volume} percent`}
            className="h-11 min-w-0 flex-1 cursor-pointer accent-white"
          />
          <output className="w-9 text-right tabular-nums" aria-hidden="true">
            {music.volume}
          </output>
        </label>
        <p className="mb-1 mt-0 text-[11px] leading-snug text-white/65" role="status" aria-live="polite">
          {music.error ??
            (music.source === 'youtube'
              ? 'Plays through YouTube’s own player, which can include ads and needs a connection. On iPhone and iPad, volume follows the device buttons.'
              : music.on
                ? 'Playing.'
                : 'Off.')}
        </p>

        <hr className="my-3 border-0 border-t border-white/10" />
        <Switch checked={uiSounds} onChange={p.onToggleUi} label="Interface sounds" hint="Soft clicks on buttons" />
        <Switch checked={completionSound} onChange={p.onToggleCompletion} label="Session-complete chime" hint="When a focus session or break ends" />
      </section>

      <hr className="my-5 border-0 border-t border-white/15" />

      <section aria-labelledby={`${p.id}-device`}>
        <h2 id={`${p.id}-device`} className="m-0 font-display text-2xl">
          Screen &amp; alerts
        </h2>
        <div className="mt-2">
          <Switch checked={awake.enabled} onChange={awake.onToggle} label="Keep screen awake" hint={awakeHint} />
          <Switch checked={alertsOn} onChange={alerts.onToggle} label="Session notifications" hint={alertsHint} />
        </div>
      </section>

      <hr className="my-5 border-0 border-t border-white/15" />

      <section aria-labelledby={`${p.id}-data`}>
        <h2 id={`${p.id}-data`} className="m-0 font-display text-2xl">
          Saved data
        </h2>
        <p className="mb-3 mt-1 text-xs text-white/70">
          Your session, counters and preferences are kept on this device only, so a refresh doesn’t lose them.
        </p>
        <Button
          onClick={() => {
            if (confirmReset) {
              p.onResetProgress()
              setConfirmReset(false)
            } else setConfirmReset(true)
          }}
          onBlur={() => setConfirmReset(false)}
          className="w-full"
        >
          {confirmReset ? 'Press again to erase progress' : 'Reset all progress'}
        </Button>
      </section>
      </div>
    </div>
  )
})
