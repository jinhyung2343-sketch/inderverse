import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

await import('./setup-night-market-test.mjs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables.')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const appBaseUrl = 'http://127.0.0.1:3000'
const READER_EMAIL = 'reader-night-market@inderverse.local'
const READER_PASSWORD = 'ReaderNight!123'
const CHANNEL_ID = '11111111-1111-4111-8111-111111111111'
const EPISODE_IDS = {
  ep2: '11111111-1111-4111-8111-111111111102',
  ep3: '11111111-1111-4111-8111-111111111103',
}

async function getUserByEmail(email) {
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw error
    }

    const user = data.users.find((item) => item.email === email)

    if (user) {
      return user
    }

    if (data.users.length < 200) {
      return null
    }

    page += 1
  }
}

async function getOrCreateReader() {
  const existing = await getUserByEmail(READER_EMAIL)

  if (existing) {
    return existing
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: READER_EMAIL,
    password: READER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: '실반영테스터',
    },
  })

  if (error || !data.user) {
    throw error ?? new Error('Failed to create reader user.')
  }

  return data.user
}

function createCookieBackedClient() {
  const cookieJar = new Map()

  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return Array.from(cookieJar.entries()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          cookieJar.set(name, value)
        }
      },
    },
  })

  return {
    client,
    cookieJar,
  }
}

function toCookieHeader(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('; ')
}

async function resetReaderState(readerId) {
  await admin.from('wait_free_unlocks').delete().eq('user_id', readerId).eq('channel_id', CHANNEL_ID)
  await admin.from('purchases').delete().eq('user_id', readerId).in('episode_id', [EPISODE_IDS.ep2, EPISODE_IDS.ep3])

  const { error: walletError } = await admin
    .from('coin_wallets')
    .update({
      paid_balance: 0,
      free_balance: 0,
    })
    .eq('user_id', readerId)

  if (walletError) {
    throw walletError
  }
}

async function chargeReader(readerId, amount) {
  const { error } = await admin.rpc('charge_coins', {
    p_user_id: readerId,
    p_amount: amount,
    p_payment_provider: 'local-test',
    p_idempotency_key: `verify-night-market-${amount}-${Date.now()}`,
  })

  if (error) {
    throw error
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const payload = await response.json()

  return {
    status: response.status,
    ok: response.ok,
    payload,
  }
}

async function main() {
  const reader = await getOrCreateReader()

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      display_name: '실반영테스터',
      role: 'reader',
    })
    .eq('id', reader.id)

  if (profileError) {
    throw profileError
  }

  await resetReaderState(reader.id)
  await chargeReader(reader.id, 30)

  const { client, cookieJar } = createCookieBackedClient()
  const { error: signInError } = await client.auth.signInWithPassword({
    email: READER_EMAIL,
    password: READER_PASSWORD,
  })

  if (signInError) {
    throw signInError
  }

  const cookieHeader = toCookieHeader(cookieJar)

  const purchase = await fetchJson(`${appBaseUrl}/api/coins/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      channelId: CHANNEL_ID,
      episodeNumber: 2,
    }),
  })

  const waitFree = await fetchJson(`${appBaseUrl}/api/coins/wait-free`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      channelId: CHANNEL_ID,
      episodeNumber: 3,
    }),
  })

  const { data: purchases, error: purchasesError } = await admin
    .from('purchases')
    .select('episode_id, coin_amount, paid_coin_used, free_coin_used')
    .eq('user_id', reader.id)
    .eq('episode_id', EPISODE_IDS.ep2)

  if (purchasesError) {
    throw purchasesError
  }

  const { data: waitFreeUnlocks, error: waitFreeError } = await admin
    .from('wait_free_unlocks')
    .select('episode_id, channel_id, next_unlock_available_at')
    .eq('user_id', reader.id)
    .eq('episode_id', EPISODE_IDS.ep3)

  if (waitFreeError) {
    throw waitFreeError
  }

  const { data: wallet, error: walletError } = await admin
    .from('coin_wallets')
    .select('paid_balance, free_balance')
    .eq('user_id', reader.id)
    .single()

  if (walletError) {
    throw walletError
  }

  console.log(
    JSON.stringify(
      {
        readerEmail: READER_EMAIL,
        purchase,
        waitFree,
        purchases,
        waitFreeUnlocks,
        wallet,
      },
      null,
      2
    )
  )
}

await main()
