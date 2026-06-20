export function requirePublicEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value =
    name === 'NEXT_PUBLIC_SUPABASE_URL'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (value) {
    return value
  }

  throw new Error(`${name} 환경 변수가 필요합니다.`)
}

export function getPublicSupabaseEnv() {
  return {
    url: requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requirePublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}
