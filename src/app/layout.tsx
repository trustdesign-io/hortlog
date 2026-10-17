import type { Metadata } from 'next'
import SPLASH_SCREENS from '@/lib/splash-screens.json'
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

/** Hides the opening screen of scenes already opened this visit (see scene-splash.tsx) */
const SEEN_SPLASH_SCRIPT = `try{var c='';for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);if(k&&k.indexOf('hortlog-splash-')===0&&/^[a-z0-9]+$/.test(k.slice(15)))c+='#scene-splash-'+k.slice(15)+'{display:none!important}'}if(c){var s=document.createElement('style');s.textContent=c;document.head.appendChild(s)}}catch(e){}`

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
  // Launch screens for the home-screen app (scripts/generate-splash.mjs)
  appleWebApp: { capable: true, title: 'hortlog', statusBarStyle: 'default', startupImage: SPLASH_SCREENS },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${figtree.variable}`}>
      <head>
        {/* Before anything is drawn: scenes already opened this visit skip their opening screen */}
        <script dangerouslySetInnerHTML={{ __html: SEEN_SPLASH_SCRIPT }} />
      </head>
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
