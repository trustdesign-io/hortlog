'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { TourPanel } from '@/components/tour/tour-steps'

interface MobilePanels {
  /** Which mobile slide-out panel is open: the menu ('nav'), You ('you'), or neither. */
  panel: TourPanel | null
  setPanel: (panel: TourPanel | null) => void
}

const MobilePanelsContext = createContext<MobilePanels>({ panel: null, setPanel: () => {} })

/** Shares the mobile panels' state, so the tour (started from the footer) can open them. */
export function MobilePanelsProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<TourPanel | null>(null)
  const value = useMemo(() => ({ panel, setPanel }), [panel])
  return <MobilePanelsContext.Provider value={value}>{children}</MobilePanelsContext.Provider>
}

export function useMobilePanels(): MobilePanels {
  return useContext(MobilePanelsContext)
}
