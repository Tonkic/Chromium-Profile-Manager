import AdmZip from 'adm-zip'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createWriteStream, existsSync, readdirSync } from 'node:fs'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { runtimeRoot, toDisplayPath } from './paths.js'
import { inferRuntimeKindFromPath } from './runtime_capabilities.js'

export type RuntimeKind = 'fingerprint' | 'normal'
export type InstalledRuntimeKind = RuntimeKind | 'unknown'

interface RuntimeProvider {
  kind: RuntimeKind
  label: string
  repo: string
  latestUrl: string
}

const RUNTIME_PROVIDERS: RuntimeProvider[] = [
  {
    kind: 'fingerprint',
    label: '指纹浏览器',
    repo: 'adryfish/fingerprint-chromium',
    latestUrl: 'https://api.github.com/repos/adryfish/fingerprint-chromium/releases/latest',
  },
  {
    kind: 'normal',
    label: '普通浏览器',
    repo: 'ungoogled-software/ungoogled-chromium-windows',
    latestUrl: 'https://api.github.com/repos/ungoogled-software/ungoogled-chromium-windows/releases/latest',
  },
]

export interface RuntimeReleaseAsset {
  id: number | string
  kind: RuntimeKind
  label: string
  repo: string
  name: string
  size: number
  downloadUrl: string
  releaseName: string
  tagName: string
  publishedAt: string | null
  available: boolean
  error?: string
}

export interface RuntimeInstallState {
  status: 'idle' | 'installing' | 'installed' | 'error'
  phase?: 'downloading' | 'extracting' | 'installed' | 'error'
  message?: string
  installedPath?: string
  assetName?: string
  tagName?: string
  downloadedBytes?: number
  totalBytes?: number
  progressPercent?: number
}

export interface RuntimeInstallResult {
  browserPath: string
  installDir: string
  assetName: string
  tagName: string
  kind: RuntimeKind
  repo: string
}

export interface InstalledRuntimeEntry {
  id: string
  kind: InstalledRuntimeKind
  label: string
  browserPath: string
  installDir: string
  displayName: string
  repo?: string
  tagName?: string
  assetName?: string
}

interface GitHubReleaseAsset {
  id: number
  name: string
  size: number
  browser_download_url: string
}

interface GitHubRelease {
  name?: string
  tag_name: string
  published_at?: string | null
  assets?: GitHubReleaseAsset[]
}

const providerHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Chromium-Profile-Manager',
}

const state: RuntimeInstallState = { status: 'idle' }

const runtimeKindLabel = (kind: InstalledRuntimeKind) => {
  if (kind === 'fingerprint') {
    return '指纹浏览器'
  }
  if (kind === 'normal') {
    return '普通浏览器'
  }
  return '未识别 Runtime'
}

const runtimeKindRepo = (kind: InstalledRuntimeKind) => {
  if (kind === 'fingerprint') {
    return 'adryfish/fingerprint-chromium'
  }
  if (kind === 'normal') {
    return 'ungoogled-software/ungoogled-chromium-windows'
  }
  return undefined
}

const normalizeEntryName = (value: string) => value.replace(/\\/g, '/')

const ensureArchiveEntriesSafe = (zip: AdmZip) => {
  for (const entry of zip.getEntries()) {
    const name = normalizeEntryName(entry.entryName)
    if (!name || name.startsWith('/') || /^[a-zA-Z]:\//.test(name) || name.split('/').includes('..')) {
      throw new Error('runtime archive contains unsafe paths')
    }
  }
}

const findChromeExe = (dir: string): string | undefined => {
  const stack = [dir]
  while (stack.length > 0) {
    const current = stack.pop()!
    const entries = readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else if (entry.isFile() && entry.name.toLowerCase() === 'chrome.exe') {
        return fullPath
      }
    }
  }
  return undefined
}

const safeInstallName = (asset: RuntimeReleaseAsset) =>
  `${asset.kind}-${asset.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9._-]/g, '-')}`

const isWindowsX64Zip = (asset: GitHubReleaseAsset) => {
  const name = asset.name.toLowerCase()
  if (!name.endsWith('.zip')) {
    return false
  }
  if (/(symbols|debug|source|src|arm64|aarch64|ia32|32bit|(?:^|[-_.])x86(?:[-.]|$))/.test(name)) {
    return false
  }
  const hasWindows = /(?:windows[_-]x64|windows|win64|win[_-]?x64)/.test(name)
  const hasX64 = /(?:windows[_-]x64|windows-x64|win64|x64|x86_64|amd64)/.test(name)
  return hasWindows && hasX64
}

const assetScore = (asset: GitHubReleaseAsset) => {
  const name = asset.name.toLowerCase()
  let score = asset.size
  if (name.includes('windows')) {
    score += 3_000_000_000
  }
  if (name.includes('x64')) {
    score += 2_000_000_000
  }
  if (name.includes('win64')) {
    score += 1_000_000_000
  }
  return score
}

const selectWindowsX64Zip = (assets: GitHubReleaseAsset[] = []) =>
  assets.filter(isWindowsX64Zip).sort((left, right) => assetScore(right) - assetScore(left))[0]

const networkErrorMessage = (action: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  if (/fetch failed|network|timeout|ECONNRESET|ENOTFOUND|ETIMEDOUT/i.test(message)) {
    return `${action}失败，请检查网络或代理后重试`
  }
  return message
}

const unavailableProviderRelease = (provider: RuntimeProvider, error: unknown): RuntimeReleaseAsset => ({
  id: provider.kind,
  kind: provider.kind,
  label: provider.label,
  repo: provider.repo,
  name: '',
  size: 0,
  downloadUrl: '',
  releaseName: '',
  tagName: '',
  publishedAt: null,
  available: false,
  error: networkErrorMessage(`${provider.label} release 读取`, error),
})

const fetchWithRetry = async (url: string, init: RequestInit) => {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, init)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

const fetchProviderRelease = async (provider: RuntimeProvider): Promise<RuntimeReleaseAsset> => {
  const response = await fetchWithRetry(provider.latestUrl, { headers: providerHeaders })
  if (!response.ok) {
    throw new Error(`${provider.label} latest release 读取失败: HTTP ${response.status}`)
  }

  const release = (await response.json()) as GitHubRelease
  const asset = selectWindowsX64Zip(release.assets)
  if (!asset) {
    throw new Error(`${provider.label} latest release 没有 Windows x64 zip`)
  }

  return {
    id: asset.id,
    kind: provider.kind,
    label: provider.label,
    repo: provider.repo,
    name: asset.name,
    size: asset.size,
    downloadUrl: asset.browser_download_url,
    releaseName: release.name || release.tag_name,
    tagName: release.tag_name,
    publishedAt: release.published_at ?? null,
    available: true,
  }
}

const updateDownloadProgress = (downloadedBytes: number, totalBytes?: number) => {
  state.downloadedBytes = downloadedBytes
  state.totalBytes = totalBytes
  state.progressPercent = totalBytes ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : undefined
}

const downloadAsset = async (downloadUrl: string, targetPath: string) => {
  const response = await fetchWithRetry(downloadUrl, {
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'Chromium-Profile-Manager',
    },
  }).catch((error: unknown) => {
    throw new Error(networkErrorMessage('runtime 下载', error))
  })
  if (!response.ok) {
    throw new Error(`runtime 下载失败: HTTP ${response.status}`)
  }
  if (!response.body) {
    throw new Error('runtime 下载失败: 响应中没有可读取的数据流')
  }

  const contentLength = response.headers.get('content-length')
  const totalBytes = contentLength ? Number(contentLength) : undefined
  const reader = response.body.getReader()
  const hash = createHash('sha256')
  const output = createWriteStream(targetPath)
  let downloadedBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      const chunk = Buffer.from(value)
      hash.update(chunk)
      downloadedBytes += chunk.byteLength
      updateDownloadProgress(downloadedBytes, totalBytes)
      if (!output.write(chunk)) {
        await once(output, 'drain')
      }
    }
  } finally {
    output.end()
    reader.releaseLock()
  }

  await once(output, 'finish')
  updateDownloadProgress(downloadedBytes, totalBytes)
  return hash.digest('hex')
}

export const listRuntimeReleases = async (): Promise<RuntimeReleaseAsset[]> => {
  const settled = await Promise.allSettled(RUNTIME_PROVIDERS.map((provider) => fetchProviderRelease(provider)))
  return settled.map((result, index) =>
    result.status === 'fulfilled' ? result.value : unavailableProviderRelease(RUNTIME_PROVIDERS[index], result.reason),
  )
}

export const listInstalledRuntimes = async (): Promise<InstalledRuntimeEntry[]> => {
  const root = runtimeRoot()
  if (!existsSync(root)) {
    return []
  }

  const seen = new Set<string>()
  const entries: InstalledRuntimeEntry[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    try {
      const installDir = path.join(root, entry.name)
      const chromePath = findChromeExe(installDir)
      if (!chromePath || !existsSync(chromePath)) {
        continue
      }
      const browserPath = `./${toDisplayPath(chromePath)}`
      const normalizedBrowserPath = normalizeEntryName(browserPath).toLowerCase()
      if (seen.has(normalizedBrowserPath)) {
        continue
      }
      seen.add(normalizedBrowserPath)

      const kind = inferRuntimeKindFromPath(chromePath)
      const installDirPath = `./${toDisplayPath(installDir)}`
      entries.push({
        id: normalizedBrowserPath,
        kind,
        label: runtimeKindLabel(kind),
        browserPath,
        installDir: installDirPath,
        displayName: entry.name,
        repo: runtimeKindRepo(kind),
        assetName: entry.name,
      })
    } catch {
      continue
    }
  }
  return entries
}

export const getRuntimeInstallState = async (): Promise<RuntimeInstallState> => state

export const installRuntimeRelease = async (asset: RuntimeReleaseAsset): Promise<RuntimeInstallResult> => {
  if (!asset.available) {
    throw new Error(asset.error || `${asset.label} 当前不可安装`)
  }
  state.status = 'installing'
  state.phase = 'downloading'
  state.message = `正在下载 ${asset.name}`
  state.assetName = asset.name
  state.tagName = asset.tagName
  state.installedPath = undefined
  state.downloadedBytes = 0
  state.totalBytes = asset.size || undefined
  state.progressPercent = 0

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'chromium-runtime-install-'))
  try {
    await mkdir(runtimeRoot(), { recursive: true })
    const archivePath = path.join(tempDir, path.basename(asset.downloadUrl))
    await downloadAsset(asset.downloadUrl, archivePath)

    state.phase = 'extracting'
    state.message = '正在解压 runtime'
    state.progressPercent = 99
    const zip = new AdmZip(archivePath)
    ensureArchiveEntriesSafe(zip)

    const installDir = path.join(runtimeRoot(), safeInstallName(asset))
    await rm(installDir, { recursive: true, force: true })
    await mkdir(installDir, { recursive: true })
    zip.extractAllTo(installDir, true)

    const chromePath = findChromeExe(installDir)
    if (!chromePath || !existsSync(chromePath)) {
      throw new Error('runtime 压缩包中没有找到 chrome.exe')
    }

    const result: RuntimeInstallResult = {
      browserPath: `./${toDisplayPath(chromePath)}`,
      installDir: `./${toDisplayPath(installDir)}`,
      assetName: asset.name,
      tagName: asset.tagName,
      kind: asset.kind,
      repo: asset.repo,
    }
    state.status = 'installed'
    state.phase = 'installed'
    state.message = 'runtime 已安装'
    state.installedPath = result.browserPath
    state.progressPercent = 100
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.status = 'error'
    state.phase = 'error'
    state.message = message
    throw new Error(message)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
