import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdultVerified: boolean;
  // 프로토타입용 mock 상태
  isLoggedIn: boolean;
  userNickname: string;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
  mockSignUp: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAdultVerified: false,
  isLoggedIn: false,
  userNickname: 'Guest',
  
  checkSession: async () => {
    set({ isLoading: true })
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (user && !error) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const fallbackNickname =
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        '유저'

      set({
        user,
        profile,
        isLoading: false,
        isAdultVerified: profile?.is_adult_verified ?? false,
        isLoggedIn: true,
        userNickname: profile?.display_name || fallbackNickname,
      })
    } else {
      set({
        user: null,
        profile: null,
        isLoading: false,
        isAdultVerified: false,
        isLoggedIn: false,
        userNickname: 'Guest',
      })
    }
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, profile: null, isAdultVerified: false, isLoggedIn: false, userNickname: 'Guest' })
  },

  // 프로토타입 가입용 모의 액션
  mockSignUp: () => {
    set({ isLoggedIn: true, isAdultVerified: false, userNickname: '유저님' })
  }
}))
