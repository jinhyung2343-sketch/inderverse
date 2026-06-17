import { createClient } from '@/lib/supabase/client'

function isSupabaseSessionStorageKey(key: string) {
  return key.startsWith('sb-') || key.includes('supabase.auth.token')
}

function clearStorageKeys(storage: Storage | undefined) {
  if (typeof window === 'undefined' || !storage) {
    return
  }

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)

    if (key && isSupabaseSessionStorageKey(key)) {
      storage.removeItem(key)
    }
  }
}

export async function getCurrentAccessToken() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.access_token ?? null
}

export function clearBrowserAuthStorage() {
  if (typeof window === 'undefined') {
    return
  }

  clearStorageKeys(window.localStorage)
  clearStorageKeys(window.sessionStorage)
}
