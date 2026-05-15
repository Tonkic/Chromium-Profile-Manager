import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { LogEntry, Profile } from './types.js'
import { logsRoot, profilesRoot } from './paths.js'

export const PROFILE_FILE_NAME = 'profile.json'
export const BOOKMARKS_FILE_NAME = 'bookmarks.json'
export const QUICK_LINKS_FILE_NAME = 'quick-links.json'
export const USER_DATA_DIR_NAME = 'user-data'
export const PROFILE_ARCHIVE_FILE_NAMES = [PROFILE_FILE_NAME, BOOKMARKS_FILE_NAME, QUICK_LINKS_FILE_NAME] as const

export const profileDir = (profileId: string) => path.join(profilesRoot(), profileId)
export const profilePath = (profileId: string) => path.join(profileDir(profileId), PROFILE_FILE_NAME)
export const bookmarksPath = (profileId: string) => path.join(profileDir(profileId), BOOKMARKS_FILE_NAME)
export const quickLinksPath = (profileId: string) => path.join(profileDir(profileId), QUICK_LINKS_FILE_NAME)
export const profileLogPath = (profileId: string) => path.join(logsRoot(), `${profileId}.log`)
export const profileUserDataDir = (profileId: string) => path.join(profileDir(profileId), USER_DATA_DIR_NAME)

export const profileExists = (profileId: string) => existsSync(profilePath(profileId))
export const profileDirExists = (profileId: string) => existsSync(profileDir(profileId))

const writeJsonFile = async <T>(filePath: string, value: T) => {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

export const readJsonFile = async <T>(filePath: string): Promise<T> => {
  return JSON.parse(await readFile(filePath, 'utf-8')) as T
}

export const readJsonArrayFile = async <T>(filePath: string): Promise<T[]> => {
  if (!existsSync(filePath)) {
    return []
  }
  return readJsonFile<T[]>(filePath)
}

export const writeJsonArrayFile = async <T>(filePath: string, items: T[]) => {
  await writeJsonFile(filePath, items)
}

export const writeProfile = async (profile: Profile) => {
  await writeJsonFile(profilePath(profile.id), profile)
}

export const readProfile = async (profileId: string): Promise<Profile> => {
  return readJsonFile<Profile>(profilePath(profileId))
}

export const listStoredProfiles = async (): Promise<Profile[]> => {
  const root = profilesRoot()
  if (!existsSync(root)) {
    return []
  }
  const entries = await readdir(root, { withFileTypes: true })
  const profiles: Profile[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }
    const filePath = profilePath(entry.name)
    if (existsSync(filePath)) {
      profiles.push(await readJsonFile<Profile>(filePath))
    }
  }
  return profiles
}

export const renameProfileDir = async (oldProfileId: string, newProfileId: string) => {
  await rename(profileDir(oldProfileId), profileDir(newProfileId))
}

export const deleteProfileDir = async (profileId: string) => {
  if (profileDirExists(profileId)) {
    await rm(profileDir(profileId), { recursive: true, force: true })
  }
}

export const renameProfileLog = async (oldProfileId: string, newProfileId: string) => {
  await mkdir(logsRoot(), { recursive: true })
  const oldPath = profileLogPath(oldProfileId)
  const newPath = profileLogPath(newProfileId)
  if (existsSync(newPath)) {
    throw new Error('target profile log already exists')
  }
  if (existsSync(oldPath)) {
    await rename(oldPath, newPath)
  }
}

export const appendProfileLog = async (profileId: string, entry: LogEntry) => {
  await mkdir(logsRoot(), { recursive: true })
  await writeFile(profileLogPath(profileId), `${JSON.stringify(entry)}\n`, { encoding: 'utf-8', flag: 'a' })
}

export const readProfileLogs = async (profileId: string): Promise<LogEntry[]> => {
  const filePath = profileLogPath(profileId)
  if (!existsSync(filePath)) {
    return []
  }
  const content = await readFile(filePath, 'utf-8')
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LogEntry)
}
