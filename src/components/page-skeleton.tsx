import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Shown the moment a link is tapped, while the next page loads, so a tap
 * always gets an instant response.
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-8 w-2/3 max-w-xs" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}
