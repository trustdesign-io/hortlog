'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/permissions'
import type { ActionResult } from '@trustdesign/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/

export async function createOrg(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!name) return { success: false, error: 'Organisation name is required.' }
  if (!slug) return { success: false, error: 'URL slug is required.' }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      success: false,
      error: 'Slug may only contain lowercase letters, numbers, and hyphens.',
    }
  }

  const existing = await prisma.organisation.findUnique({ where: { slug } })
  if (existing) {
    return {
      success: false,
      error: `The slug "${slug}" is already taken. Please choose a different one.`,
    }
  }

  await prisma.organisation.create({
    data: {
      slug,
      name,
      memberships: {
        create: {
          userId: user.id,
          role: 'MANAGER',
        },
      },
    },
  })

  redirect(`/${slug}`)
}
