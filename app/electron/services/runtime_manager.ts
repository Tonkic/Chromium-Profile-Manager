import AdmZip from 'adm-zip'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { runtimeRoot, toDisplayPath } from './paths.js'

const REPOSITORY_RELEASES_URL = 'https://api.github.com/repos/Tonkic/Chromium-Profile-Manager/releases'
const RUNTIME_ASSET_PATTERN = /^runtime-windows-x64-.+\.zip$/i

export interface RuntimeReleaseAsset {
  id: number
  name: string
  size: number
  downloadUrl: string
  releaseName: string
  tagName: string
  publishedAt: string | null
}

export interface RuntimeInstallState {
  status: 'idle' | 'installing' | 'installed' | 'error'
  message?: string
  installedPath?: string
  assetName?: string
  tagName?: string
}

export interface RuntimeInstallResult {
  browserPath: string
  installDir: string
  assetName: string
  tagName: string
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

const state: RuntimeInstallState = { status: 'idle' }

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

const safeInstallName = (assetName: string) => assetName.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9._-]/g, '-')

const downloadAsset = async (downloadUrl: string, targetPath: string) => {
  const response = await fetch(downloadUrl, {
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'Chromium-Profile-Manager',
    },
  })
  if (!response.ok) {
    throw new Error(`runtime 下载失败: HTTP ${response.status}`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  await writeFile(targetPath, bytes)
  return createHash('sha256').update(bytes).digest('hex')
}

export const listRuntimeReleases = async (): Promise<RuntimeReleaseAsset[]> => {
  const response = await fetch(REPOSITORY_RELEASES_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Chromium-Profile-Manager',
    },
  })
  if (!response.ok) {
    throw new Error(`读取 runtime release 失败: HTTP ${response.status}`)
  }

  const releases = (await response.json()) as GitHubRelease[]
  return releases.flatMap((release) =>
    (release.assets ?? [])
      .filter((asset) => RUNTIME_ASSET_PATTERN.test(asset.name))
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        size: asset.size,
        downloadUrl: asset.browser_download_url,
        releaseName: release.name || release.tag_name,
        tagName: release.tag_name,
        publishedAt: release.published_at ?? null,
      })),
  )
}

export const getRuntimeInstallState = async (): Promise<RuntimeInstallState> => state

export const installRuntimeRelease = async (asset: RuntimeReleaseAsset): Promise<RuntimeInstallResult> => {
  state.status = 'installing'
  state.message = `正在下载 ${asset.name}`
  state.assetName = asset.name
  state.tagName = asset.tagName

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'chromium-runtime-install-'))
  try {
    await mkdir(runtimeRoot(), { recursive: true })
    const archivePath = path.join(tempDir, asset.name)
    await downloadAsset(asset.downloadUrl, archivePath)

    state.message = '正在解压 runtime'
    const zip = new AdmZip(archivePath)
    ensureArchiveEntriesSafe(zip)

    const installDir = path.join(runtimeRoot(), safeInstallName(asset.name))
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
    }
    state.status = 'installed'
    state.message = 'runtime 已安装'
    state.installedPath = result.browserPath
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.status = 'error'
    state.message = message
    throw new Error(message)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
