import { redirect } from 'next/navigation'

interface OldMembersPageProps {
  params: Promise<{ org: string }>
}

/** Members moved into the Team page as a tab; keep old links working. */
export default async function OldMembersPage({ params }: OldMembersPageProps) {
  const { org } = await params
  redirect(`/${org}/team/members`)
}
