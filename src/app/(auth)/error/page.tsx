import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { NewLinkForm } from './new-link-form'

export const metadata: Metadata = {
  title: 'Link expired',
}

const MESSAGES: Record<string, string> = {
  link_expired: 'This link has expired or has already been used. Links last a day and work once.',
  invalid_link: 'This link is incomplete or has already been used. Links work once.',
}

const VALID_REASONS = new Set(Object.keys(MESSAGES))

interface AuthErrorPageProps {
  searchParams: Promise<{ reason?: string }>
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { reason } = await searchParams
  const safeReason = reason && VALID_REASONS.has(reason) ? reason : 'invalid_link'
  const message = MESSAGES[safeReason]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
          Link expired or invalid
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardFooter className="flex-col gap-4">
        <NewLinkForm />
        <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 w-full')}>
          Already have an account? Sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
