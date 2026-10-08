import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAuth()
  if (!isAdmin(user)) return notFound()

  return <>{children}</>
}
