import { createClient } from '@/lib/supabase/server'
import { getNameFromMetadata } from '@/lib/auth/name-utils'
import { AcceptInviteForm } from './accept-invite-form'

export default async function AcceptInvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const defaultName = getNameFromMetadata(user?.user_metadata) ?? ''

  return <AcceptInviteForm defaultName={defaultName} />
}
