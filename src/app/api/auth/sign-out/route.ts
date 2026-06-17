import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function isSupabaseCookie(name: string) {
  return name.startsWith('sb-')
}

export async function POST() {
  const supabase = await createClient()

  await supabase.auth.signOut()
  const cookieStore = await cookies()

  cookieStore
    .getAll()
    .filter((cookie) => isSupabaseCookie(cookie.name))
    .forEach((cookie) => {
      cookieStore.delete(cookie.name)
    })

  return NextResponse.json({ ok: true })
}
