import type { AppInvoke } from '../../electron/ipc/contracts'

export const tauriInvoke = ((command: string, payload?: unknown) =>
  window.electronAPI.invoke(command as never, payload as never)) as AppInvoke
