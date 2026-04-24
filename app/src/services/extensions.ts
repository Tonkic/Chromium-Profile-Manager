import type { ExtensionEntry } from '../types/extension'
import { tauriInvoke } from './tauri'

export const listExtensions = () => tauriInvoke<ExtensionEntry[]>('list_extensions')
export const importExtensionDir = (id: string, sourcePath: string) =>
  tauriInvoke<ExtensionEntry>('import_extension_dir', { id, sourcePath })
export const importExtensionCrx = (id: string, sourcePath: string) =>
  tauriInvoke<ExtensionEntry>('import_extension_crx', { id, sourcePath })
