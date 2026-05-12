import { ResetPasswordPageClient } from '@/components/auth/ResetPasswordPageClient'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return <ResetPasswordPageClient nextPath={params.next ?? null} />
}
