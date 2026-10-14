import { Maximize2, Minimize2 } from 'lucide-react'
import { useFullscreen } from '../hooks/useFullscreen'
import { Button } from './ui/Button'

/** Renders nothing where the browser has no element fullscreen (e.g. iPhone Safari). */
export function FullscreenToggle() {
  const { supported, active, toggle } = useFullscreen()
  if (!supported) return null
  return (
    <Button
      size="icon"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? 'Exit full screen' : 'Enter full screen'}
      title={active ? 'Exit full screen (Esc)' : 'Full screen'}
      className={`shrink-0 ${active ? '!bg-white/20' : ''}`}
    >
      {active ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
    </Button>
  )
}
