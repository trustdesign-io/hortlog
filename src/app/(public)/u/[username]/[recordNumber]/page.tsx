import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { findPublicOwner, findPublicRecord } from '@/lib/public-record-queries'
import { parseRecordNumber, stripTags, plantNameHtml } from '@/lib/personal-record'
import { WorkedRecordSheet } from '@/components/records/worked-record-sheet'
import { PrintButton } from '@/components/print-button'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

interface PublicRecordPageProps {
  params: Promise<{ username: string; recordNumber: string }>
}

async function load({ params }: PublicRecordPageProps) {
  const { username, recordNumber: raw } = await params
  const recordNumber = parseRecordNumber(raw)
  if (recordNumber === null) return null
  const owner = await findPublicOwner(username)
  if (!owner || !owner.username) return null
  const record = await findPublicRecord(owner.id, recordNumber)
  return record ? { owner, record } : null
}

export async function generateMetadata(props: PublicRecordPageProps): Promise<Metadata> {
  const data = await load(props)
  return {
    title: data ? `${stripTags(plantNameHtml(data.record))} — ${data.owner.name ?? data.owner.username}` : 'Record not found',
    robots: { index: false, follow: false },
  }
}

export default async function PublicRecordPage(props: PublicRecordPageProps) {
  const data = await load(props)
  if (!data) return notFound()
  const { owner, record } = data

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 print:max-w-full">
      <Link
        href={`/u/${owner.username}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-4 print:hidden')}
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        {owner.name ?? owner.username}
      </Link>
      <WorkedRecordSheet
        record={record}
        privateLinks={false}
        publicView={{ showNotes: owner.recordShowNotes }}
      />
      <div className="mt-2 print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
