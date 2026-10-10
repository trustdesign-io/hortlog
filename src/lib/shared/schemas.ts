// Copied from trustdesign-io/trustdesign-shared (src/schemas, commit 67e7c22)
// so the project has no private git dependency. Edit here, not upstream.
import { z } from 'zod'

export const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
})

export const SignUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export type SignInInput = z.infer<typeof SignInSchema>
export type SignUpInput = z.infer<typeof SignUpSchema>
