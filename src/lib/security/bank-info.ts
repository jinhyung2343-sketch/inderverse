import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { getOptionalServerEnv } from '@/lib/env/server'

export interface BankInfoInput {
  bankName: string
  accountHolder: string
  accountNumber: string
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getSecret() {
  return getOptionalServerEnv('BANK_INFO_ENCRYPTION_SECRET')
}

function getKey() {
  const secret = getSecret()

  if (!secret) {
    return null
  }

  return createHash('sha256').update(secret).digest()
}

function base64UrlEncode(value: Buffer) {
  return value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(`${normalized}${padding}`, 'base64')
}

export function normalizeBankInfo(input: BankInfoInput) {
  return {
    bankName: input.bankName.trim(),
    accountHolder: input.accountHolder.trim(),
    accountNumber: input.accountNumber.replace(/\s+/g, '').trim(),
  }
}

export function hasAnyBankInfo(input: BankInfoInput) {
  const normalized = normalizeBankInfo(input)
  return Boolean(normalized.bankName || normalized.accountHolder || normalized.accountNumber)
}

export function encryptBankInfo(input: BankInfoInput) {
  const key = getKey()

  if (!key) {
    throw new Error('BANK_INFO_ENCRYPTION_SECRET 환경 변수가 필요합니다.')
  }

  const normalized = normalizeBankInfo(input)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const plaintext = Buffer.from(JSON.stringify(normalized), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `enc:v1:${base64UrlEncode(iv)}:${base64UrlEncode(authTag)}:${base64UrlEncode(encrypted)}`
}

export function decryptBankInfo(value: string | null | undefined): BankInfoInput | null {
  if (!value) {
    return null
  }

  const key = getKey()

  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BANK_INFO_ENCRYPTION_SECRET is required to decrypt bank info.')
    }

    console.warn('BANK_INFO_ENCRYPTION_SECRET is missing; encrypted bank info cannot be decrypted.')
    return null
  }

  const [prefix, version, ivEncoded, authTagEncoded, encryptedEncoded] = value.split(':')

  if (prefix !== 'enc' || version !== 'v1' || !ivEncoded || !authTagEncoded || !encryptedEncoded) {
    return null
  }

  try {
    const iv = base64UrlDecode(ivEncoded)
    const authTag = base64UrlDecode(authTagEncoded)
    const encrypted = base64UrlDecode(encryptedEncoded)
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
    const parsed = JSON.parse(plaintext) as Partial<BankInfoInput>

    return normalizeBankInfo({
      bankName: typeof parsed.bankName === 'string' ? parsed.bankName : '',
      accountHolder: typeof parsed.accountHolder === 'string' ? parsed.accountHolder : '',
      accountNumber: typeof parsed.accountNumber === 'string' ? parsed.accountNumber : '',
    })
  } catch {
    return null
  }
}

export function maskAccountNumber(accountNumber: string) {
  const digits = accountNumber.replace(/\s+/g, '')

  if (digits.length <= 4) {
    return digits
  }

  return `${digits.slice(0, 3)}${'*'.repeat(Math.max(0, digits.length - 5))}${digits.slice(-2)}`
}

export function getMaskedBankSummary(input: BankInfoInput | null) {
  if (!input || !hasAnyBankInfo(input)) {
    return null
  }

  const normalized = normalizeBankInfo(input)
  const parts = [
    normalized.bankName || '은행 미정',
    normalized.accountHolder || '예금주 미정',
    normalized.accountNumber ? maskAccountNumber(normalized.accountNumber) : '계좌번호 미정',
  ]

  return parts.join(' · ')
}
