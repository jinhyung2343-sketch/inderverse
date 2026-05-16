import { VerifyEmailPageClient } from '@/components/auth/VerifyEmailPageClient'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <VerifyEmailPageClient
      email={params.email ?? null}
      nextPath={params.next ?? null}
      authError={params.error ?? null}
    />
  )
}
