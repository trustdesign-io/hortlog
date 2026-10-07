import type { ReactNode } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </div>
  )
}
