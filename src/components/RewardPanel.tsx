import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { isMet, milestones } from '../data/milestones'
import { MODE_LABEL, type Reward } from '../lib/timerReducer'

interface Props {
  reward: Reward
  sessions: number
  focusMinutes: number
  points: number
  cycleLength: number
}

const draw = (delay: number) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 0.7, delay, ease: [0.65, 0, 0.35, 1] as const },
})

export function RewardPanel({ reward, sessions, focusMinutes, points, cycleLength }: Props) {
  const isFocus = reward.mode === 'focus'
  const progress = { sessions, focusMinutes }
  const next = milestones.find((m) => !isMet(m, progress))
  const measure = next?.measure(progress)

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-legible flex w-full max-w-md flex-col items-center gap-5"
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <motion.circle cx="32" cy="32" r="29" stroke="white" strokeWidth="1.5" {...draw(0)} />
        <motion.path d="M20 33l8 8 16-17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...draw(0.45)} />
      </svg>

      <div>
        <h2 className="m-0 font-display text-4xl sm:text-5xl">{reward.message}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {MODE_LABEL[reward.mode]} complete · {reward.minutes} min
          {isFocus && <span className="text-foreground"> · +{reward.points} focus points</span>}
        </p>
        {isFocus && (
          <p className="mt-1 text-xs text-white/75">
            {reward.nextMode === 'long'
              ? `Cycle complete (${cycleLength} of ${cycleLength}): a long break is next.`
              : `${sessions % cycleLength} of ${cycleLength} focus sessions in this cycle.`}
          </p>
        )}
      </div>

      {reward.unlocked.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
          {reward.unlocked.map((id) => (
            <li key={id} className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <Sparkles size={14} aria-hidden="true" />
              Milestone: {milestones.find((m) => m.id === id)?.label}
            </li>
          ))}
        </ul>
      )}

      <dl className="m-0 grid w-full grid-cols-3 gap-2 text-center">
        {[
          ['Sessions', sessions],
          ['Focus min', focusMinutes],
          ['Points', points],
        ].map(([label, value]) => (
          <div key={label} className="liquid-glass rounded-2xl bg-black/25 px-2 py-3">
            <dd className="m-0 font-display text-3xl tabular-nums">{value}</dd>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="w-full text-left text-xs text-white/80">
        {next && measure ? (
          <>
            <div className="mb-2 flex justify-between">
              <span>Next: {next.label}</span>
              <span className="tabular-nums">
                {Math.min(measure.value, measure.target)} / {measure.target} {next.unit}
              </span>
            </div>
            <div
              className="h-1 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-label={`Progress toward ${next.label}`}
              aria-valuemin={0}
              aria-valuemax={measure.target}
              aria-valuenow={Math.min(measure.value, measure.target)}
            >
              <motion.div
                className="h-full origin-left rounded-full bg-foreground"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.min(1, measure.value / measure.target) }}
                transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </>
        ) : (
          <p className="m-0 text-center">Every milestone reached. Keep going, quietly.</p>
        )}
      </div>
    </motion.div>
  )
}
