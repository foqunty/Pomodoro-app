export interface Progress {
  sessions: number
  focusMinutes: number
}

export interface Milestone {
  id: string
  label: string
  /** Current / target values, used for the progress bar. */
  measure: (p: Progress) => { value: number; target: number }
  unit: string
}

export const milestones: Milestone[] = [
  { id: 'first', label: 'First session', unit: 'session', measure: (p) => ({ value: p.sessions, target: 1 }) },
  { id: 'three', label: 'Three sessions', unit: 'sessions', measure: (p) => ({ value: p.sessions, target: 3 }) },
  { id: 'hundred', label: '100 focus minutes', unit: 'minutes', measure: (p) => ({ value: p.focusMinutes, target: 100 }) },
]

export const isMet = (m: Milestone, p: Progress) => {
  const { value, target } = m.measure(p)
  return value >= target
}

export const rewardMessages = [
  'One more promise kept.',
  'Quietly done. Beautifully done.',
  'You showed up. That is the whole art.',
  'Attention, spent well.',
]
