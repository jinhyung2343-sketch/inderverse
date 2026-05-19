'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateCreatorChannelSettings } from '@/app/main/studio/creator-channel/actions'
import { CreatorChannelImageField } from '@/components/studio/CreatorChannelImageField'
import type { CreatorChannelRecord } from '@/lib/work'

const initialState = {
  error: null,
  success: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '저장 중...' : '공개 프로필 저장'}
    </button>
  )
}

export function CreatorChannelSettingsForm({
  channel,
}: {
  channel: CreatorChannelRecord
}) {
  const [state, formAction] = useActionState(updateCreatorChannelSettings, initialState)
  const links = channel.externalLinks

  return (
    <form action={formAction} className="grid gap-6">
      <section className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Bottega Profile</p>
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">공개 프로필 편집</h2>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
            My Bottega 바깥에서 독자에게 보이는 작가명, 소개, 대표 이미지, 외부 링크와 공개 상태를 관리합니다.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">기본 정보</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>작가명</span>
                <input
                  name="displayName"
                  required
                  minLength={2}
                  maxLength={30}
                  defaultValue={channel.displayName}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="독자에게 보일 작가명"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>공개 주소</span>
                <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 md:grid-cols-[auto_1fr] md:items-center">
                  <span className="text-sm text-zinc-500">/creator/</span>
                  <input
                    name="slug"
                    required
                    minLength={3}
                    maxLength={63}
                    pattern="[a-z0-9][a-z0-9-]{2,62}"
                    defaultValue={channel.slug}
                    className="bg-transparent text-white outline-none"
                    placeholder="creator-name"
                  />
                </div>
                <span className="text-xs leading-5 text-zinc-500">영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.</span>
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>소개</span>
                <textarea
                  name="bio"
                  rows={6}
                  maxLength={240}
                  defaultValue={channel.bio ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="작가의 세계관, 창작 방향, 독자에게 전하고 싶은 소개를 적어주세요."
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>공개 상태</span>
                <select
                  name="status"
                  defaultValue={channel.status === 'suspended' ? 'draft' : channel.status}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  <option value="active">공개</option>
                  <option value="draft">비공개</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">외부 링크</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              포트폴리오, SNS, 음원 페이지처럼 작가 활동을 보여줄 링크를 최대 3개까지 연결합니다.
            </p>
            <div className="mt-5 grid gap-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 md:grid-cols-[0.7fr_1.3fr]">
                  <input
                    name={`linkLabel${index + 1}`}
                    defaultValue={links[index]?.label ?? ''}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    placeholder="링크 이름"
                  />
                  <input
                    name={`linkUrl${index + 1}`}
                    defaultValue={links[index]?.url ?? ''}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    placeholder="https://"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">프로필 이미지</h2>
            <div className="mt-5">
              <CreatorChannelImageField
                creatorChannelId={channel.id}
                imageRole="avatar"
                inputName="avatarUrl"
                initialValue={channel.avatarUrl}
                label="작가 프로필 이미지"
                description="정사각형 이미지가 가장 안정적으로 보입니다."
                previewClassName="mx-auto aspect-square h-32 rounded-full object-cover"
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">채널 커버</h2>
            <div className="mt-5">
              <CreatorChannelImageField
                creatorChannelId={channel.id}
                imageRole="cover"
                inputName="coverImageUrl"
                initialValue={channel.coverImageUrl}
                label="공개 프로필 커버 이미지"
                description="가로형 이미지를 올리면 공개 프로필 상단에 쓰기 좋습니다."
                previewClassName="h-40 w-full rounded-xl object-cover"
              />
            </div>
          </div>

          {state.error ? (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {state.success}
            </p>
          ) : null}

          <div className="rounded-lg border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
            공개 상태를 비공개로 전환하면 독자용 작가 페이지에서 노출되지 않습니다.
          </div>

          <SubmitButton />
        </div>
      </section>
    </form>
  )
}
