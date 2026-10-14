import { Volume2, VolumeX } from 'lucide-react'
import { Button } from './ui/Button'

/** Quick on/off for background music only (UI and completion sounds have their own switches). */
export function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <Button
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn background music off' : 'Turn background music on'}
      title={enabled ? 'Music on' : 'Music off'}
      className={`max-sm:w-11 max-sm:px-0 sm:px-4 ${enabled ? '!bg-white/20' : ''}`}
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-white/60" />}
      <span className="hidden text-xs sm:inline" aria-hidden="true">
        {enabled ? 'Music on' : 'Music off'}
      </span>
    </Button>
  )
}
