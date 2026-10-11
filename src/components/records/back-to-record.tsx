import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

export function BackToRecord() {
  return (
    <Link
      href="/records"
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-4 print:hidden')}
    >
      <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
      My record
    </Link>
  )
}
