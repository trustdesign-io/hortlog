// Keep this in sync with all top-level app routes — any segment listed here
// cannot be used as an organisation slug (org.ts validates on create/rename).
export const RESERVED_ORG_SLUGS = new Set([
  '_next',
  'accept-invite',
  'admin',
  'api',
  'auth',
  'check-email',
  'dashboard',
  'no-access',
  'orgs',
  'records',
  'settings',
  'share',
  'sign-in',
  'sign-up',
  'v',
])
