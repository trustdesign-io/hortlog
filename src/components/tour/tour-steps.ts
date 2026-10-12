// Tour step definitions. Each step references a `data-tour` attribute added to
// the corresponding element. Steps are filtered at runtime to only those whose
// elements are present in the DOM — so page-specific steps are automatically
// skipped when the user is elsewhere.

export interface TourStep {
  tourId: string
  title: string
  description: string
  /** Whether this step requires the mobile drawer to be open */
  requiresDrawer?: boolean
  /** Minimum role required to see this step: 'member' | 'manager' | 'admin' */
  role?: 'member' | 'manager' | 'admin'
}

export const TOUR_STEPS: TourStep[] = [
  {
    tourId: 'my-record',
    title: 'My record',
    description:
      'Your personal horticultural work record — a log of every specimen you have worked with across all your gardens. Visitors, employers, and anyone with the link can read it.',
  },
  {
    tourId: 'org-switcher',
    title: 'Organisation switcher',
    description:
      "Switch between the gardens and collections you belong to. Each one has its own specimens, scenes, and team.",
    requiresDrawer: true,
  },
  {
    tourId: 'org-overview',
    title: 'Organisation overview',
    description:
      'A quick summary of the current garden — recent scenes, collections, and specimen counts at a glance.',
    requiresDrawer: true,
  },
  {
    tourId: 'org-scenes',
    title: 'Scenes',
    description:
      'A scene is one viewpoint in the garden — a bed, a corner, or a glasshouse. Attach a QR code to the vantage point and visitors can browse every specimen from where they stand.',
    requiresDrawer: true,
  },
  {
    tourId: 'org-collections',
    title: 'Collections',
    description:
      'Group specimens by theme, taxonomy, or any other scheme. A specimen can belong to multiple collections.',
    requiresDrawer: true,
  },
  {
    tourId: 'org-todo',
    title: 'To do',
    description:
      'Tasks for the team — watering, pruning, propagation. Assign them to members and track progress here.',
    requiresDrawer: true,
  },
  {
    tourId: 'org-team',
    title: 'Team',
    description:
      'Everyone who works at this garden. Directors and managers can invite new members and adjust roles.',
    requiresDrawer: true,
  },
  {
    tourId: 'org-settings',
    title: 'Org settings',
    description:
      'Configure the organisation name, logo, and whether member work records may publicly show this garden.',
    requiresDrawer: true,
    role: 'manager',
  },
  {
    tourId: 'account-settings',
    title: 'Account settings',
    description:
      'Change your name, email, password, and profile picture. You can also make your public work record searchable here.',
    requiresDrawer: true,
  },
  {
    tourId: 'admin',
    title: 'Admin',
    description:
      'Platform administration — all organisations, all users, and the shared species catalogue. Only platform admins can see this section.',
    requiresDrawer: true,
    role: 'admin',
  },
]
