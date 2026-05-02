export type RuntimeKind = 'fingerprint' | 'normal' | 'unknown'

export const inferRuntimeKindFromPath = (browserPath?: string): RuntimeKind => {
  const normalized = browserPath?.toLowerCase().replace(/\\/g, '/') ?? ''
  const segments = normalized.split('/').filter(Boolean)
  if (segments.some((segment) => segment === 'fingerprint' || segment.startsWith('fingerprint-'))) {
    return 'fingerprint'
  }
  if (segments.some((segment) => segment === 'normal' || segment.startsWith('normal-'))) {
    return 'normal'
  }
  if (normalized.includes('fingerprint-chromium')) {
    return 'fingerprint'
  }
  if (normalized.includes('ungoogled-chromium')) {
    return 'normal'
  }
  return 'unknown'
}

export const supportsFingerprintSettings = (kind?: RuntimeKind) => kind === 'fingerprint'
