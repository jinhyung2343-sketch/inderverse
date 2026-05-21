import { JoinPromptPageClient } from '@/components/auth/JoinPromptPageClient'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function JoinPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const hasAuthCookie = cookieStore
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('auth-token'))

  if (!hasAuthCookie) {
    return <JoinPromptPageClient nextPath={params.next ?? null} initialAuth={null} />
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    return <JoinPromptPageClient nextPath={params.next ?? null} initialAuth={null} />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()
  const fallbackNickname =
    (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
    user.email?.split('@')[0] ||
    '유저'

  return (
    <JoinPromptPageClient
      nextPath={params.next ?? null}
      initialAuth={{
        isLoggedIn: true,
        userNickname: profile?.display_name || fallbackNickname,
      }}
    />
  )
}
