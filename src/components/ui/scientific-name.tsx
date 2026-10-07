import { cn } from '@/lib/utils'

interface ScientificNameProps {
  children: React.ReactNode
  className?: string
}

export function ScientificName({ children, className }: ScientificNameProps) {
  return (
    <span className={cn('font-heading italic', className)}>
      {children}
    </span>
  )
}
