import Link from 'next/link'
import { Tag } from 'lucide-react'
import { openLabelIssue } from '@/lib/label-report-db'

/** For members: the plant has a label reported and not yet fixed */
export async function LabelIssueBadge({ orgSlug, specimenId }: { orgSlug: string; specimenId: string }) {
  const issue = await openLabelIssue(specimenId)
  if (!issue) return null
  const count = issue._count.labelReports
  return (
    <Link
      href={`/${orgSlug}/todo`}
      className="mt-6 flex min-h-11 items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium">Open label issue:</span> {issue.title.replace(/^Label: /, '').replace(/ — .*$/, '')}
        {count > 1 && ` (${count} reports)`}
        <span className="block text-xs opacity-80">On the to-do list until a manager ticks it off.</span>
      </span>
    </Link>
  )
}
