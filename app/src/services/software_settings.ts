import type { SoftwareSettings } from '../../shared/types'
import { tauriInvoke } from './tauri'

export type ElectronSoftwareSettings = SoftwareSettings

export const getSoftwareSettings = () => tauriInvoke('get_software_settings')
export const saveSoftwareSettings = (settings: ElectronSoftwareSettings) =>
  tauriInvoke('save_software_settings', { settings })
