'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { PUBLIC_CACHE_TAGS } from '@/lib/public-cache'
import { ensureDefaultCreatorChannel } from '@/lib/server/creator-channels'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import type { CreatorChannelExternalLink } from '@/lib/work'

export type CreatorChannelSettingsState = {
  error: string | null
  success: string | null
}

export type CancelCreatorRegistrationState = {
  error: string | null
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key)
  return value.length > 0 ? value : null
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

function parseExternalLinks(formData: FormData) {
  const links: CreatorChannelExternalLink[] = []

  for (let index = 1; index <= 3; index += 1) {
    const label = readText(formData, `linkLabel${index}`)
    const url = readText(formData, `linkUrl${index}`)

    if (!label && !url) {
      continue
    }

    if (!label || !url) {
      throw new Error('외부 링크는 이름과 주소를 함께 입력해야 합니다.')
    }

    let parsedUrl: URL

    try {
      parsedUrl = new URL(url)
    } catch {
      throw new Error('외부 링크 주소 형식이 올바르지 않습니다.')
    }

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('외부 링크는 http 또는 https 주소만 사용할 수 있습니다.')
    }

    links.push({
      label: label.slice(0, 24),
      url: parsedUrl.toString(),
    })
  }

  return links
}

function isCreatorChannelStatus(value: string): value is 'draft' | 'active' {
  return value === 'draft' || value === 'active'
}

export async function updateCreatorChannelSettings(
  _prevState: CreatorChannelSettingsState,
  formData: FormData
): Promise<CreatorChannelSettingsState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio/creator-channel')
  }

  try {
    const creatorChannel = await ensureDefaultCreatorChannel(user.id)
    const displayName = readText(formData, 'displayName')
    const slug = normalizeSlug(readText(formData, 'slug'))
    const bio = readOptionalText(formData, 'bio')
    const avatarUrl = readOptionalText(formData, 'avatarUrl')
    const coverImageUrl = readOptionalText(formData, 'coverImageUrl')
    const statusValue = readText(formData, 'status') || 'active'
    const externalLinks = parseExternalLinks(formData)

    if (displayName.length < 2 || displayName.length > 30) {
      return { error: '작가명은 2자 이상 30자 이하로 입력해 주세요.', success: null }
    }

    if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(slug)) {
      return {
        error: '채널 주소는 영문 소문자, 숫자, 하이픈으로 3자 이상 입력해 주세요.',
        success: null,
      }
    }

    if (bio && bio.length > 240) {
      return { error: '소개 문구는 240자 이하로 입력해 주세요.', success: null }
    }

    if (!isCreatorChannelStatus(statusValue)) {
      return { error: '공개 상태 값이 올바르지 않습니다.', success: null }
    }

    const { error } = await supabase
      .from('creator_channels')
      .update({
        display_name: displayName,
        slug,
        bio,
        avatar_url: avatarUrl,
        cover_image_url: coverImageUrl,
        status: statusValue,
        external_links: externalLinks as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creatorChannel.id)
      .eq('owner_id', user.id)

    if (error) {
      if (error.code === '23505') {
        return { error: '이미 사용 중인 공개 주소입니다.', success: null }
      }

      console.error('Unable to update creator channel settings:', error)
      return { error: '공개 프로필 저장 중 문제가 발생했습니다.', success: null }
    }

    revalidatePath('/main/studio')
    revalidatePath('/main/studio/channels')
    revalidatePath('/main/studio/creator-channel')
    revalidateTag(PUBLIC_CACHE_TAGS.creators, 'max')
    revalidateTag(PUBLIC_CACHE_TAGS.navigation, 'max')

    return { error: null, success: '공개 프로필 설정을 저장했습니다.' }
  } catch (error) {
    if (error instanceof Error && error.message.includes('외부 링크')) {
      return { error: error.message, success: null }
    }

    console.error(error)
    return { error: '공개 프로필 정보를 확인하는 중 문제가 발생했습니다.', success: null }
  }
}

export async function cancelCreatorRegistration(
  _prevState: CancelCreatorRegistrationState,
  formData: FormData
): Promise<CancelCreatorRegistrationState> {
  const confirmation = readText(formData, 'confirmation')

  if (confirmation !== 'delete-bottega') {
    return { error: '작가 등록 취소 확인이 필요합니다.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio/creator-channel')
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { error: '계정 정보를 확인하는 중 문제가 발생했습니다.' }
  }

  if (profile?.role === 'admin') {
    return { error: '관리자 계정은 이 화면에서 작가 등록을 취소할 수 없습니다.' }
  }

  const { data: channels, error: channelListError } = await admin
    .from('channels')
    .select('id')
    .eq('creator_id', user.id)

  if (channelListError) {
    return { error: 'Bottega 작업물을 확인하는 중 문제가 발생했습니다.' }
  }

  const channelIds = (channels ?? []).map((channel) => channel.id)

  if (channelIds.length > 0) {
    const { error: saveDeleteError } = await admin
      .from('artwork_saves')
      .delete()
      .in('artwork_id', channelIds)

    if (saveDeleteError) {
      return { error: '작업물 저장 기록을 정리하는 중 문제가 발생했습니다.' }
    }

    const { error: channelDeleteError } = await admin
      .from('channels')
      .delete()
      .eq('creator_id', user.id)

    if (channelDeleteError) {
      return { error: 'Bottega 작업물을 삭제하는 중 문제가 발생했습니다.' }
    }
  }

  const { error: creatorChannelDeleteError } = await admin
    .from('creator_channels')
    .delete()
    .eq('owner_id', user.id)

  if (creatorChannelDeleteError) {
    return { error: 'Bottega 공개 프로필을 삭제하는 중 문제가 발생했습니다.' }
  }

  const { error: agreementDeleteError } = await admin
    .from('creator_agreement_consents')
    .delete()
    .eq('user_id', user.id)

  if (agreementDeleteError) {
    return { error: '작가 등록 동의 기록을 정리하는 중 문제가 발생했습니다.' }
  }

  const { error: revenueSettingsDeleteError } = await admin
    .from('creator_revenue_settings')
    .delete()
    .eq('creator_id', user.id)

  if (revenueSettingsDeleteError) {
    return { error: '작가 정산 설정을 정리하는 중 문제가 발생했습니다.' }
  }

  const { error: roleUpdateError } = await admin
    .from('profiles')
    .update({ role: 'reader' })
    .eq('id', user.id)

  if (roleUpdateError) {
    return { error: '계정을 일반 사용자로 되돌리는 중 문제가 발생했습니다.' }
  }

  revalidatePath('/main')
  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  revalidatePath('/main/studio/creator-channel')
  revalidateTag(PUBLIC_CACHE_TAGS.artworks, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.creators, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.navigation, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.sparks, 'max')

  redirect('/main')
}
