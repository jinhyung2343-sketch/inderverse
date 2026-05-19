export function replaceAfterAuth(path: string, delayMs = 0) {
  const replace = () => {
    window.location.replace(path)
  }

  if (delayMs > 0) {
    window.setTimeout(replace, delayMs)
    return
  }

  replace()
}
