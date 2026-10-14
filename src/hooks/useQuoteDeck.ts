import { useEffect, useRef, useState } from 'react'
import { quotes, type Quote } from '../data/quotes'

export const QUOTE_ROTATION_MS = 30_000

/** Random order of quote indices; the first entry never equals `avoidFirst`. */
function shuffled(n: number, avoidFirst = -1) {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (n > 1 && a[0] === avoidFirst) [a[0], a[1]] = [a[1], a[0]]
  return a
}

interface Deck {
  order: number[]
  pos: number
}

const nextDeck = (d: Deck): Deck =>
  d.pos + 1 < d.order.length ? { order: d.order, pos: d.pos + 1 } : { order: shuffled(quotes.length, d.order[d.pos]), pos: 0 }

/**
 * Rotates automatically every 30 s through a shuffled deck: every quote is shown once before any
 * repeats, and a new deck never starts on the quote just shown. Independent of the timer and audio.
 * Ticks are skipped while the tab is hidden; on return, a quote that is already overdue rotates at once.
 * Handles 0 or 1 quotes without creating a timer.
 */
export function useQuoteDeck(): Quote | null {
  const [deck, setDeck] = useState<Deck>(() => ({ order: shuffled(quotes.length), pos: 0 }))
  const lastChange = useRef(Date.now())

  useEffect(() => {
    if (quotes.length < 2) return
    const advance = () => {
      lastChange.current = Date.now()
      setDeck(nextDeck)
    }
    const id = window.setInterval(() => {
      if (!document.hidden) advance()
    }, QUOTE_ROTATION_MS)
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastChange.current >= QUOTE_ROTATION_MS) advance()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return quotes.length ? quotes[deck.order[deck.pos]] : null
}
