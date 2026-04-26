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

const SOURCE_CHANNEL_ID = '11111111-1111-4111-8111-111111111111'

const sparkChannels = [
  {
    id: '22222222-2222-4222-8222-222222222221',
    title: '브리핑룸의 정적',
    description: '정치 브리핑의 공허한 언어를 한 컷으로 압축한 Spark 샘플 채널',
    cover_image_url:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    work_type: 'spark',
    spark_format: 'single_cut',
    spark_panel_count: 1,
    spark_caption: '말은 넘치는데 핵심은 늘 마이크 뒤에 숨는다.',
    spark_meta: {
      topic: '정치 풍자',
      tone: 'dry wit',
      layout: 'single-card',
    },
    tagName: '드라마',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: '캠페인 커피 4컷',
    description: '공약과 현실의 온도 차이를 4컷으로 비트는 Spark 샘플 채널',
    cover_image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    work_type: 'spark',
    spark_format: 'four_cut',
    spark_panel_count: 4,
    spark_caption: '약속은 뜨겁게 내려도, 식는 건 늘 가장 빠르다.',
    spark_meta: {
      topic: '사회 풍자',
      tone: 'witty',
      layout: 'four-panel',
    },
    tagName: '개그',
  },
]

async function main() {
  const { data: sourceChannel, error: sourceError } = await admin
    .from('channels')
    .select('creator_id')
    .eq('id', SOURCE_CHANNEL_ID)
    .single()

  if (sourceError || !sourceChannel) {
    throw sourceError ?? new Error('Source creator channel not found.')
  }

  const payload = sparkChannels.map((channel) => ({
    id: channel.id,
    creator_id: sourceChannel.creator_id,
    title: channel.title,
    description: channel.description,
    cover_image_url: channel.cover_image_url,
    is_adult_only: false,
    status: channel.status,
    serialization_days: [],
    wait_free_hours: 0,
    work_type: channel.work_type,
    spark_format: channel.spark_format,
    spark_panel_count: channel.spark_panel_count,
    spark_caption: channel.spark_caption,
    spark_meta: channel.spark_meta,
  }))

  const { data: upsertedChannels, error: upsertError } = await admin
    .from('channels')
    .upsert(payload, { onConflict: 'id' })
    .select('id, title, work_type, spark_format, spark_panel_count')

  if (upsertError) {
    throw upsertError
  }

  for (const channel of sparkChannels) {
    const { data: tag, error: tagError } = await admin
      .from('tags')
      .select('id')
      .eq('name', channel.tagName)
      .single()

    if (tagError || !tag) {
      throw tagError ?? new Error(`Tag not found: ${channel.tagName}`)
    }

    const { error: tagLinkError } = await admin
      .from('channel_tags')
      .upsert(
        {
          channel_id: channel.id,
          tag_id: tag.id,
        },
        { onConflict: 'channel_id,tag_id' }
      )

    if (tagLinkError) {
      throw tagLinkError
    }
  }

  console.log(
    JSON.stringify(
      {
        sparkChannels: upsertedChannels,
      },
      null,
      2
    )
  )
}

await main()
