import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { applyOps } from '@/lib/offline/apply'
import { MAX_OPS_PER_PUSH, parseOp, type SyncOpInput } from '@/lib/offline/ops'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * Receives changes a member made offline. Each change is applied once, however
 * often it's sent. Changes missing from the reply weren't applied and can be
 * sent again.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in to send your changes.' }, { status: 401, headers: NO_STORE })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: NO_STORE })
  }
  const raw = (body as { ops?: unknown })?.ops
  if (!Array.isArray(raw) || raw.length > MAX_OPS_PER_PUSH) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: NO_STORE })
  }

  const ops: SyncOpInput[] = []
  const malformed: string[] = []
  for (const item of raw) {
    const op = parseOp(item)
    if (op) ops.push(op)
    else if (item && typeof (item as { id?: unknown }).id === 'string') malformed.push((item as { id: string }).id)
  }

  const results = await applyOps(user, ops)
  for (const id of malformed) results.push({ id, status: 'rejected', error: 'This change could not be read.' })

  const orgs = new Set(ops.filter((op) => results.some((r) => r.id === op.id && r.status === 'applied')).map((op) => op.org))
  for (const org of orgs) revalidatePath(`/${org}`, 'layout')
  if (orgs.size > 0) revalidatePath('/records')

  return NextResponse.json({ results }, { headers: NO_STORE })
}
