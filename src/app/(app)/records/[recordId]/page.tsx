import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { WORKED_RECORD_SELECT } from '@/lib/personal-record-queries'
import { WorkedRecordSheet } from '@/components/records/worked-record-sheet'
import { BackToRecord } from '@/components/records/back-to-record'
import { buttonVariants } from '@/components/ui/button-variants'
import { PrintButton } from '@/components/print-button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface RecordPageProps {
  params: Promise<{ recordId: string }>
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { recordId } = await params
  const user = await requireAuth()

  const record = await prisma.workRecord.findFirst({
    where: { id: recordId, userId: user.id },
    select: WORKED_RECORD_SELECT,
  })
  if (!record) return notFound()

  return (
    <div className="print:max-w-full">
      <BackToRecord />
      <WorkedRecordSheet record={record} />

      <div className="mb-6 print:hidden">
        <PrintButton className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'no-underline')} />
      </div>

      {/* Whether this record is on the member's public record, and why not */}
      <p className="text-sm text-muted-foreground print:hidden">
        {!user.recordPublic || !user.username ? (
          <>
            Private.{' '}
            <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">
              Make your record public
            </Link>
          </>
        ) : record.organisation.recordsPublic ? (
          <>
            Public at{' '}
            <Link
              href={`/u/${user.username}/${record.recordNumber}`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              hortlog.com/u/{user.username}/{record.recordNumber}
            </Link>
          </>
        ) : (
          <>Not on your public record: {record.organisation.name} keeps its plants private.</>
        )}
      </p>
    </div>
  )
}

