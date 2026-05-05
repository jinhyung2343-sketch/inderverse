'use client'

import { useId, useRef, useState } from 'react'

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

function toFileArray(fileList: FileList | null) {
  return fileList ? Array.from(fileList) : []
}

function openFilePicker(input: HTMLInputElement | null) {
  if (!input) {
    return
  }

  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }

  input.click()
}

export function FilePickerButton({
  label,
  disabled = false,
  isUploading = false,
  inputName,
  preserveSelection = false,
  onFilesSelected,
}: {
  label: string
  disabled?: boolean
  isUploading?: boolean
  inputName?: string
  preserveSelection?: boolean
  onFilesSelected: (files: File[]) => void | Promise<void>
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = toFileArray(event.target.files)

    if (files.length > 0) {
      void onFilesSelected(files)
    }

    if (!preserveSelection) {
      event.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        name={inputName}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="sr-only"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => openFilePicker(inputRef.current)}
        className={`relative inline-flex w-fit overflow-hidden rounded-full px-4 py-2 text-sm transition ${
          disabled
            ? 'cursor-not-allowed border border-white/10 bg-black/30 text-zinc-600'
            : 'cursor-pointer border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
        }`}
        disabled={disabled || isUploading}
      >
        <span>{isUploading ? '업로드 중...' : label}</span>
      </button>
    </>
  )
}

export function ImageUploadDropzone({
  title,
  description,
  disabled = false,
  multiple = false,
  isUploading = false,
  buttonLabel = '이미지 선택',
  inputName,
  preserveSelection = false,
  onFilesSelected,
}: {
  title: string
  description: string
  disabled?: boolean
  multiple?: boolean
  isUploading?: boolean
  buttonLabel?: string
  inputName?: string
  preserveSelection?: boolean
  onFilesSelected: (files: File[]) => void | Promise<void>
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  function submitFiles(files: File[]) {
    if (disabled || files.length === 0) {
      return
    }

    void onFilesSelected(files)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    submitFiles(toFileArray(event.target.files))

    if (!preserveSelection) {
      event.target.value = ''
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()

    if (!disabled) {
      setIsDragActive(true)
    }
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
    submitFiles(toFileArray(event.dataTransfer.files))
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-3xl border p-5 transition ${
        disabled
          ? 'border-white/10 bg-black/20 opacity-70'
          : isDragActive
            ? 'border-emerald-300/60 bg-emerald-500/10'
            : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      <input
        ref={inputRef}
        id={inputId}
        name={inputName}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="sr-only"
        tabIndex={-1}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs leading-5 text-zinc-500">{description}</p>
          <p className="text-xs leading-5 text-zinc-600">
            기기 파일, 사진첩, 파일 앱, 연결된 클라우드 저장소에서 이미지를 선택할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openFilePicker(inputRef.current)}
          className={`relative inline-flex w-fit overflow-hidden rounded-full px-4 py-2 text-sm transition ${
            disabled
              ? 'cursor-not-allowed border border-white/10 bg-black/30 text-zinc-600'
              : 'cursor-pointer border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
          }`}
          disabled={disabled || isUploading}
        >
          <span>{isUploading ? '업로드 중...' : buttonLabel}</span>
        </button>
      </div>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled && !isUploading) {
            openFilePicker(inputRef.current)
          }
        }}
        onKeyDown={(event) => {
          if (disabled || isUploading) {
            return
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openFilePicker(inputRef.current)
          }
        }}
        className={`relative mt-4 overflow-hidden rounded-2xl border border-dashed px-4 py-6 text-center text-sm leading-6 transition ${
          disabled
            ? 'border-white/10 bg-black/20 text-zinc-600'
            : isDragActive
              ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-100'
              : 'border-white/10 bg-black/10 text-zinc-400'
        }`}
      >
        {disabled
          ? '먼저 저장 가능한 상태를 만든 뒤 업로드를 시작할 수 있습니다.'
          : multiple
            ? '여러 이미지를 한 번에 끌어다 놓거나 선택해 바로 올릴 수 있습니다.'
            : '이미지를 끌어다 놓거나 선택 버튼으로 바로 올릴 수 있습니다.'}
      </div>
    </div>
  )
}
