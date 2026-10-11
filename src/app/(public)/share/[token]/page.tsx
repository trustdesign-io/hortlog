import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WORKED_RECORD_SELECT } from '@/lib/personal-record-queries'
import { WorkedRecordSheet } from '@/components/records/worked-record-sheet'
import { PrintButton } from '@/components/print-button'

interface SharePageProps {
  params: Promise<{ token: string }>
}

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function SharedRecordPage({ params }: SharePageProps) {
  const { token } = await params

  const record = await prisma.workRecord.findUnique({
    where: { shareToken: token },
    select: WORKED_RECORD_SELECT,
  })
  if (!record) return notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 print:max-w-full">
      <WorkedRecordSheet record={record} privateLinks={false} />
      <div className="mt-2 print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
