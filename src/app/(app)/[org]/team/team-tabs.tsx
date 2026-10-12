import { PageTabs } from '@/components/page-tabs'

interface TeamTabsProps {
  orgSlug: string
  active: 'team' | 'members'
}

/** Tabs on the Team page. Only directors, managers and admins see them: Members is for managing access. */
export function TeamTabs({ orgSlug, active }: TeamTabsProps) {
  return (
    <PageTabs
      label="Team"
      active={active}
      tabs={[
        { key: 'team', label: 'Team', href: `/${orgSlug}/team` },
        { key: 'members', label: 'Members', href: `/${orgSlug}/team/members` },
      ]}
    />
  )
}
