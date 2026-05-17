import 'server-only'

import { randomUUID } from 'node:crypto'
import net from 'node:net'
import tls from 'node:tls'

type SmtpSocket = net.Socket | tls.TLSSocket

export interface MailMessage {
  to: string
  subject: string
  html: string
  text: string
}

function readSmtpResponse(socket: SmtpSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = ''

    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const lastLine = lines.at(-1)

      if (lastLine && /^\d{3} /.test(lastLine)) {
        cleanup()
        resolve(buffer)
      }
    }

    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function expectSmtp(socket: SmtpSocket, expectedCodes: number[]) {
  const response = await readSmtpResponse(socket)
  const code = Number(response.slice(0, 3))

  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed with ${code}`)
  }

  return response
}

async function sendSmtpCommand(socket: SmtpSocket, command: string, expectedCodes: number[]) {
  socket.write(`${command}\r\n`)
  return expectSmtp(socket, expectedCodes)
}

function connectSmtp(host: string, port: number) {
  return new Promise<SmtpSocket>((resolve, reject) => {
    if (port === 465) {
      const socket = tls.connect({ host, port, servername: host })

      socket.once('secureConnect', () => resolve(socket))
      socket.once('error', reject)
      return
    }

    const socket = net.createConnection({ host, port })

    socket.once('connect', () => resolve(socket))
    socket.once('error', reject)
  })
}

function upgradeToTls(socket: SmtpSocket, host: string) {
  return new Promise<tls.TLSSocket>((resolve, reject) => {
    const secureSocket = tls.connect({
      socket,
      servername: host,
    })

    secureSocket.once('secureConnect', () => resolve(secureSocket))
    secureSocket.once('error', reject)
  })
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function formatAddress(name: string, email: string) {
  return `${encodeHeader(name)} <${email}>`
}

function escapeDataLines(value: string) {
  return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
}

function buildRawMessage({
  fromEmail,
  fromName,
  message,
}: {
  fromEmail: string
  fromName: string
  message: MailMessage
}) {
  const boundary = `inderverse-${randomUUID()}`

  return [
    `From: ${formatAddress(fromName, fromEmail)}`,
    `To: ${message.to}`,
    `Subject: ${encodeHeader(message.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.html,
    '',
    `--${boundary}--`,
  ].join('\r\n')
}

export async function sendSmtpMail(message: MailMessage) {
  const host = process.env.INDERVERSE_SMTP_HOST ?? process.env.SUPABASE_AUTH_SMTP_HOST
  const port = Number(
    process.env.INDERVERSE_SMTP_PORT ?? process.env.SUPABASE_AUTH_SMTP_PORT ?? 587
  )
  const user = process.env.INDERVERSE_SMTP_USER ?? process.env.SUPABASE_AUTH_SMTP_USER
  const pass = process.env.INDERVERSE_SMTP_PASS ?? process.env.SUPABASE_AUTH_SMTP_PASS
  const fromEmail =
    process.env.INDERVERSE_SMTP_FROM_EMAIL ?? process.env.SUPABASE_AUTH_SMTP_ADMIN_EMAIL
  const fromName =
    process.env.INDERVERSE_SMTP_FROM_NAME ??
    process.env.SUPABASE_AUTH_SMTP_SENDER_NAME ??
    'Inderverse'

  if (!host || !user || !pass || !fromEmail || !Number.isFinite(port)) {
    throw new Error('SMTP 환경 변수가 설정되지 않았습니다.')
  }

  let socket = await connectSmtp(host, port)

  try {
    await expectSmtp(socket, [220])
    await sendSmtpCommand(socket, 'EHLO inderverse.local', [250])

    if (port !== 465) {
      await sendSmtpCommand(socket, 'STARTTLS', [220])
      socket = await upgradeToTls(socket, host)
      await sendSmtpCommand(socket, 'EHLO inderverse.local', [250])
    }

    await sendSmtpCommand(socket, 'AUTH LOGIN', [334])
    await sendSmtpCommand(socket, Buffer.from(user).toString('base64'), [334])
    await sendSmtpCommand(socket, Buffer.from(pass).toString('base64'), [235])
    await sendSmtpCommand(socket, `MAIL FROM:<${fromEmail}>`, [250])
    await sendSmtpCommand(socket, `RCPT TO:<${message.to}>`, [250, 251])
    await sendSmtpCommand(socket, 'DATA', [354])

    const rawMessage = buildRawMessage({
      fromEmail,
      fromName,
      message,
    })
    socket.write(`${escapeDataLines(rawMessage)}\r\n.\r\n`)
    await expectSmtp(socket, [250])
    await sendSmtpCommand(socket, 'QUIT', [221])
  } finally {
    socket.destroy()
  }
}
