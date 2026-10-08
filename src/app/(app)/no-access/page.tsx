import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = { title: 'No access · hortlog' }

// Shown when a signed-in user opens an organisation page they can't use.
// Deliberately the same for "not a member", "role can't do this" and
// "organisation doesn't exist", so it never reveals which organisations exist.
export default function NoAccessPage() {
  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
            You don&apos;t have access to this page
          </CardTitle>
          <CardDescription>
            You&apos;re not a member of this organisation, or your role doesn&apos;t include
            this page. If you think you should have access, ask a manager of the organisation
            to invite you, or contact{' '}
            <a
              href="mailto:danny@trustdesign.io"
              className="underline underline-offset-4 text-foreground"
            >
              danny@trustdesign.io
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/dashboard" className={buttonVariants({ className: 'w-full' })}>
            Back to dashboard
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
