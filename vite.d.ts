// Type declarations for Vite-specific import query suffixes used in Storybook stories.
// The `?raw` suffix is handled by Vite at runtime but TypeScript needs an explicit
// declaration since it's not part of the standard module resolution.

declare module '*.css?raw' {
  const content: string
  export default content
}
