import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { renderInline } from '@/lib/personal-record'

export const FIELD_LABEL_CLASS = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'

/** A field with nothing recorded. Shown as a dash so the gap stays visible. */
export function Blank() {
  return (
    <span className="text-muted-foreground/50">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not recorded</span>
    </span>
  )
}

interface RecordFieldProps {
  label: string
  /** Record text, may contain <i> tags; null when not yet recorded. */
  value?: string | null
  /** Smaller, quieter text: notes, sources and open questions. */
  small?: boolean
  /** Rendered instead of `value` when given. */
  children?: ReactNode
}

/** One labelled field of a record. Label above on a phone, beside from 640px and in print. */
export function RecordField({ label, value = null, small = false, children }: RecordFieldProps) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[8.5rem_1fr] print:grid-cols-[8.5rem_1fr]">
      <dt className={cn(FIELD_LABEL_CLASS, 'sm:pt-0.5')}>{label}</dt>
      <dd className={cn('min-w-0 break-words', small && 'text-muted-foreground')}>
        {children ?? (value === null || value === '' ? <Blank /> : renderInline(value))}
      </dd>
    </div>
  )
}

/** A group of fields, ruled off from the next. */
export function FieldGroup({ children, last = false }: { children: ReactNode; last?: boolean }) {
  return (
    <dl className={cn('grid gap-3 py-4 print:gap-2 print:py-2.5', !last && 'border-b border-border')}>
      {children}
    </dl>
  )
}
