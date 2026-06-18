export function readDisplayName(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getEmailLocalPart(email: string | null | undefined) {
  return email?.split('@')[0]?.trim() ?? ''
}

export function displayNameLooksLikeFallback({
  displayName,
  email,
}: {
  displayName: string
  email: string | null | undefined
}) {
  const emailLocalPart = getEmailLocalPart(email)

  return (
    !displayName ||
    displayName === '유저' ||
    displayName === email ||
    displayName === emailLocalPart
  )
}

export function resolveStoredDisplayName({
  email,
  metadataDisplayName,
  profileDisplayName,
  fallback = '유저',
}: {
  email: string | null | undefined
  metadataDisplayName: unknown
  profileDisplayName: unknown
  fallback?: string
}) {
  const normalizedMetadataDisplayName = readDisplayName(metadataDisplayName)
  const normalizedProfileDisplayName = readDisplayName(profileDisplayName)
  const emailLocalPart = getEmailLocalPart(email)

  if (
    normalizedMetadataDisplayName &&
    displayNameLooksLikeFallback({
      displayName: normalizedProfileDisplayName,
      email,
    })
  ) {
    return normalizedMetadataDisplayName
  }

  return (
    normalizedProfileDisplayName ||
    normalizedMetadataDisplayName ||
    emailLocalPart ||
    fallback
  )
}
