import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { getPublicSupabaseEnv } from '@/lib/env/public'
import { requireSupabaseServiceRoleKey } from '@/lib/env/server'
import { Database } from './types'

// This client uses the service_role key to bypass RLS.
// It MUST NEVER be used in the browser or exposed to the client.
// It is intended for server-side logic only (e.g. within API routes or background jobs).
export const createAdminClient = () => {
  const { url } = getPublicSupabaseEnv()
  const serviceRoleKey = requireSupabaseServiceRoleKey()

  return createClient<Database>(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
