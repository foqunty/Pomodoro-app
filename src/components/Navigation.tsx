import { SlidersHorizontal, WifiOff } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { MusicSource, MusicState } from '../hooks/useSound'
import type { WakeLockState } from '../hooks/useWakeLock'
import type { PermissionState } from '../lib/notify'
import type { NotificationPref } from '../lib/storage'
import { completedInCycle } from '../lib/timerReducer'
import { Button } from './ui/Button'
import { FullscreenToggle } from './FullscreenToggle'
import { SettingsPanel } from './SettingsPanel'
import { SoundToggle } from './SoundToggle'

interface Props {
  sessions: number
  focusMinutes: number
  cycleLength: number
  music: MusicState
  uiSounds: boolean
  completionSound: boolean
  onCycleLength: (n: number) => void
  onToggleMusic: () => void
  onSelectSource: (s: MusicSource) => void
  onVolume: (v: number) => void
  onToggleUi: () => void
  onToggleCompletion: () => void
  online: boolean
  awake: { enabled: boolean; state: WakeLockState; onToggle: () => void }
  alerts: { pref: NotificationPref; permission: PermissionState; onToggle: () => void }
  onResetProgress: () => void
}

export function Navigation(p: Props) {
  const { sessions, focusMinutes, cycleLength } = p
  // A finished cycle stays fully lit until the next session begins (matches the previous behaviour).
  const inCycle = completedInCycle(sessions, cycleLength)
  const done = sessions > 0 && inCycle === 0 ? cycleLength : inCycle
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)

  // Close on Escape (returning focus to the trigger) or on a press outside the panel and nav bar
  // (so the sound toggle can be used while the panel is open).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (!panelRef.current?.contains(t) && !navRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <header className="relative z-20 px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:pt-6">
      <nav
        ref={navRef}
        aria-label="Primary"
        className="liquid-glass animate-fade-rise mx-auto flex max-w-[1280px] items-center justify-between gap-2 rounded-full py-2 pl-2 pr-2 sm:pl-2"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <FullscreenToggle />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div
            className="hidden items-center gap-2.5 text-xs text-white/75 md:flex"
            role="status"
            aria-label={`${sessions} focus sessions completed, ${focusMinutes} minutes focused, ${done} of ${cycleLength} in this cycle`}
          >
            {cycleLength <= 8 ? (
              <span className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: cycleLength }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                      i < done ? 'bg-foreground' : 'bg-white/25'
                    }`}
                  />
                ))}
              </span>
            ) : (
              <span className="tabular-nums" aria-hidden="true">
                {done}/{cycleLength}
              </span>
            )}
            <span className="tabular-nums">
              {sessions} {sessions === 1 ? 'session' : 'sessions'} · {focusMinutes} min
            </span>
          </div>

          <Button
            ref={triggerRef}
            size="icon"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-haspopup="dialog"
            aria-label="Settings: focus cycle and sound"
            title="Cycle & sound"
            className={`relative shrink-0 ${open ? '!bg-white/20' : ''}`}
          >
            <SlidersHorizontal size={18} />
            {p.music.on && (
              <span aria-hidden="true" className="absolute right-2.5 top-2.5 h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
            )}
          </Button>
          <SoundToggle enabled={p.music.on} onToggle={p.onToggleMusic} />
        </div>
      </nav>

      {!p.online && (
        <p role="status" className="m-0 mt-2 flex items-center justify-center gap-2 text-center text-[11px] text-white/80">
          <WifiOff size={13} aria-hidden="true" /> Offline — the timer works; YouTube music needs a connection.
        </p>
      )}

      {/* Outside the <nav> so the glass surface's overflow:hidden cannot clip it. */}
      {open && (
        <SettingsPanel
          ref={panelRef}
          id={panelId}
          cycleLength={cycleLength}
          completedInCycle={done}
          music={p.music}
          uiSounds={p.uiSounds}
          completionSound={p.completionSound}
          onCycleLength={p.onCycleLength}
          onToggleMusic={p.onToggleMusic}
          onSelectSource={p.onSelectSource}
          onVolume={p.onVolume}
          onToggleUi={p.onToggleUi}
          onToggleCompletion={p.onToggleCompletion}
          awake={p.awake}
          alerts={p.alerts}
          onResetProgress={p.onResetProgress}
        />
      )}
    </header>
  )
}
