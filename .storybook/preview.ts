import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

// Inject next/font CSS variables so font utilities resolve correctly in Storybook.
// next/font sets these on <html> at runtime via Next.js — Storybook bypasses that.
// IMPORTANT: whenever a new font is added to src/app/layout.tsx, add its
// CSS variable here too or it will appear as undefined in Storybook.
// No custom fonts in template — add your project's font variable shims here
// Example:
// if (typeof document !== 'undefined') {
//   document.documentElement.style.setProperty('--font-your-font', '"Your Font"')
// }

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;