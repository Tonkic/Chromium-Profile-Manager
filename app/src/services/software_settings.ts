import { tauriInvoke } from './tauri'

export interface ElectronSoftwareSettings {
  defaultBrowserPath: string
}

export const getSoftwareSettings = () => tauriInvoke<ElectronSoftwareSettings>('get_software_settings')
export const saveSoftwareSettings = (settings: ElectronSoftwareSettings) =>
  tauriInvoke<ElectronSoftwareSettings>('save_software_settings', { settings })
