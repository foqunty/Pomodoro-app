import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'glass'
type Size = 'md' | 'lg' | 'icon'

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-body text-sm font-medium transition-[transform,opacity,background-color] duration-200 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 motion-safe:hover:scale-[1.03]'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-white/90',
  glass: 'liquid-glass bg-black/25 text-foreground hover:bg-white/15',
}
const sizes: Record<Size, string> = {
  md: 'h-11 px-5',
  lg: 'h-14 min-w-44 px-10 text-base',
  icon: 'h-11 w-11',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'glass', size = 'md', className = '', type = 'button', ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />
})
