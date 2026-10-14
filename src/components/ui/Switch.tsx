interface Props {
  checked: boolean
  onChange: () => void
  label: string
  hint?: string
}

/** Accessible on/off switch (≥44px tall hit area). */
export function Switch({ checked, onChange, label, hint }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl text-left"
    >
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        {hint && <span className="block text-[11px] text-white/65">{hint}</span>}
      </span>
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-white' : 'bg-white/25'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform duration-200 ${
            checked ? 'translate-x-[22px] bg-primary-foreground' : 'translate-x-0.5 bg-white'
          }`}
        />
      </span>
    </button>
  )
}
