import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseEnv } from '@/lib/env/public'
import { Database } from './types'

export function createClient() {
  const { url, anonKey } = getPublicSupabaseEnv()

  return createBrowserClient<Database>(url, anonKey)
}
