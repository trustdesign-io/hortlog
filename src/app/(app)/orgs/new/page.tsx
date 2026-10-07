import { redirect } from 'next/navigation'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { NewOrgForm } from './new-org-form'

export default async function NewOrgPage() {
  const user = await requireAuth()

  if (!isAdmin(user)) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center p-6">
      <NewOrgForm />
    </div>
  )
}
