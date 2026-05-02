import type { DisableSpoofingTarget, FingerprintLaunchSettings, Profile } from './types.js'

const userAgentMaxLength = 2048
const fetchTimeoutMs = 5000
const disableSpoofingTargets: DisableSpoofingTarget[] = ['font', 'audio', 'canvas', 'clientrects', 'gpu']

const validateUserAgent = (value: string) => {
  const userAgent = value.trim()
  if (!userAgent) {
    throw new Error('User-Agent 不能为空')
  }
  if (userAgent.length > userAgentMaxLength) {
    throw new Error('User-Agent 过长')
  }
  if (/\p{C}/u.test(userAgent)) {
    throw new Error('User-Agent 包含非法控制字符')
  }
  return userAgent
}

const userAgentArg = (value: string) => `--user-agent=${validateUserAgent(value)}`

const trimLaunchValue = (value: string | undefined, label: string) => {
  const text = value?.trim() ?? ''
  if (/\p{C}/u.test(text)) {
    throw new Error(`${label} 包含非法控制字符`)
  }
  return text
}

const positiveIntegerValue = (value: string | undefined, label: string) => {
  const text = trimLaunchValue(value, label)
  if (text && !/^[1-9]\d*$/.test(text)) {
    throw new Error(`${label} 必须是正整数`)
  }
  return text
}

const uniqueDisableSpoofingTargets = (value: FingerprintLaunchSettings['disableSpoofing']) => {
  const targets = value ?? []
  const invalid = targets.find((target) => !disableSpoofingTargets.includes(target))
  if (invalid) {
    throw new Error(`disable spoofing 不支持: ${invalid}`)
  }
  return disableSpoofingTargets.filter((target) => targets.includes(target))
}

export const fetchUserAgentFromUrl = async (url: string): Promise<string> => {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    throw new Error('User-Agent URL 无效')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('User-Agent URL 只支持 http 或 https')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs)
  try {
    const response = await fetch(parsed, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`User-Agent URL 请求失败: HTTP ${response.status}`)
    }
    const text = await response.text()
    const userAgent = text
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean)
    return validateUserAgent(userAgent ?? '')
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('User-Agent URL 请求超时')
    }
    throw error instanceof Error ? error : new Error(String(error))
  } finally {
    clearTimeout(timeout)
  }
}

export const parseFingerprintJsonArgs = (jsonText: string): string[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('指纹 JSON 格式无效')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('指纹 JSON 必须是对象')
  }

  const record = parsed as Record<string, unknown>
  const args: string[] = []
  const userAgent = record.userAgent ?? record.ua
  if (typeof userAgent === 'string' && userAgent.trim()) {
    args.push(userAgentArg(userAgent))
  }

  const jsonArgs = record.args ?? record.extraArgs
  if (jsonArgs !== undefined) {
    if (!Array.isArray(jsonArgs) || jsonArgs.some((item) => typeof item !== 'string')) {
      throw new Error('指纹 JSON 的 args 必须是字符串数组')
    }
    args.push(...jsonArgs.map((item) => item.trim()).filter(Boolean))
  }

  if (args.length === 0) {
    throw new Error('指纹 JSON 至少需要 userAgent/ua 或 args/extraArgs')
  }
  return args
}

export const resolveStructuredFingerprintArgs = (profile: Profile): string[] => {
  const launch = profile.fingerprint?.launch
  if (!launch) {
    return []
  }

  const seed = positiveIntegerValue(launch.seed, '指纹 Seed')
  const platform = trimLaunchValue(launch.platform, '指纹平台')
  const platformVersion = trimLaunchValue(launch.platformVersion, '平台版本')
  const brand = trimLaunchValue(launch.brand, '浏览器品牌')
  const brandVersion = trimLaunchValue(launch.brandVersion, '品牌版本')
  const hardwareConcurrency = positiveIntegerValue(launch.hardwareConcurrency, 'CPU 核心数')
  const disableSpoofing = uniqueDisableSpoofingTargets(launch.disableSpoofing)
  const args: string[] = []

  if (seed) {
    args.push(`--fingerprint=${seed}`)
  }
  if (platform) {
    args.push(`--fingerprint-platform=${platform}`)
  }
  if (platformVersion) {
    args.push(`--fingerprint-platform-version=${platformVersion}`)
  }
  if (brand) {
    args.push(`--fingerprint-brand=${brand}`)
  }
  if (brandVersion) {
    args.push(`--fingerprint-brand-version=${brandVersion}`)
  }
  if (hardwareConcurrency) {
    args.push(`--fingerprint-hardware-concurrency=${hardwareConcurrency}`)
  }
  if (launch.disableNonProxiedUdp) {
    args.push('--disable-non-proxied-udp')
  }
  if (disableSpoofing.length > 0) {
    args.push(`--disable-spoofing=${disableSpoofing.join(',')}`)
  }
  return args
}

export const resolveFingerprintArgs = async (profile: Profile): Promise<string[]> => {
  const settings = profile.fingerprint
  if (!settings?.enabled || !settings.source || settings.source === 'none') {
    return []
  }

  if (settings.source === 'text') {
    return [userAgentArg(settings.userAgentText ?? '')]
  }
  if (settings.source === 'url') {
    return [userAgentArg(await fetchUserAgentFromUrl(settings.userAgentUrl ?? ''))]
  }
  if (settings.source === 'json') {
    return parseFingerprintJsonArgs(settings.jsonText ?? '')
  }
  return []
}
