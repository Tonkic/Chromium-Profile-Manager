import type { RuntimeReleaseAsset } from '../../shared/types'
import { tauriInvoke } from './tauri'

export type {
  DownloadableRuntimeKind,
  InstalledRuntimeEntry,
  RuntimeInstallResult,
  RuntimeInstallState,
  RuntimeKind,
  RuntimeReleaseAsset,
} from '../../shared/types'

export const listRuntimeReleases = () => tauriInvoke('list_runtime_releases')
export const listInstalledRuntimes = () => tauriInvoke('list_installed_runtimes')
export const installRuntimeRelease = (asset: RuntimeReleaseAsset) =>
  tauriInvoke('install_runtime_release', { asset: { ...asset } })
export const getRuntimeInstallState = () => tauriInvoke('get_runtime_install_state')
