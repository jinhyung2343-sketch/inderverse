const FALLBACK_PUBLIC_SUPABASE_ENV = {
  // Supabase URL and anon key are public client configuration. Service-role keys stay server-only.
  url: 'https://whkggxcoicvscrsujnky.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indoa2dneGNvaWN2c2Nyc3Vqbmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODk3OTksImV4cCI6MjA5MzQ2NTc5OX0.7zQT_OVBHkq_yJVznErVBkFGu_es0x7Z_1uw1dso-pI',
} as const

export function requirePublicEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value =
    name === 'NEXT_PUBLIC_SUPABASE_URL'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (value) {
    return value
  }

  return name === 'NEXT_PUBLIC_SUPABASE_URL'
    ? FALLBACK_PUBLIC_SUPABASE_ENV.url
    : FALLBACK_PUBLIC_SUPABASE_ENV.anonKey
}

export function getPublicSupabaseEnv() {
  return {
    url: requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requirePublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}
