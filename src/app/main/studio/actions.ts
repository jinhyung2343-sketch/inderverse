'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']

export async function becomeCreator() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const currentRole = profile?.role as UserRole | undefined

  if (currentRole === 'creator' || currentRole === 'admin') {
    redirect('/main/studio/channels')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  redirect('/main/studio/channels')
}
