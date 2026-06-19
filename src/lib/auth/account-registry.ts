import type { Session, User } from '@supabase/supabase-js'
import { resolveStoredDisplayName } from '@/lib/auth/display-name'
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

const ACCOUNT_REGISTRY_KEY_PREFIX = 'inderverse:account-registry:v2'
const MAX_STORED_ACCOUNTS = 6
const LOCAL_ACCOUNT_SESSION_STORAGE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNT_SESSION_STORAGE === 'true'

function getAccountRegistryKey() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'default'

  return `${ACCOUNT_REGISTRY_KEY_PREFIX}:${supabaseUrl}`
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function clearStoredAccounts() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(getAccountRegistryKey())
}

function isAccountExpired(account: StoredInderverseAccount) {
  return typeof account.expiresAt === 'number' && account.expiresAt <= Math.floor(Date.now() / 1000)
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

  if (!LOCAL_ACCOUNT_SESSION_STORAGE_ENABLED) {
    clearStoredAccounts()
    return []
  }

  const rawValue = window.localStorage.getItem(getAccountRegistryKey())

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown

    if (!Array.isArray(parsedValue)) {
      return []
    }

    const accounts = parsedValue.flatMap((value) => {
      const account = normalizeAccount(value)
      return account && !isAccountExpired(account) ? [account] : []
    })

    if (accounts.length !== parsedValue.length) {
      writeStoredAccounts(accounts)
    }

    return accounts
  } catch {
    return []
  }
}

function writeStoredAccounts(accounts: StoredInderverseAccount[]) {
  if (!canUseStorage()) {
    return
  }

  if (!LOCAL_ACCOUNT_SESSION_STORAGE_ENABLED) {
    clearStoredAccounts()
    return
  }

  window.localStorage.setItem(
    getAccountRegistryKey(),
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
  if (!LOCAL_ACCOUNT_SESSION_STORAGE_ENABLED) {
    clearStoredAccounts()
    return []
  }

  const email = user.email?.trim().toLowerCase()

  if (!email || !session.access_token || !session.refresh_token) {
    return readStoredAccounts()
  }

  const displayName = resolveStoredDisplayName({
    email,
    metadataDisplayName: user.user_metadata?.display_name,
    profileDisplayName: profile?.display_name,
  })
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
