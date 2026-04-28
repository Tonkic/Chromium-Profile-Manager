export const tauriInvoke = async <T>(command: string, payload?: Record<string, unknown>): Promise<T> => {
  return window.electronAPI.invoke<T>(command, payload)
}
