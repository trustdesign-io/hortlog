'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * The offline copy uses the app's own sidebar and menus. This tells them which
 * page is showing (the copy's address is /offline-app) and which pages can't
 * be opened without a connection.
 */
interface OfflineNavState {
  path: string
  /** Hrefs that need a connection: shown, but greyed out */
  disabled: (href: string) => boolean
}

const OfflineNav = createContext<OfflineNavState | null>(null)

export function OfflineNavProvider({ path, disabled, children }: OfflineNavState & { children: ReactNode }) {
  return <OfflineNav.Provider value={{ path, disabled }}>{children}</OfflineNav.Provider>
}

/** Set inside the offline copy, null in the live app */
export function useOfflineNav(): OfflineNavState | null {
  return useContext(OfflineNav)
}
