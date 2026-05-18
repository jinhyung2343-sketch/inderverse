import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  forgetStoredAccount,
  readStoredAccounts,
  rememberAccountSession,
  type StoredInderverseAccount,
} from '@/lib/auth/account-registry'
import { Database } from '@/lib/supabase/types'
import {
  clearPendingUserTermsConsent,
  readPendingUserTermsConsent,
  USER_TERMS_CONSENT_CONFLICT_KEY,
} from '@/lib/user-consent-log'
import {
  clearPendingMinorGuardianConsent,
  readPendingMinorGuardianConsent,
} from '@/lib/minor-guardian-consent'

type Profile = Database['public']['Tables']['profiles']['Row']

let sessionCheckPromise: Promise<void> | null = null

function syncViewerAccountGroup() {
  return fetch('/api/auth/account-groups', {
    method: 'GET',
    cache: 'no-store',
  }).catch(() => null)
}

function recordViewerAccountSwitch(fromUserId: string | null, toUserId: string) {
  return fetch('/api/auth/account-groups/switch', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fromUserId, toUserId }),
  }).catch(() => null)
}

async function syncLinkedStoredAccounts(currentUserId: string, accounts: StoredInderverseAccount[]) {
  const linkableAccounts = accounts.filter((account) => account.userId !== currentUserId)

  if (linkableAccounts.length === 0) {
    return
  }

  await Promise.allSettled(
    linkableAccounts.map((account) =>
      fetch('/api/auth/account-groups/link/confirm', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetAccessToken: account.accessToken,
          targetUserId: account.userId,
        }),
      })
    )
  )
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdultVerified: boolean;
  isSubscribed: boolean;
  guardianConsentStatus: string | null;
  // 프로토타입용 mock 상태
  isLoggedIn: boolean;
  userNickname: string;
  storedAccounts: StoredInderverseAccount[];
  checkSession: () => Promise<void>;
  refreshStoredAccounts: () => void;
  switchAccount: (userId: string) => Promise<void>;
  forgetAccount: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAdultVerified: false,
  isSubscribed: false,
  guardianConsentStatus: null,
  isLoggedIn: false,
  userNickname: 'Guest',
  storedAccounts: [],
  
  checkSession: async () => {
    if (sessionCheckPromise) {
      return sessionCheckPromise
    }

    sessionCheckPromise = (async () => {
      set({ isLoading: true })
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (user && !error) {
        const pendingConsent = readPendingUserTermsConsent()

        if (pendingConsent && pendingConsent.user_id === user.id) {
          const { error: pendingConsentError } = await supabase
            .from('user_terms_consents')
            .upsert(pendingConsent, {
              onConflict: USER_TERMS_CONSENT_CONFLICT_KEY,
            })

          if (!pendingConsentError) {
            clearPendingUserTermsConsent()
          }
        }

        const pendingGuardianConsent = readPendingMinorGuardianConsent()

        if (pendingGuardianConsent && pendingGuardianConsent.user_id === user.id) {
          const { error: guardianConsentError } = await supabase
            .from('minor_guardian_consents')
            .upsert(pendingGuardianConsent, {
              onConflict: 'user_id',
            })

          if (!guardianConsentError) {
            clearPendingMinorGuardianConsent()
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const verifiedSession = session?.user.id === user.id ? session : null
        const storedAccounts = verifiedSession
          ? rememberAccountSession({ profile, session: verifiedSession, user })
          : readStoredAccounts()

        const fallbackNickname =
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          '유저'

        set({
          user,
          profile,
          isLoading: false,
          isAdultVerified: profile?.is_adult_verified ?? false,
          isSubscribed: profile?.is_subscribed ?? false,
          guardianConsentStatus: profile?.guardian_consent_status ?? null,
          isLoggedIn: true,
          userNickname: profile?.display_name || fallbackNickname,
          storedAccounts,
        })
        await syncViewerAccountGroup()
        await syncLinkedStoredAccounts(user.id, storedAccounts)
      } else {
        set({
          user: null,
          profile: null,
          isLoading: false,
          isAdultVerified: false,
          isSubscribed: false,
          guardianConsentStatus: null,
          isLoggedIn: false,
          userNickname: 'Guest',
          storedAccounts: readStoredAccounts(),
        })
      }
    })().finally(() => {
      sessionCheckPromise = null
    })

    return sessionCheckPromise
  },

  refreshStoredAccounts: () => {
    set({ storedAccounts: readStoredAccounts() })
  },

  switchAccount: async (userId: string) => {
    const previousUserId = useAuthStore.getState().user?.id ?? null
    const account = readStoredAccounts().find((storedAccount) => storedAccount.userId === userId)

    if (!account) {
      throw new Error('저장된 계정을 찾지 못했습니다.')
    }

    const supabase = createClient()
    const { error } = await supabase.auth.setSession({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    })

    if (error) {
      const storedAccounts = forgetStoredAccount(userId)
      set({ storedAccounts })
      throw new Error('계정 세션이 만료되었습니다. 다시 로그인해 주세요.')
    }

    sessionCheckPromise = null
    await useAuthStore.getState().checkSession()
    await recordViewerAccountSwitch(previousUserId, userId)
  },

  forgetAccount: async (userId: string) => {
    const storedAccounts = forgetStoredAccount(userId)
    set({ storedAccounts })
  },

  signOut: async () => {
    const supabase = createClient()
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      cache: 'no-store',
    }).catch(() => null)
    await supabase.auth.signOut()
    set({
      user: null,
      profile: null,
      isAdultVerified: false,
      isSubscribed: false,
      guardianConsentStatus: null,
      isLoggedIn: false,
      userNickname: 'Guest',
      storedAccounts: readStoredAccounts(),
    })
  }
}))
