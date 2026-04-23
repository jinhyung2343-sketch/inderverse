import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// This client uses the service_role key to bypass RLS.
// It MUST NEVER be used in the browser or exposed to the client.
// It is intended for server-side logic only (e.g. within API routes or background jobs).
export const createAdminClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
