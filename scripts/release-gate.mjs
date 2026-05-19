import { spawn } from 'node:child_process'

const commands = [
  ['npm', ['run', 'check:release-files']],
  ['npm', ['run', 'lint']],
  ['npx', ['tsc', '--noEmit']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'check:prod']],
  ['npm', ['run', 'check:db']],
]

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
    })
  })
}

for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(' ')}`)
  await run(command, args)
}

console.log('\nRelease gate passed.')
