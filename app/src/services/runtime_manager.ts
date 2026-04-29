import { tauriInvoke } from './tauri'

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

export const listRuntimeReleases = () => tauriInvoke<RuntimeReleaseAsset[]>('list_runtime_releases')
export const installRuntimeRelease = (asset: RuntimeReleaseAsset) =>
  tauriInvoke<RuntimeInstallResult>('install_runtime_release', { asset: { ...asset } })
export const getRuntimeInstallState = () => tauriInvoke<RuntimeInstallState>('get_runtime_install_state')
