import { tauriInvoke } from './tauri'

export const getLogs = (profileId: string) => tauriInvoke('get_logs', { profileId })
