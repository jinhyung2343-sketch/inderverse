import { SettingsPageClient, type InitialSettingsAuth } from '@/components/navigation/HubSettingsMenu'
import { createClient } from '@/lib/supabase/server'

function getGuestInitialAuth(): InitialSettingsAuth {
  return {
    isLoggedIn: false,
    userId: null,
    userNickname: 'Guest',
    profile: null,
  }
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  let initialAuth = getGuestInitialAuth()

  if (user && !error) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_adult_verified, guardian_consent_status, display_name')
      .eq('id', user.id)
      .maybeSingle()

    const fallbackNickname =
      (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
      user.email?.split('@')[0] ||
      '유저'

    initialAuth = {
      isLoggedIn: true,
      userId: user.id,
      userNickname: profile?.display_name || fallbackNickname,
      profile,
    }
  }

  return <SettingsPageClient initialAuth={initialAuth} />
}
