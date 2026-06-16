import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

function getGuestViewerSession() {
  return {
    userId: null,
    isAdultVerified: false,
    isSubscribed: false,
  }
}

function isSupabaseAuthCookie(name: string) {
  return name.startsWith('sb-') && name.includes('auth-token')
}

export const getViewerSession = cache(async () => {
  const cookieStore = await cookies()
  const hasAuthCookie = cookieStore.getAll().some(({ name }) => isSupabaseAuthCookie(name))

  if (!hasAuthCookie) {
    return getGuestViewerSession()
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return getGuestViewerSession()
  }

  const user = data.user

  if (!user) {
    return getGuestViewerSession()
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_adult_verified, is_subscribed')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.warn('Unable to load viewer profile:', profileError)
  }

  return {
    userId: user.id,
    isAdultVerified: profile?.is_adult_verified ?? false,
    isSubscribed: profile?.is_subscribed ?? false,
  }
})
