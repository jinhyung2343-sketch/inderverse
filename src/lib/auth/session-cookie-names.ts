type CookieLike = {
  name: string
}

export function isSupabaseAuthCookieName(name: string) {
  return name.startsWith('sb-') || name.includes('supabase.auth.token')
}

export function collectSupabaseAuthCookieNames(cookiesToInspect: CookieLike[]) {
  return Array.from(
    new Set(
      cookiesToInspect
        .map((cookie) => cookie.name)
        .filter((name) => isSupabaseAuthCookieName(name))
    )
  )
}
