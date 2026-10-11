interface EmptyStateProps {
  /** "No scenes yet." */
  message: string
  /** Shown only to people who can add the first one, e.g. "Use New scene to add the first one." */
  hint?: string | null
}

/** The one empty-list treatment used across the app. */
export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="rounded-xl border bg-card px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}
