import type { Metadata } from 'next'
import { Fraunces, Figtree } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { GAScript } from '@/components/ga-script'
import { CookieBanner } from '@/components/cookie-banner'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: true,
  style: ['normal', 'italic'],
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'),
  title: {
    default: 'hortlog',
    template: '%s | hortlog',
  },
  description: 'A living record for botanical collections.',
  manifest: '/manifest.webmanifest',
  icons: { apple: '/apple-touch-icon.png' },
  // Added to a phone's home screen, hortlog opens full screen and works offline
  appleWebApp: { capable: true, title: 'hortlog', statusBarStyle: 'default' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${figtree.variable}`}>
      <body>
        {/* Dark unless someone picks light with the theme switch */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <CookieBanner />
        </ThemeProvider>
        <GAScript />
      </body>
    </html>
  )
}
