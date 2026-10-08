import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { AdminNav } from './_components/admin-nav'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAuth()
  if (!isAdmin(user)) return notFound()

  return (
    <div className="space-y-6">
      <AdminNav />
      <div>{children}</div>
    </div>
  )
}
