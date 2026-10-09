'use client'

export type ConsentChoice = 'accepted' | 'rejected'

const STORAGE_KEY = 'hortlog_cookie_consent'

export function getConsentChoice(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'accepted' || stored === 'rejected') return stored
  return null
}

export function saveConsentChoice(choice: ConsentChoice): void {
  window.localStorage.setItem(STORAGE_KEY, choice)
}
