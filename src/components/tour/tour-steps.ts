// Tour step definitions. Each step references a `data-tour` attribute added to
// the corresponding element. Steps are filtered at runtime to only those whose
// elements are present in the DOM — so page-specific steps are automatically
// skipped when the user is elsewhere.

/** Mobile slide-out panels: the burger menu ('nav') and the user icon's panel ('you'). */
export type TourPanel = 'nav' | 'you'

export interface TourStep {
  tourId: string
  title: string
  description: string
  /** On mobile, the slide-out panel holding this step's element: the menu or the You panel */
  panel?: TourPanel
  /** Minimum role required to see this step: 'member' | 'manager' | 'admin' */
  role?: 'member' | 'manager' | 'admin'
}

export const TOUR_STEPS: TourStep[] = [
  {
    tourId: 'my-record',
    panel: 'you',
    title: 'My record',
    description:
      'Your personal horticultural work record — a log of every specimen you have worked with across all your gardens. Visitors, employers, and anyone with the link can read it.',
  },
  {
    tourId: 'account-settings',
    title: 'Account settings',
    description:
      'Change your name, email, password, and profile picture. You can also make your public work record searchable here.',
    panel: 'you',
  },
  {
    tourId: 'org-switcher',
    title: 'Organisation switcher',
    description:
      "Switch between the gardens and collections you belong to. Each one has its own specimens, scenes, and team.",
    panel: 'nav',
  },
  {
    tourId: 'org-overview',
    title: 'Organisation overview',
    description:
      'A quick summary of the current garden — recent scenes, collections, and specimen counts at a glance.',
    panel: 'nav',
  },
  {
    tourId: 'org-collections',
    title: 'Collections',
    description:
      'Group specimens by theme, taxonomy, or any other scheme. A specimen can belong to multiple collections.',
    panel: 'nav',
  },
  {
    tourId: 'org-scenes',
    title: 'Scenes',
    description:
      'A scene is one viewpoint in the garden — a bed, a corner, or a glasshouse. Attach a QR code to the vantage point and visitors can browse every specimen from where they stand.',
    panel: 'nav',
  },
  {
    tourId: 'org-todo',
    title: 'To do',
    description:
      'Tasks for the team — watering, pruning, propagation. Assign them to members and track progress here.',
    panel: 'nav',
  },
  {
    tourId: 'org-team',
    title: 'Team',
    description:
      'Everyone who works at this garden. Directors and managers can invite new members and adjust roles.',
    panel: 'nav',
  },
  {
    tourId: 'org-settings',
    title: 'Org settings',
    description:
      'Configure the organisation name, logo, and whether member work records may publicly show this garden.',
    panel: 'nav',
    role: 'manager',
  },
  {
    tourId: 'admin',
    title: 'Admin',
    description:
      'Platform administration — all organisations, all users, and the shared species catalogue. Only platform admins can see this section.',
    panel: 'nav',
    role: 'admin',
  },
]
