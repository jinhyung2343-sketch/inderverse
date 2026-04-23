import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null;
  profile: any | null; // 구체적 프로필 정보 확장 가능
  isLoading: boolean;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  
  checkSession: async () => {
    set({ isLoading: true })
    const supabase = createClient()
    // getSession() 대신 getUser()를 사용: 서버 측 JWT 유효성 검증 (보안)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && !error) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      set({ user, profile, isLoading: false })
    } else {
      set({ user: null, profile: null, isLoading: false })
    }
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  }
}))
