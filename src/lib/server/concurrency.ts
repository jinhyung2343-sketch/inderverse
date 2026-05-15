import 'server-only'

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const boundedConcurrency = Math.min(Math.max(Math.trunc(concurrency) || 1, 1), items.length || 1)
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex] as T, currentIndex)
    }
  }

  await Promise.all(Array.from({ length: boundedConcurrency }, () => worker()))

  return results
}
