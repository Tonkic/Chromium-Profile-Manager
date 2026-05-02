import { tauriInvoke } from './tauri'

export type RuntimeKind = 'fingerprint' | 'normal' | 'unknown'
export type DownloadableRuntimeKind = Exclude<RuntimeKind, 'unknown'>

export interface RuntimeReleaseAsset {
  id: number | string
  kind: DownloadableRuntimeKind
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
  kind: DownloadableRuntimeKind
  repo: string
}

export interface InstalledRuntimeEntry {
  id: string
  kind: RuntimeKind
  label: string
  browserPath: string
  installDir: string
  displayName: string
  repo?: string
  tagName?: string
  assetName?: string
}

export const listRuntimeReleases = () => tauriInvoke<RuntimeReleaseAsset[]>('list_runtime_releases')
export const listInstalledRuntimes = () => tauriInvoke<InstalledRuntimeEntry[]>('list_installed_runtimes')
export const installRuntimeRelease = (asset: RuntimeReleaseAsset) =>
  tauriInvoke<RuntimeInstallResult>('install_runtime_release', { asset: { ...asset } })
export const getRuntimeInstallState = () => tauriInvoke<RuntimeInstallState>('get_runtime_install_state')
