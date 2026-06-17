import { MainHubClient, type InitialHubAuth } from '@/components/main/MainHubClient'
import { createClient } from '@/lib/supabase/server'

function getGuestInitialAuth(): InitialHubAuth {
  return {
    isLoggedIn: false,
    userNickname: 'Guest',
    profile: null,
    guardianConsentStatus: null,
  }
}

export default async function MainHubPage() {
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
      userNickname: profile?.display_name || fallbackNickname,
      profile,
      guardianConsentStatus: profile?.guardian_consent_status ?? null,
    }
  }

  return <MainHubClient initialAuth={initialAuth} />
}
