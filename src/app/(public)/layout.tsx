import type { ReactNode } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AppFooter } from '@/components/layout/app-footer'
import { PublicFooter } from '@/components/layout/public-footer'
import { getCurrentUser } from '@/lib/auth/current-user'

const LEGAL = { heading: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }] }

const SIGNED_OUT_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Sign up', href: '/sign-up' },
      { label: 'Sign in', href: '/sign-in' },
    ],
  },
  LEGAL,
]

const SIGNED_IN_COLUMNS = [{ heading: 'Product', links: [{ label: 'My record', href: '/records' }] }, LEGAL]

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  const signedIn = user !== null

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip link: appears on focus for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring focus:outline-none"
      >
        Skip to main content
      </a>
      <Header signedIn={signedIn} />
      <main id="main-content" className="flex-1">{children}</main>
      <PublicFooter
        full={<Footer navColumns={signedIn ? SIGNED_IN_COLUMNS : SIGNED_OUT_COLUMNS} tagline="A living record for botanical collections." />}
        slim={<AppFooter user={user} className="h-14 px-4" madeWith />}
      />
    </div>
  )
}
