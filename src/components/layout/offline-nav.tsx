'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * The offline copy uses the app's own sidebar and menus. This tells them which
 * page is showing (the copy's address is /offline-app) and which pages can't
 * be opened without a connection. The public demo uses it the same way.
 */
interface OfflineNavState {
  path: string
  /** Hrefs that need a connection: shown, but greyed out */
  disabled: (href: string) => boolean
  /** Why greyed-out links can't be used, shown when tapped (the demo) */
  reason?: string
  /** Where a link really goes (the demo maps the scene's pages to /demo) */
  linkTo?: (href: string) => string
}

const OfflineNav = createContext<OfflineNavState | null>(null)

export function OfflineNavProvider({ path, disabled, reason, linkTo, children }: OfflineNavState & { children: ReactNode }) {
  return <OfflineNav.Provider value={{ path, disabled, reason, linkTo }}>{children}</OfflineNav.Provider>
}

/** Set inside the offline copy, null in the live app */
export function useOfflineNav(): OfflineNavState | null {
  return useContext(OfflineNav)
}
