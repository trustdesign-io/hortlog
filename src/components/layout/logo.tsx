import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Shared default brand name — imported by footer.tsx. Replace per project. */
export const DEFAULT_BRAND_NAME = 'YourBrand'

interface LogoProps {
  className?: string
  href?: string
  /** Text label shown next to the mark. Defaults to "YourBrand" — replace per project. */
  name?: string
}

/** Placeholder logo — replace the SVG mark and name per project. */
export function Logo({ className, href = '/', name = DEFAULT_BRAND_NAME }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity duration-200', className)}
    >
      {/* Replace this SVG with your project logo mark */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="6" className="fill-primary" />
        <path
          d="M8 14 L14 8 L20 14 L14 20 Z"
          className="fill-primary-foreground"
        />
      </svg>
      <span className="text-sm tracking-tight">{name}</span>
    </Link>
  )
}
