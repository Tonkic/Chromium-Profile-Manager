import type { LogEntry } from './types.js'
import { appendProfileLog, readProfileLogs, renameProfileLog } from './profile_workspace.js'

export const renameProfileLogs = async (oldProfileId: string, newProfileId: string) => {
  if (oldProfileId === newProfileId) {
    return
  }
  await renameProfileLog(oldProfileId, newProfileId)
}

export const appendLog = async (profileId: string, entry: LogEntry) => {
  await appendProfileLog(profileId, entry)
}

export const getLogs = async (profileId: string): Promise<LogEntry[]> => {
  return readProfileLogs(profileId)
}
