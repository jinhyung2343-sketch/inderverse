import { ForgotPasswordPageClient } from '@/components/auth/ForgotPasswordPageClient'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return <ForgotPasswordPageClient nextPath={params.next ?? null} />
}
