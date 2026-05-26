const HANGUL_SYLLABLE_START = 0xac00
const HANGUL_SYLLABLE_END = 0xd7a3
const HANGUL_INITIAL_UNIT = 588
const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const
const COMPAT_CHOSEONG = new Set<string>(CHOSEONG)

function normalizeSearchText(value: string) {
  return value.normalize('NFC').trim().toLowerCase()
}

function compactSearchText(value: string) {
  return value.replace(/\s+/g, '')
}

export function getHangulInitials(value: string) {
  return Array.from(normalizeSearchText(value))
    .map((character) => {
      const codePoint = character.codePointAt(0)

      if (!codePoint) {
        return ''
      }

      if (codePoint >= HANGUL_SYLLABLE_START && codePoint <= HANGUL_SYLLABLE_END) {
        const initialIndex = Math.floor((codePoint - HANGUL_SYLLABLE_START) / HANGUL_INITIAL_UNIT)
        return CHOSEONG[initialIndex] ?? ''
      }

      if (COMPAT_CHOSEONG.has(character)) {
        return character
      }

      return /[a-z0-9]/.test(character) ? character : ' '
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesSearchQuery(query: string, values: Array<string | null | undefined>) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return true
  }

  const queryInitials = getHangulInitials(normalizedQuery)
  const queryCandidates = Array.from(
    new Set([
      normalizedQuery,
      compactSearchText(normalizedQuery),
      queryInitials,
      compactSearchText(queryInitials),
    ].filter(Boolean))
  )

  return values.some((value) => {
    if (!value) {
      return false
    }

    const normalizedValue = normalizeSearchText(value)
    const valueInitials = getHangulInitials(normalizedValue)
    const valueCandidates = [
      normalizedValue,
      compactSearchText(normalizedValue),
      valueInitials,
      compactSearchText(valueInitials),
    ]

    return queryCandidates.some((candidate) =>
      valueCandidates.some((target) => target.includes(candidate))
    )
  })
}
