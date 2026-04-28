import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { LogEntry } from './types.js'
import { logsRoot } from './paths.js'

const logPath = (profileId: string) => path.join(logsRoot(), `${profileId}.log`)

export const renameProfileLogs = async (oldProfileId: string, newProfileId: string) => {
  if (oldProfileId === newProfileId) {
    return
  }
  await mkdir(logsRoot(), { recursive: true })
  const oldPath = logPath(oldProfileId)
  const newPath = logPath(newProfileId)
  if (existsSync(newPath)) {
    throw new Error('target profile log already exists')
  }
  if (!existsSync(oldPath)) {
    return
  }
  await rename(oldPath, newPath)
}

export const appendLog = async (profileId: string, entry: LogEntry) => {
  await mkdir(logsRoot(), { recursive: true })
  await writeFile(logPath(profileId), `${JSON.stringify(entry)}\n`, { encoding: 'utf-8', flag: 'a' })
}

export const getLogs = async (profileId: string): Promise<LogEntry[]> => {
  const filePath = logPath(profileId)
  if (!existsSync(filePath)) {
    return []
  }
  const content = await readFile(filePath, 'utf-8')
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LogEntry)
}
