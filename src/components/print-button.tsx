'use client'

import { cn } from '@/lib/utils'

interface PrintButtonProps {
  className?: string
  label?: string
}

export function PrintButton({ className, label = 'Print / save as PDF' }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn('text-sm underline underline-offset-2 hover:text-foreground text-muted-foreground', className)}
    >
      {label}
    </button>
  )
}
