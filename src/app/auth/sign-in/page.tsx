import { SignInPageClient } from '@/components/auth/SignInPageClient'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return <SignInPageClient nextPath={params.next ?? null} />
}
