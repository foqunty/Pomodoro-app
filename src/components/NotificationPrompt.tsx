import { Bell } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from './ui/Button'

interface Props {
  open: boolean
  onEnable: () => void
  onDecline: () => void
}

/**
 * First-visit consent dialog (native <dialog>: focus trap, Esc, correct semantics for free). It is only
 * an explanation; the browser's own permission prompt appears only if the user presses "Enable
 * notifications". Esc / "Not now" are a decision (off) — silence is never treated as consent.
 */
export function NotificationPrompt({ open, onEnable, onDecline }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d || !open) return
    // Wait a moment so it doesn't land on top of the first paint.
    const id = window.setTimeout(() => {
      if (!d.open) d.showModal()
    }, 1200)
    return () => {
      window.clearTimeout(id)
      if (d.open) d.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="notif-title"
      aria-describedby="notif-desc"
      onCancel={(e) => {
        e.preventDefault()
        onDecline()
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl border-0 bg-[hsl(201_100%_8%/0.92)] p-6 text-left text-foreground backdrop-blur-xl open:animate-fade-rise"
    >
      <Bell size={22} aria-hidden="true" className="mb-3 text-white/80" />
      <h2 id="notif-title" className="m-0 font-display text-3xl">
        Know when a session ends?
      </h2>
      <p id="notif-desc" className="mb-5 mt-2 text-sm leading-relaxed text-white/80">
        STILL / FOCUS can send a short notification when a focus session or break finishes. Your browser will ask for
        permission only if you choose to enable this, and you can turn it off at any time in Settings. Nothing is sent
        to any server.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onDecline}>Not now</Button>
        <Button variant="primary" onClick={onEnable}>
          Enable notifications
        </Button>
      </div>
    </dialog>
  )
}
