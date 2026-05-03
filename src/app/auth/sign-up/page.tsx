import { SignUpPageClient } from '@/components/auth/SignUpPageClient'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return <SignUpPageClient nextPath={params.next ?? null} />
}
