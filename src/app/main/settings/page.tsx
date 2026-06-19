import { SettingsPageClient, type InitialSettingsAuth } from '@/components/navigation/HubSettingsMenu'
import { resolveStoredDisplayName } from '@/lib/auth/display-name'
import { createClient } from '@/lib/supabase/server'

function getGuestInitialAuth(): InitialSettingsAuth {
  return {
    isLoggedIn: false,
    userId: null,
    userEmail: null,
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

    initialAuth = {
      isLoggedIn: true,
      userId: user.id,
      userEmail: user.email ?? null,
      userNickname: resolveStoredDisplayName({
        email: user.email,
        metadataDisplayName: user.user_metadata?.display_name,
        profileDisplayName: profile?.display_name,
      }),
      profile,
    }
  }

  return <SettingsPageClient initialAuth={initialAuth} />
}
