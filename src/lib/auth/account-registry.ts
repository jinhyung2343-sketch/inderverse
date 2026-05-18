import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type AccountProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'display_name' | 'role'
> | null

export type StoredInderverseAccount = {
  userId: string
  email: string
  displayName: string
  role: Database['public']['Tables']['profiles']['Row']['role'] | 'reader'
  accessToken: string
  refreshToken: string
  expiresAt: number | null
  updatedAt: string
}

const ACCOUNT_REGISTRY_KEY = 'inderverse:account-registry:v1'
const MAX_STORED_ACCOUNTS = 6

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeAccount(value: unknown): StoredInderverseAccount | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const account = value as Partial<StoredInderverseAccount>

  if (
    typeof account.userId !== 'string' ||
    typeof account.email !== 'string' ||
    typeof account.displayName !== 'string' ||
    typeof account.accessToken !== 'string' ||
    typeof account.refreshToken !== 'string' ||
    typeof account.updatedAt !== 'string'
  ) {
    return null
  }

  return {
    userId: account.userId,
    email: account.email,
    displayName: account.displayName,
    role: account.role ?? 'reader',
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    expiresAt: typeof account.expiresAt === 'number' ? account.expiresAt : null,
    updatedAt: account.updatedAt,
  }
}

export function readStoredAccounts(): StoredInderverseAccount[] {
  if (!canUseStorage()) {
    return []
  }

  const rawValue = window.localStorage.getItem(ACCOUNT_REGISTRY_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.flatMap((value) => {
      const account = normalizeAccount(value)
      return account ? [account] : []
    })
  } catch {
    return []
  }
}

function writeStoredAccounts(accounts: StoredInderverseAccount[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    ACCOUNT_REGISTRY_KEY,
    JSON.stringify(accounts.slice(0, MAX_STORED_ACCOUNTS))
  )
}

export function rememberAccountSession({
  profile,
  session,
  user,
}: {
  profile: AccountProfile
  session: Session
  user: User
}) {
  const email = user.email?.trim().toLowerCase()

  if (!email || !session.access_token || !session.refresh_token) {
    return readStoredAccounts()
  }

  const displayName =
    profile?.display_name ||
    (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
    email.split('@')[0] ||
    '유저'
  const account: StoredInderverseAccount = {
    userId: user.id,
    email,
    displayName,
    role: profile?.role ?? 'reader',
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
    updatedAt: new Date().toISOString(),
  }
  const accounts = readStoredAccounts()
  const nextAccounts = [
    account,
    ...accounts.filter((storedAccount) => storedAccount.userId !== account.userId),
  ]

  writeStoredAccounts(nextAccounts)
  return nextAccounts.slice(0, MAX_STORED_ACCOUNTS)
}

export function forgetStoredAccount(userId: string) {
  const nextAccounts = readStoredAccounts().filter((account) => account.userId !== userId)
  writeStoredAccounts(nextAccounts)
  return nextAccounts
}
