import { motion, useReducedMotion } from 'framer-motion'
import type { Quote } from '../data/quotes'
import { safeImage, safeLink } from '../lib/safeUrl'

/**
 * Quote + attribution are a single keyed element, so they always fade together.
 * Fade only (no movement/blur) keeps it calm and layout-stable; reduced motion
 * swaps instantly.
 */
export function QuoteDisplay({ quote }: { quote: Quote }) {
  const reduce = useReducedMotion()
  const href = safeLink(quote.sourceUrl)
  const signature = safeImage(quote.signature)
  return (
    <motion.figure
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }}
      className="text-legible m-0 w-full max-w-xl px-1"
    >
      <blockquote className="m-0 text-balance font-quote text-[clamp(1.05rem,0.95rem+0.55vw,1.45rem)] leading-[1.4] text-white/90">
        <p className="m-0">“{quote.text}”</p>
      </blockquote>
      <figcaption className="mt-3 flex flex-col items-center gap-0.5">
        {signature ? (
          <img src={signature} alt={quote.author} className="h-8 w-auto opacity-90 invert" />
        ) : (
          <span className="font-display text-lg italic tracking-wide text-white/85">{quote.author}</span>
        )}
        {(quote.category || quote.source) && (
          <span className="quote-source max-w-sm text-[11px] leading-snug text-white/80 [text-shadow:0_0_10px_rgba(0,0,0,0.7),0_1px_2px_rgba(0,0,0,0.6)]">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {quote.source ?? quote.category}
              </a>
            ) : (
              (quote.source ?? quote.category)
            )}
          </span>
        )}
      </figcaption>
    </motion.figure>
  )
}
