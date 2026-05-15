import AdmZip from 'adm-zip'
import { dialog } from 'electron'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { ExportProfileArchiveResult, ImportProfileArchiveResult, Profile } from './types.js'
import { createProfile, getProfile, listProfiles, normalizeProfileRuntime } from './profiles.js'
import { clearImportedRuntimeState } from './user_data.js'
import {
  BOOKMARKS_FILE_NAME,
  PROFILE_ARCHIVE_FILE_NAMES,
  PROFILE_FILE_NAME,
  QUICK_LINKS_FILE_NAME,
  USER_DATA_DIR_NAME,
  profileDir,
  profileLogPath,
  profilePath,
  profileUserDataDir,
  readJsonFile,
} from './profile_workspace.js'

interface ProfileArchiveManifest {
  version: 1
  exportedAt: string
  profileId: string
  includesUserData?: boolean
  hasUserData?: boolean
}

const safeProfileId = (value: string) => value.trim().replace(/[^a-zA-Z0-9._-]/g, '-')
const safeArchiveFileName = (value: string) => `${safeProfileId(value) || 'profile'}.zip`

const uniqueProfileId = async (baseId: string) => {
  const existing = new Set((await listProfiles()).map((profile) => profile.id))
  if (!existing.has(baseId)) {
    return baseId
  }
  let index = 1
  while (existing.has(`${baseId}-${index}`)) {
    index += 1
  }
  return `${baseId}-${index}`
}

const normalizeEntryName = (value: string) => value.replace(/\\/g, '/')

const ensureArchiveEntriesSafe = (zip: AdmZip) => {
  for (const entry of zip.getEntries()) {
    const name = normalizeEntryName(entry.entryName)
    if (!name) {
      throw new Error('archive entry name is invalid')
    }
    if (name.startsWith('/') || /^[a-zA-Z]:\//.test(name)) {
      throw new Error('archive entry path is invalid')
    }
    if (name.split('/').includes('..')) {
      throw new Error('archive entry contains path traversal')
    }
  }
}

const archiveHasUserData = (zip: AdmZip) => {
  return zip.getEntries().some((entry) => normalizeEntryName(entry.entryName).startsWith('profile/user-data/'))
}

const exportArchiveToPath = async (
  profileId: string,
  outputPath: string,
  includeUserData: boolean,
): Promise<ExportProfileArchiveResult> => {
  const profileJsonPath = profilePath(profileId)
  if (!existsSync(profileJsonPath)) {
    throw new Error('请先保存这个 Profile，再导出。')
  }

  const zip = new AdmZip()
  const userDataPath = profileUserDataDir(profileId)
  const hasUserData = includeUserData && existsSync(userDataPath)

  zip.addFile(
    'manifest.json',
    Buffer.from(
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          profileId,
          includesUserData: includeUserData,
          hasUserData,
        } satisfies ProfileArchiveManifest,
        null,
        2,
      ),
    ),
  )

  for (const fileName of PROFILE_ARCHIVE_FILE_NAMES) {
    const filePath = path.join(profileDir(profileId), fileName)
    if (existsSync(filePath)) {
      zip.addLocalFile(filePath, 'profile')
    }
  }

  const logPath = profileLogPath(profileId)
  if (existsSync(logPath)) {
    zip.addLocalFile(logPath, 'logs')
  }

  if (hasUserData) {
    zip.addLocalFolder(userDataPath, 'profile/user-data')
  }

  zip.writeZip(outputPath)

  return {
    profileId,
    filePath: outputPath,
    includesUserData: includeUserData,
    hasUserData,
  }
}

const importArchiveAtPath = async (archivePath: string): Promise<ImportProfileArchiveResult> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'chromium-profile-import-'))
  let hasUserData = false
  try {
    const zip = new AdmZip(archivePath)
    ensureArchiveEntriesSafe(zip)
    hasUserData = archiveHasUserData(zip)
    zip.extractAllTo(tempDir, true)

    const profileJsonPath = path.join(tempDir, 'profile', PROFILE_FILE_NAME)
    if (!existsSync(profileJsonPath)) {
      throw new Error('profile.json not found in archive')
    }

    const profile = normalizeProfileRuntime(await readJsonFile<Profile>(profileJsonPath))
    const importedId = await uniqueProfileId(safeProfileId(profile.id || 'imported-profile'))

    const importedProfile: Profile = normalizeProfileRuntime({
      ...profile,
      id: importedId,
      name: importedId === profile.id ? profile.name : `${profile.name} (导入)`,
      userDataDir: `./data/profiles/${importedId}/user-data`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const targetProfileDir = profileDir(importedId)
    await mkdir(targetProfileDir, { recursive: true })
    for (const fileName of [BOOKMARKS_FILE_NAME, QUICK_LINKS_FILE_NAME]) {
      const sourcePath = path.join(tempDir, 'profile', fileName)
      if (existsSync(sourcePath)) {
        await writeFile(path.join(targetProfileDir, fileName), await readFile(sourcePath))
      }
    }

    await createProfile(importedProfile)

    let restoredUserData = false
    if (hasUserData) {
      const sourceUserDataPath = path.join(tempDir, 'profile', USER_DATA_DIR_NAME)
      if (existsSync(sourceUserDataPath)) {
        const targetUserDataPath = path.join(targetProfileDir, USER_DATA_DIR_NAME)
        await rm(targetUserDataPath, { recursive: true, force: true })
        await cp(sourceUserDataPath, targetUserDataPath, { recursive: true })
        await clearImportedRuntimeState(targetUserDataPath)
        restoredUserData = true
      }
    }

    return {
      archivePath,
      profile: importedProfile,
      hasUserData,
      restoredUserData,
    }
  } catch (error) {
    return {
      archivePath,
      hasUserData,
      restoredUserData: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

export const exportProfileArchive = async (profileId: string) => {
  const profileJsonPath = profilePath(profileId)
  if (!existsSync(profileJsonPath)) {
    throw new Error('请先保存这个 Profile，再导出。')
  }
  const profile = await getProfile(profileId)
  const result = await dialog.showSaveDialog({
    title: '导出 Profile',
    defaultPath: `${profile.id}.zip`,
    filters: [{ name: 'Profile Archive', extensions: ['zip'] }],
  })
  if (result.canceled || !result.filePath) {
    return undefined
  }

  const exported = await exportArchiveToPath(profileId, result.filePath, false)
  return exported.filePath
}

export const exportProfileArchives = async (profileIds: string[], includeUserData: boolean) => {
  if (profileIds.length === 0) {
    return [] as ExportProfileArchiveResult[]
  }

  const result = await dialog.showOpenDialog({
    title: '选择导出目录',
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return [] as ExportProfileArchiveResult[]
  }

  const outputDir = result.filePaths[0]
  const exported: ExportProfileArchiveResult[] = []

  for (const profileId of profileIds) {
    const outputPath = path.join(outputDir, safeArchiveFileName(profileId))
    exported.push(await exportArchiveToPath(profileId, outputPath, includeUserData))
  }

  return exported
}

export const importProfileArchive = async () => {
  const result = await dialog.showOpenDialog({
    title: '导入 Profile',
    properties: ['openFile'],
    filters: [{ name: 'Profile Archive', extensions: ['zip'] }],
  })
  if (result.canceled || result.filePaths.length === 0) {
    return undefined
  }

  const imported = await importArchiveAtPath(result.filePaths[0])
  if (imported.error) {
    throw new Error(imported.error)
  }
  return imported.profile
}

export const importProfileArchives = async () => {
  const result = await dialog.showOpenDialog({
    title: '导入 Profile',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Profile Archive', extensions: ['zip'] }],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return [] as ImportProfileArchiveResult[]
  }

  const imported: ImportProfileArchiveResult[] = []
  for (const archivePath of result.filePaths) {
    imported.push(await importArchiveAtPath(archivePath))
  }
  return imported
}
