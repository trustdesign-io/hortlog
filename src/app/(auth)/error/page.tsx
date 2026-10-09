import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Link expired',
}

const MESSAGES: Record<string, string> = {
  link_expired: 'This link has expired. Please request a new one.',
  invalid_link: 'This link is invalid or has already been used. Please request a new one.',
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
      <CardFooter>
        <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
