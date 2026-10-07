import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/layout/logo'
import { buttonVariants } from '@/components/ui/button-variants'
import { ScientificName } from '@/components/ui/scientific-name'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: { absolute: 'hortlog — horticultural tools for gardens and woodlands' },
  description:
    'hortlog gives every specimen its own page — identification, provenance, conservation status — readable from a QR code at the vantage point.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Logo href="/" />
        <nav aria-label="Primary" className="flex items-center gap-3">
          <Link href="/sign-in" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Sign in
          </Link>
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'sm' }))}>
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="px-6 pt-16 pb-24 max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-medium leading-tight mb-6">
            A living record for botanical collections
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            hortlog gives every specimen its own page — identification, provenance,
            conservation status — readable from a QR code at the vantage point,
            however far back the plant is planted.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
              Sign up
            </Link>
            <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Sign in
            </Link>
          </div>
        </section>

        {/* Problem / Vantage explanation */}
        <section className="bg-card border-t border-border px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-medium mb-4 text-center">
              The problem with plant labels
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
              Most labels stand too far from the path to read. When you can read one,
              it carries a fixed name and a date — nothing more.
            </p>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium font-heading text-accent-foreground">
                  1
                </div>
                <h3 className="font-heading text-lg font-medium">Scan the code</h3>
                <p className="text-sm text-muted-foreground">
                  One QR code at the vantage point covers every specimen visible
                  from where you stand. No app to install.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium font-heading text-accent-foreground">
                  2
                </div>
                <h3 className="font-heading text-lg font-medium">See what&apos;s in the view</h3>
                <p className="text-sm text-muted-foreground">
                  A grid or list of every specimen placed in that view,
                  laid out the way the garden staff decided.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium font-heading text-accent-foreground">
                  3
                </div>
                <h3 className="font-heading text-lg font-medium">Read the full record</h3>
                <p className="text-sm text-muted-foreground">
                  Scientific name, family, origin, conservation status, planting notes —
                  updated whenever the record changes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA footer */}
        <section className="px-6 py-20 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-medium mb-4">
            Built for gardens that take records seriously
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            From a single{' '}
            <ScientificName>Quercus robur</ScientificName>{' '}
            to a glasshouse bed of ten thousand specimens — hortlog scales to your collection.
          </p>
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
            Sign up
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo href="/" />
          <p>&copy; {new Date().getFullYear()} hortlog. All rights reserved.</p>
          <nav aria-label="Footer" className="flex gap-4">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
