import type { Metadata } from 'next'
import { OfflineApp } from './offline-app'

// One static page, saved on the device by the service worker, that draws any
// signed-in page from the device's saved copy when there's no connection.
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
}

export default function OfflineAppPage() {
  return <OfflineApp />
}
