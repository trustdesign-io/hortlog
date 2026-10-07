import { requireOrgAccess } from '@/lib/auth/permissions'

interface OrgPageProps {
  params: Promise<{ org: string }>
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { org } = await params
  await requireOrgAccess(org, 'can_edit_specimen')

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-medium mb-2">{org}</h1>
      <p className="text-muted-foreground">
        Organisation dashboard — coming in Phase 2.
      </p>
    </div>
  )
}
