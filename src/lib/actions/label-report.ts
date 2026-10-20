'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/current-user'
import { cleanLabelNote, isLabelProblem, VISITOR_REPORTS_PER_HOUR } from '@/lib/label-report'
import { saveLabelReport } from '@/lib/label-report-db'
import type { ActionResult } from '@/lib/shared/types'

/** A visitor's address hashed with today's date: enough to limit reports, not to follow anyone */
function visitorKey(ip: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`hortlog-label:${process.env.CRON_SECRET ?? ''}:${day}:${ip}`).digest('hex').slice(0, 32)
}

/**
 * Anyone can say a plant's label is missing or wrong: members from the plant's
 * page, visitors without signing in. It lands on the organisation's to-do list.
 */
export async function reportLabelProblem(
  orgSlug: string,
  specimenId: string,
  problem: string,
  rawNote: string,
  /** Left empty by people; filled in by bots */
  website = '',
): Promise<ActionResult> {
  if (!isLabelProblem(problem)) return { success: false, error: 'Choose what’s wrong with the label.' }
  const note = cleanLabelNote(rawNote)

  try {
    const specimen = await prisma.specimen.findFirst({
      where: { id: specimenId, organisation: { slug: orgSlug } },
      select: { id: true, slug: true },
    })
    if (!specimen) return { success: false, error: 'This plant isn’t here any more.' }

    // Pretend all went well, so bots learn nothing
    if (website.trim()) return { success: true }

    const user = await getCurrentUser()
    const isMember = Boolean(user && (user.isAdmin || user.memberships.some((m) => m.organisation.slug === orgSlug)))

    let key: string | null = null
    if (!isMember) {
      const h = await headers()
      const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
      key = visitorKey(ip)
      const recent = await prisma.labelReport.count({
        where: { visitorKey: key, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      })
      if (recent >= VISITOR_REPORTS_PER_HOUR) {
        return { success: false, error: 'Thanks, we’ve had a few reports from you already. Try again later.' }
      }
    }

    await saveLabelReport({
      specimenId: specimen.id,
      problem,
      note,
      userId: isMember ? (user?.id ?? null) : null,
      fromVisitor: !isMember,
      visitorKey: key,
    })

    revalidatePath(`/${orgSlug}/todo`)
    revalidatePath(`/${orgSlug}/specimens/${specimen.slug}`)
    return { success: true }
  } catch (err) {
    console.error('[reportLabelProblem] error:', err)
    return { success: false, error: 'That couldn’t be sent. Try again.' }
  }
}
