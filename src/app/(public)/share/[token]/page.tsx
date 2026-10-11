import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface SharePageProps {
  params: Promise<{ token: string }>
}

export const metadata = {
  robots: { index: false, follow: false },
}

/**
 * Old per-record share links. Records are now shared through the member's public
 * record, so a link still works only while that record is public.
 */
export default async function SharedRecordPage({ params }: SharePageProps) {
  const { token } = await params

  const record = await prisma.workRecord.findUnique({
    where: { shareToken: token },
    select: {
      recordNumber: true,
      user: { select: { username: true, recordPublic: true } },
      organisation: { select: { recordsPublic: true } },
    },
  })

  if (!record?.user.recordPublic || !record.user.username || !record.organisation.recordsPublic) {
    return notFound()
  }
  redirect(`/u/${record.user.username}/${record.recordNumber}`)
}
