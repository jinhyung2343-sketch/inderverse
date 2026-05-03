import { JoinPromptPageClient } from '@/components/auth/JoinPromptPageClient'

export default async function JoinPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return <JoinPromptPageClient nextPath={params.next ?? null} />
}
