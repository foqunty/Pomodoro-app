import { formatTime } from '../lib/format'
import { MODE_LABEL, type Mode, type Status } from '../lib/timerReducer'

export type Phase = 'idle' | 'active' | 'done'

const WATERMARK: Record<Mode, string> = { focus: 'Focus', short: 'Break', long: 'Rest' }
const STATUS_LABEL: Record<Status, string> = {
  idle: 'Ready',
  running: 'Running',
  paused: 'Paused',
  completed: 'Complete',
}

interface Props {
  mode: Mode
  status: Status
  phase: Phase
  remainingMs: number
  totalMs: number
  /** Position in the focus cycle (focus mode only). */
  slot: { n: number; of: number } | null
  awakeNote?: string | null
}

export function FocusTimer({ mode, status, phase, remainingMs, totalMs, slot, awakeNote }: Props) {
  const time = formatTime(remainingMs)
  const progress = status === 'completed' ? 1 : status === 'idle' ? 0 : 1 - remainingMs / totalMs
  const raised = phase !== 'idle'

  return (
    <section
      aria-label="Timer"
      // Always laid out at full size; "raising" is a compositor-only transform, so
      // nothing below it (the quote, the controls) is ever pushed around.
      className="scene-ease relative flex origin-top flex-col items-center transition-transform will-change-transform"
      style={{ transform: raised ? 'translateY(calc(var(--raise) * -1)) scale(0.8)' : 'none' }}
    >
      <p className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-muted-foreground">
        <span>{MODE_LABEL[mode]}</span>
        {slot && (
          <span className="tabular-nums text-white/60" aria-label={`session ${slot.n} of ${slot.of}`}>
            {slot.n}/{slot.of}
          </span>
        )}
        <span aria-hidden="true" className="h-px w-6 bg-white/30" />
        <span className="flex items-center gap-2 text-foreground">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'running' ? 'animate-pulse bg-foreground' : status === 'paused' ? 'bg-white/50' : 'bg-white/30'
            }`}
          />
          {STATUS_LABEL[status]}
        </span>
      </p>

      <div className="relative isolate timer-size leading-none">
        {/* Watermark: a faint outlined word that sits behind the digits only. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display uppercase text-transparent"
          style={{ fontSize: '1.3em', letterSpacing: '0.04em', WebkitTextStroke: '1px rgba(255,255,255,0.07)' }}
        >
          {WATERMARK[mode]}
        </span>
        <div role="timer" aria-label={`${time} remaining`} className="text-legible font-display text-foreground">
          {time.split('').map((c, i) => (
            <span key={i} className={`inline-block text-center ${c === ':' ? 'w-[0.28em]' : 'w-[0.5em]'}`}>
              {c}
            </span>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="mt-4 h-px w-40 overflow-hidden bg-white/15 sm:w-52">
        <div
          className="h-full origin-left bg-foreground transition-transform duration-1000 ease-linear"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {awakeNote && (
        <p className="pointer-events-none absolute left-1/2 top-full m-0 mt-1 w-max max-w-[90vw] -translate-x-1/2 text-[11px] text-white/60">{awakeNote}</p>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {MODE_LABEL[mode]} session {STATUS_LABEL[status].toLowerCase()}
      </p>
    </section>
  )
}
