import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables.')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const CHANNEL_ID = '11111111-1111-4111-8111-111111111111'
const EPISODE_IDS = {
  ep1: '11111111-1111-4111-8111-111111111101',
  ep2: '11111111-1111-4111-8111-111111111102',
  ep3: '11111111-1111-4111-8111-111111111103',
  ep4: '11111111-1111-4111-8111-111111111104',
}
const CREATOR_EMAIL = 'creator-night-market@inderverse.local'
const CREATOR_PASSWORD = 'NightMarket!123'

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

async function getOrCreateCreator() {
  const existing = await getUserByEmail(CREATOR_EMAIL)

  if (existing) {
    return existing
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: CREATOR_EMAIL,
    password: CREATOR_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: '하은',
    },
  })

  if (error || !data.user) {
    throw error ?? new Error('Failed to create creator user.')
  }

  return data.user
}

async function main() {
  const creator = await getOrCreateCreator()

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      display_name: '하은',
      role: 'creator',
    })
    .eq('id', creator.id)

  if (profileError) {
    throw profileError
  }

  const { error: channelError } = await admin
    .from('channels')
    .upsert(
      {
        id: CHANNEL_ID,
        creator_id: creator.id,
        title: '월광 아래의 시장',
        description: '로컬 구매/기다무 검증용 채널',
        cover_image_url:
          'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80',
        is_adult_only: false,
        status: 'publishing',
        serialization_days: [1, 4],
        wait_free_hours: 24,
      },
      { onConflict: 'id' }
    )

  if (channelError) {
    throw channelError
  }

  const publishedAt = new Date().toISOString()
  const { error: episodesError } = await admin
    .from('episodes')
    .upsert(
      [
        {
          id: EPISODE_IDS.ep1,
          channel_id: CHANNEL_ID,
          episode_number: 1,
          title: '1화. 불이 켜지는 골목',
          pricing_type: 'free',
          coin_price: 0,
          is_adult_only: false,
          published_at: publishedAt,
          status: 'published',
        },
        {
          id: EPISODE_IDS.ep2,
          channel_id: CHANNEL_ID,
          episode_number: 2,
          title: '2화. 잊힌 소원의 값',
          pricing_type: 'paid',
          coin_price: 7,
          is_adult_only: false,
          published_at: publishedAt,
          status: 'published',
        },
        {
          id: EPISODE_IDS.ep3,
          channel_id: CHANNEL_ID,
          episode_number: 3,
          title: '3화. 새벽의 거래자',
          pricing_type: 'wait_free',
          coin_price: 7,
          is_adult_only: false,
          published_at: publishedAt,
          status: 'published',
        },
        {
          id: EPISODE_IDS.ep4,
          channel_id: CHANNEL_ID,
          episode_number: 4,
          title: '4화. 닫히지 않는 문',
          pricing_type: 'free',
          coin_price: 0,
          is_adult_only: false,
          status: 'draft',
        },
      ],
      { onConflict: 'id' }
    )

  if (episodesError) {
    throw episodesError
  }

  console.log(
    JSON.stringify(
      {
        creatorEmail: CREATOR_EMAIL,
        channelId: CHANNEL_ID,
        episodeIds: EPISODE_IDS,
      },
      null,
      2
    )
  )
}

await main()
