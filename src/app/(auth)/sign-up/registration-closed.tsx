import Link from 'next/link'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function RegistrationClosed() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
          Sign up
        </CardTitle>
        <CardDescription>
          Registration will be open soon. For now please register your interest by emailing{' '}
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
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
