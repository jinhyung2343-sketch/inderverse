import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getViewerSession = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return {
      userId: null,
      isAdultVerified: false,
    }
  }

  const user = data.user

  if (!user) {
    return {
      userId: null,
      isAdultVerified: false,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_adult_verified')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    isAdultVerified: profile?.is_adult_verified ?? false,
  }
})
