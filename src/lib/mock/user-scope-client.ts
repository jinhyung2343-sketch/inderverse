'use client'

export const GUEST_SCOPE = 'guest'

export function getUserScope(userId?: string | null) {
  return userId ?? GUEST_SCOPE
}

export function getScopedStorageKey(baseKey: string, scope: string) {
  return `${baseKey}:${scope}`
}
