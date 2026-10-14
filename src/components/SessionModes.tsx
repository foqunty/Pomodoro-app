import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { DURATION_LIMITS, MODE_LABEL, type Durations, type Mode } from '../lib/timerReducer'
import { Button } from './ui/Button'

const MODES: Mode[] = ['focus', 'short', 'long']

interface Props {
  mode: Mode
  durations: Durations
  /** Hidden (but still occupying its space) while a session is running, paused or completed. */
  collapsed: boolean
  onMode: (m: Mode) => void
  onDuration: (m: Mode, minutes: number) => void
}

export function SessionModes({ mode, durations, collapsed, onMode, onDuration }: Props) {
  const { min, max } = DURATION_LIMITS[mode]
  const minutes = durations[mode]

  // The row keeps a fixed height so nothing below it moves when it fades out.
  return (
    <div
      inert={collapsed}
      className={`sel-row scene-ease flex h-[var(--sel-h)] w-full flex-col items-center px-1 py-1 transition-opacity ${
        collapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div role="radiogroup" aria-label="Session mode" className="liquid-glass relative flex max-w-full rounded-full p-1">
        {MODES.map((m) => {
          const selected = m === mode
          return (
            <button
              key={m}
              role="radio"
              aria-checked={selected}
              onClick={() => onMode(m)}
              className={`relative z-10 h-11 rounded-full px-3 text-sm transition-colors duration-300 focus-visible:outline-offset-[-2px] min-[400px]:px-4 sm:px-5 ${
                selected ? 'text-foreground' : 'text-white/70 hover:text-foreground'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white/15"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {MODE_LABEL[m]}
            </button>
          )
        })}
      </div>

      <div className="sel-stepper mt-4 flex items-center justify-center gap-3">
        <Button
          size="icon"
          aria-label={`Decrease ${MODE_LABEL[mode].toLowerCase()} duration`}
          onClick={() => onDuration(mode, minutes - 1)}
          disabled={minutes <= min}
        >
          <Minus size={16} />
        </Button>
        <output aria-label={`${MODE_LABEL[mode]} duration`} className="min-w-20 text-center text-sm tabular-nums">
          {minutes} min
        </output>
        <Button
          size="icon"
          aria-label={`Increase ${MODE_LABEL[mode].toLowerCase()} duration`}
          onClick={() => onDuration(mode, minutes + 1)}
          disabled={minutes >= max}
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  )
}
