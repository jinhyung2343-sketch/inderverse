export const STAGING_AUTH_EMAIL_TAG = 'inderverse-staging'

export function getStagingAuthEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const separatorIndex = normalizedEmail.lastIndexOf('@')

  if (separatorIndex <= 0 || separatorIndex === normalizedEmail.length - 1) {
    return normalizedEmail
  }

  const localPart = normalizedEmail.slice(0, separatorIndex)
  const domain = normalizedEmail.slice(separatorIndex + 1)
  const stagingSuffix = `+${STAGING_AUTH_EMAIL_TAG}`

  if (localPart.endsWith(stagingSuffix)) {
    return normalizedEmail
  }

  return `${localPart}${stagingSuffix}@${domain}`
}

export function isStagingAuthEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase()

  if (!normalizedEmail) {
    return false
  }

  return getStagingAuthEmail(normalizedEmail) === normalizedEmail
}
