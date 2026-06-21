import { JoinPromptPageClient } from '@/components/auth/JoinPromptPageClient'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function JoinPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; force?: string }>
}) {
  const params = await searchParams
  const nextPath = sanitizeInternalPath(params.next, '/main')
  const shouldForceJoinPrompt = params.force === '1'

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    return <JoinPromptPageClient nextPath={nextPath} initialAuth={null} />
  }

  if (!shouldForceJoinPrompt) {
    redirect(nextPath)
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
      nextPath={nextPath}
      initialAuth={{
        isLoggedIn: true,
        userNickname: profile?.display_name || fallbackNickname,
      }}
    />
  )
}
