import { ArrowRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Status } from '../lib/timerReducer'
import { Button } from './ui/Button'

interface Props {
  status: Status
  /** Label of the mode that follows a completed session, e.g. "short break". */
  nextLabel: string | null
  onPrimary: () => void
  onReset: () => void
  onSkip: () => void
}

function Secondary({ icon, label, ...rest }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button aria-label={label} title={label} className="max-sm:w-11 max-sm:px-0 sm:px-5" {...rest}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

export function TimerControls({ status, nextLabel, onPrimary, onReset, onSkip }: Props) {
  const primary = {
    idle: { icon: <Play size={18} fill="currentColor" />, label: 'Start' },
    running: { icon: <Pause size={18} fill="currentColor" />, label: 'Pause' },
    paused: { icon: <Play size={18} fill="currentColor" />, label: 'Resume' },
    completed: { icon: <ArrowRight size={18} />, label: `Start ${nextLabel ?? 'next'}` },
  }[status]

  return (
    <div className="controls-col flex flex-col items-center gap-4" role="group" aria-label="Timer controls">
      <Button variant="primary" size="lg" onClick={onPrimary}>
        {primary.icon}
        {primary.label}
      </Button>
      <div className="flex items-center gap-2">
        <Secondary icon={<RotateCcw size={16} />} label="Reset" onClick={onReset} disabled={status === 'idle'} />
        <Secondary icon={<SkipForward size={16} />} label="Skip" onClick={onSkip} />
      </div>
    </div>
  )
}
