import { cn } from '@/lib/utils'

interface ScientificNameProps {
  children: React.ReactNode
  className?: string
  lang?: string
}

export function ScientificName({ children, className, lang = 'la' }: ScientificNameProps) {
  return (
    <span lang={lang} className={cn('font-heading italic', className)}>
      {children}
    </span>
  )
}
