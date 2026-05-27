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

function getHangulInitial(character: string) {
  const codePoint = character.codePointAt(0)

  if (!codePoint) {
    return ''
  }

  if (codePoint >= HANGUL_SYLLABLE_START && codePoint <= HANGUL_SYLLABLE_END) {
    const initialIndex = Math.floor((codePoint - HANGUL_SYLLABLE_START) / HANGUL_INITIAL_UNIT)
    return CHOSEONG[initialIndex] ?? ''
  }

  return COMPAT_CHOSEONG.has(character) ? character : ''
}

function isOnlyChoseong(value: string) {
  const characters = Array.from(value).filter((character) => character.trim().length > 0)
  return characters.length > 0 && characters.every((character) => COMPAT_CHOSEONG.has(character))
}

function matchesTrailingComposingInitial(query: string, target: string) {
  const queryCharacters = Array.from(query)
  const lastQueryCharacter = queryCharacters.at(-1)

  if (!lastQueryCharacter || !COMPAT_CHOSEONG.has(lastQueryCharacter) || queryCharacters.length < 2) {
    return false
  }

  const completedPrefix = queryCharacters.slice(0, -1).join('')

  if (!completedPrefix || isOnlyChoseong(completedPrefix)) {
    return false
  }

  const normalizedTarget = normalizeSearchText(target)
  const compactTarget = compactSearchText(normalizedTarget)
  const prefixes = Array.from(new Set([completedPrefix, compactSearchText(completedPrefix)]))

  return prefixes.some((prefix) => {
    const source = prefix === completedPrefix ? normalizedTarget : compactTarget
    let searchFrom = 0

    while (searchFrom < source.length) {
      const prefixIndex = source.indexOf(prefix, searchFrom)

      if (prefixIndex === -1) {
        return false
      }

      const nextCharacter = Array.from(source.slice(prefixIndex + prefix.length))[0]

      if (nextCharacter && getHangulInitial(nextCharacter) === lastQueryCharacter) {
        return true
      }

      searchFrom = prefixIndex + 1
    }

    return false
  })
}

export function getHangulInitials(value: string) {
  return Array.from(normalizeSearchText(value))
    .map((character) => {
      const initial = getHangulInitial(character)

      return initial || (/[a-z0-9]/.test(character) ? character : ' ')
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

  const isChoseongQuery = isOnlyChoseong(normalizedQuery)
  const isSingleChoseongQuery = isChoseongQuery && Array.from(normalizedQuery).length === 1
  const queryCandidates = Array.from(new Set([
    normalizedQuery,
    compactSearchText(normalizedQuery),
  ].filter(Boolean)))

  return values.some((value) => {
    if (!value) {
      return false
    }

    const normalizedValue = normalizeSearchText(value)
    const valueInitials = getHangulInitials(normalizedValue)
    const valueCandidates = [
      normalizedValue,
      compactSearchText(normalizedValue),
    ]

    if (isSingleChoseongQuery) {
      return valueInitials.includes(normalizedQuery)
    }

    if (isChoseongQuery) {
      return false
    }

    return queryCandidates.some((candidate) =>
      valueCandidates.some((target) => target.includes(candidate))
    ) || matchesTrailingComposingInitial(normalizedQuery, normalizedValue)
  })
}
