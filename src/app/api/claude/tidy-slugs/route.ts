import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { apiUser } from '@/lib/api-keys'
import { editableOrgIds } from '@/lib/claude-api'
import { prisma } from '@/lib/prisma'
import { slugAfterNaming } from '@/lib/specimen-slug'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * Plants named after being logged as Unidentified, whose web address is still
 * the placeholder: gives each one from its botanical name. Safe to repeat.
 */
export async function POST(req: Request) {
  const user = await apiUser(req)
  if (!user) return NextResponse.json({ error: 'Send a hortlog key: Authorization: Bearer hk_…' }, { status: 401, headers: NO_STORE })

  const specimens = await prisma.specimen.findMany({
    where: { organisationId: { in: await editableOrgIds(user) }, notes: { contains: 'Field name:' }, species: { slug: { not: 'unidentified' } } },
    select: { id: true, organisationId: true, slug: true, notes: true, accessionNumber: true, species: { select: { scientificName: true } } },
  })

  const changed: { from: string; to: string }[] = []
  for (const s of specimens) {
    const slug = await slugAfterNaming(s, s.species.scientificName)
    if (!slug || slug === s.slug) continue
    await prisma.specimen.update({ where: { id: s.id }, data: { slug } })
    changed.push({ from: s.slug, to: slug })
  }
  if (changed.length > 0) revalidatePath('/', 'layout')
  return NextResponse.json({ changed }, { headers: NO_STORE })
}
