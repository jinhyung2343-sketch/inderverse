import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const envFiles = ['.env.local', 'supabase/.env.local']
const requiredKeys = [
  'SUPABASE_AUTH_SMTP_HOST',
  'SUPABASE_AUTH_SMTP_USER',
  'SUPABASE_AUTH_SMTP_PASS',
  'SUPABASE_AUTH_SMTP_ADMIN_EMAIL',
  'SUPABASE_AUTH_SMTP_SENDER_NAME',
]

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {}
  }

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, rawLine) => {
      const line = rawLine.trim()

      if (!line || line.startsWith('#')) {
        return env
      }

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)

      if (!match) {
        return env
      }

      const [, key, rawValue] = match
      const value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2')
      env[key] = value
      return env
    }, {})
}

const fileEnv = envFiles.reduce(
  (env, filePath) => ({
    ...env,
    ...parseEnvFile(filePath),
  }),
  {}
)
const supabaseEnv = {
  ...fileEnv,
  ...process.env,
}
const missingKeys = requiredKeys.filter((key) => !supabaseEnv[key])

if (missingKeys.length > 0) {
  console.error('Resend로 실제 비밀번호 재설정 메일을 발송하는 데 필요한 SMTP 환경 변수가 없습니다.')
  console.error(`누락된 값: ${missingKeys.join(', ')}`)
  console.error('.env.local 또는 supabase/.env.local에 값을 추가한 뒤 다시 실행해 주세요.')
  process.exit(1)
}

for (const [command, args] of [
  ['supabase', ['stop']],
  ['supabase', ['start']],
]) {
  const result = spawnSync(command, args, {
    env: supabaseEnv,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
