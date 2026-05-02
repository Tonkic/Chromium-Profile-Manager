import { tauriInvoke } from './tauri'

import type { RuntimeKind } from '../utils/runtimeCapabilities'

export interface ElectronSoftwareSettings {
  defaultBrowserPath: string
  defaultRuntimeKind?: RuntimeKind
  defaultRuntimeRepo?: string
  defaultRuntimeTagName?: string
  defaultRuntimeAssetName?: string
}

export const getSoftwareSettings = () => tauriInvoke<ElectronSoftwareSettings>('get_software_settings')
export const saveSoftwareSettings = (settings: ElectronSoftwareSettings) =>
  tauriInvoke<ElectronSoftwareSettings>('save_software_settings', { settings })
