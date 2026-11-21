export function formatUserDisplayName(
  user?: { name?: string | null; email?: string | null } | null,
): string {
  if (!user) return 'Account'

  if (user.name && user.name.trim().length > 0) {
    return user.name.trim()
  }

  const email = user.email || ''
  if (!email || !email.includes('@')) {
    return 'Account'
  }

  const [localPart, domain] = email.split('@')
  if (localPart.length <= 4) {
    return `${localPart.slice(0, 1)}***@${domain}`
  }

  const firstCharCount = Math.min(4, Math.floor(localPart.length / 3))
  const lastCharCount = Math.min(4, Math.floor(localPart.length / 3))
  const prefix = localPart.slice(0, firstCharCount)
  const suffix = localPart.slice(localPart.length - lastCharCount)

  return `${prefix}***${suffix}@${domain}`
}
