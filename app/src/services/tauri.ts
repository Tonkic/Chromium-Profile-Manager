import { invoke } from '@tauri-apps/api/core'

export const tauriInvoke = async <T>(command: string, payload?: Record<string, unknown>): Promise<T> => {
  return invoke<T>(command, payload)
}
