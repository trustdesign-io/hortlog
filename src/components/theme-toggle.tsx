'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

/**
 * The server can't know the visitor's theme, so both icons are rendered and CSS
 * picks one from the `dark` class. Rendering only one caused a hydration mismatch
 * that re-rendered every page in the browser.
 */
export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      className={showLabel ? 'min-h-9 justify-start gap-2 px-2 text-muted-foreground hover:text-foreground' : undefined}
      aria-label={showLabel ? undefined : 'Switch between light and dark mode'}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden="true" />
      <Moon className="h-4 w-4 dark:hidden" aria-hidden="true" />
      {showLabel && (
        <>
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </>
      )}
    </Button>
  )
}
