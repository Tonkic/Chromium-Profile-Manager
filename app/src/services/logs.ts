import type { LogEntry } from '../types/logs'
import { tauriInvoke } from './tauri'

export const getLogs = (profileId: string) => tauriInvoke<LogEntry[]>('get_logs', { profileId })
