import { tauriInvoke } from './tauri'

export const listExtensions = () => tauriInvoke('list_extensions')
export const importExtensionDir = (id: string, sourcePath: string) =>
  tauriInvoke('import_extension_dir', { id, sourcePath })
export const importExtensionCrx = (id: string, sourcePath: string) =>
  tauriInvoke('import_extension_crx', { id, sourcePath })
