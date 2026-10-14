/**
 * Quote data is editable by the site owner, so URLs from it are validated before rendering:
 * links must be http(s); images must be same-site paths or https. Anything else is dropped
 * (this blocks javascript:/data: URLs if one is ever pasted in by mistake).
 */
export function safeLink(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url, window.location.origin)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined
  } catch {
    return undefined
  }
}

export function safeImage(src?: string): string | undefined {
  if (!src) return undefined
  if (src.startsWith('/') && !src.startsWith('//')) return src
  try {
    return new URL(src).protocol === 'https:' ? src : undefined
  } catch {
    return undefined
  }
}
