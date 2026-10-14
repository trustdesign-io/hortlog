import type { Metadata } from 'next'
import Link from 'next/link'
import { getImageProps } from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLandingPath } from '@/lib/auth/landing'
import { COPYRIGHT_HOLDER, Logo } from '@/components/layout/logo'
import { buttonVariants } from '@/components/ui/button-variants'
import { ScientificName } from '@/components/ui/scientific-name'
import { HeroSection } from '@/components/landing/hero-section'
import { PersonalRecordSection } from '@/components/landing/personal-record-section'
import { CookieSettingsButton } from '@/components/cookie-banner'
import { cn } from '@/lib/utils'
import { Eye, Shield, Sparkles, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: { absolute: 'hortlog — horticultural tools for gardens and woodlands' },
  description:
    'hortlog gives every specimen its own page — identification, provenance, conservation status — readable from a QR code at the vantage point.',
  alternates: { canonical: '/' },
}

/** Responsive image band — full-width strip with a phone crop below 640 px
 *  and a wide crop above. Lazy-loaded since it is below the fold. */
function LandingBand({
  wideSrc,
  phoneSrc,
  alt,
}: {
  wideSrc: string
  phoneSrc: string
  alt: string
}) {
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({
    src: wideSrc,
    alt,
    width: 1680,
    height: 720,
    sizes: '100vw',
    quality: 85,
  })

  const {
    props: { srcSet: phoneSrcSet, src: phoneSrcFallback },
  } = getImageProps({
    src: phoneSrc,
    alt,
    width: 960,
    height: 1200,
    sizes: '100vw',
    quality: 85,
  })

  return (
    <div className="relative w-full h-56 sm:h-80 overflow-hidden" role="img" aria-label={alt}>
      <picture>
        {/* Wide crop on sm and above */}
        <source media="(min-width: 640px)" srcSet={wideSrcSet} sizes="100vw" />
        <img
          src={phoneSrcFallback}
          srcSet={phoneSrcSet}
          alt=""
          aria-hidden="true"
          sizes="100vw"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </picture>
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(await getLandingPath(user.id))
  }

  return (
    <div className="force-light min-h-screen bg-background text-foreground">
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
        <HeroSection
          backgroundMedia={{
            type: 'image',
            src: '/images/landing/care-wide.png',
            phoneSrc: '/images/landing/care-phone.png',
            srcWidth: 1680,
            srcHeight: 720,
            phoneSrcWidth: 960,
            phoneSrcHeight: 1200,
            alt: 'A horticulturist repotting an orchid in a glasshouse',
            sizes: '100vw',
          }}
          heading={
            <h1 className="font-heading text-4xl sm:text-5xl font-medium leading-tight mb-6">
              A living record for botanical collections
            </h1>
          }
          body={
            <p className="text-lg text-white mb-10 max-w-xl mx-auto">
              hortlog gives every specimen its own page — identification, provenance,
              conservation status — readable from a QR code at the vantage point,
              however far back the plant is planted.
            </p>
          }
          actions={
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up" className={cn(buttonVariants({ size: 'xl' }), 'w-full text-white sm:w-auto')}>
                Sign up
              </Link>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'xl' }),
                  'w-full border-white bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto',
                )}
              >
                Sign in
              </Link>
            </div>
          }
        />

        {/* How it works */}
        <section className="bg-card border-t border-border">
          <div className="px-6 py-20">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl font-medium mb-4 text-center">
                How we can label plants better
              </h2>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
                A label can only hold a few words, and the many remarkable plants are often
                furthest from the path. One code at the vantage point opens up every plant you
                can see, with as much as there is to tell.
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
                  <h3 className="font-heading text-lg font-medium">See what&apos;s in the scene</h3>
                  <p className="text-sm text-muted-foreground">
                    A grid or list of every specimen placed in that scene,
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
          </div>
        </section>

        {/* Vantage benefits */}
        <LandingBand
          wideSrc="/images/landing/discovery-wide.png"
          phoneSrc="/images/landing/discovery-phone.png"
          alt="A visitor scanning a QR label at an orchid display"
        />
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                Vantage
              </p>
              <h2 className="font-heading text-2xl sm:text-3xl font-medium mb-4">
                A label that does more
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                One code at the viewpoint opens a page for every plant in the scene, readable
                from wherever you stand.
              </p>
            </div>
            {/* Phones: a swipeable row of cards that snap into place; wider screens: a grid */}
            <div
              role="region"
              aria-label="What Vantage does"
              tabIndex={0}
              className="-mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
            >
            <ul
              role="list"
              className="flex snap-x snap-mandatory scroll-px-6 gap-4 sm:grid sm:grid-cols-2 sm:gap-8 lg:grid-cols-4"
            >
              <li className="flex w-[78%] shrink-0 snap-start flex-col gap-2 rounded-xl border bg-background p-5 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-heading font-medium text-sm sm:text-base">Every plant, within reach</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Read about plants far back in the bed or high in the canopy, without leaving the path.
                </p>
              </li>
              <li className="flex w-[78%] shrink-0 snap-start flex-col gap-2 rounded-xl border bg-background p-5 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-heading font-medium text-sm sm:text-base">Built to last</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  One sturdy sign at the edge of the bed, clear of pruning, mulching and replanting.
                </p>
              </li>
              <li className="flex w-[78%] shrink-0 snap-start flex-col gap-2 rounded-xl border bg-background p-5 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-heading font-medium text-sm sm:text-base">Alive with context</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Flowering now, recently repotted, newly arrived: what&apos;s happening to each plant, as it happens.
                </p>
              </li>
              <li className="flex w-[78%] shrink-0 snap-start flex-col gap-2 rounded-xl border bg-background p-5 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                <RefreshCw className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-heading font-medium text-sm sm:text-base">Update once, everywhere</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Change a record and every page reflects it straight away.
                </p>
              </li>
            </ul>
            </div>
          </div>
        </section>

        {/* Natural interpretation */}
        <section className="px-6 py-20 bg-card border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Natural interpretation
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-medium mb-4">
              Every plant has a story worth telling
            </h2>
            <p className="text-muted-foreground">
              Where it came from, how it got here, who looks after it and what they did this
              season. hortlog keeps those stories with the plant, so the label grows with the
              garden: pruned in spring, repotted last week, newly flowering today.
            </p>
          </div>
        </section>

        {/* Personal record */}
        <LandingBand
          wideSrc="/images/landing/team-wide.png"
          phoneSrc="/images/landing/team-phone.png"
          alt="Two staff members reviewing records on a tablet at an orchid wall"
        />
        <PersonalRecordSection />

        {/* The story behind hortlog */}
        <section className="bg-card border-t border-border px-6 py-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-medium mb-6 text-center">
              What&apos;s the story behind this?
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                It began in a glasshouse, standing on the path and squinting at a label set
                far back among the plants. The specimen behind it was extraordinary. The
                label could only say so much.
              </p>
              <p>
                hortlog was made by someone who works where technology and botanical
                horticulture meet, to give every plant room to tell its story.
              </p>
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
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'xl' }))}>
            Sign up
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo href="/" />
          <p>&copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}. All rights reserved.</p>
          <nav aria-label="Footer" className="flex gap-4">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <CookieSettingsButton />
          </nav>
        </div>
      </footer>
    </div>
  )
}
