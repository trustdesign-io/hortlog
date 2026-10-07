import type { ReactNode } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip link: appears on focus for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring focus:outline-none"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </div>
  )
}
