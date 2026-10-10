// Copied from trustdesign-io/trustdesign-shared (src/types, commit 67e7c22)
// so the project has no private git dependency. Edit here, not upstream.

/** Result returned by server actions. */
export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }
