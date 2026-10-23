import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Join hortlog', robots: { index: false, follow: false } }

const TYPES = new Set(['invite', 'magiclink', 'recovery', 'email'])

const COPY: Record<string, { title: string; text: string; button: string }> = {
  invite: { title: 'You’ve been invited', text: 'Accept your invite to set your name and password.', button: 'Accept invite' },
  email: { title: 'Confirm your email', text: 'Confirm your email address to finish signing up.', button: 'Confirm email' },
  magiclink: { title: 'Sign in', text: 'Continue to sign in to hortlog.', button: 'Sign in' },
  recovery: { title: 'Reset your password', text: 'Continue to choose a new password.', button: 'Continue' },
}

interface JoinPageProps {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}

/**
 * Where an emailed link lands. The link only works once, and email scanners
 * open links before people do, so nothing happens until the button is pressed.
 */
export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { token_hash: tokenHash, type } = await searchParams
  if (!tokenHash || !type || !TYPES.has(type) || tokenHash.length > 200) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
            This link isn&rsquo;t complete
          </CardTitle>
          <CardDescription>Open the link from your email again, or ask for a new one.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/error?reason=invalid_link" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
            Get a new link
          </Link>
        </CardFooter>
      </Card>
    )
  }

  const copy = COPY[type]
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.text}</CardDescription>
      </CardHeader>
      <CardFooter>
        {/* A plain form: works before the page's scripts load */}
        <form action="/auth/callback" method="get" className="w-full">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="confirm" value="1" />
          <button type="submit" className={cn(buttonVariants({ size: 'lg' }), 'h-11 w-full')}>
            {copy.button}
          </button>
        </form>
      </CardFooter>
    </Card>
  )
}
