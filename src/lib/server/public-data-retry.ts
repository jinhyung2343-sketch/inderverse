import 'server-only'

const PUBLIC_DATA_RETRY_DELAYS_MS = [500, 1500, 3000]

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function withPublicDataRetry<T extends { error: unknown | null }>(
  operation: () => PromiseLike<T>,
  isRecoverable: (error: unknown) => boolean
) {
  let result = await operation()

  for (const delayMs of PUBLIC_DATA_RETRY_DELAYS_MS) {
    if (!result.error || !isRecoverable(result.error)) {
      return result
    }

    await wait(delayMs)
    result = await operation()
  }

  return result
}
