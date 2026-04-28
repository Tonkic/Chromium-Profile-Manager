import AdmZip from 'adm-zip'
import { dialog } from 'electron'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Profile } from './types.js'
import { logsRoot, profilesRoot } from './paths.js'
import { createProfile, getProfile, listProfiles } from './profiles.js'

interface ProfileArchiveManifest {
  version: 1
  exportedAt: string
  profileId: string
}

const profileDir = (profileId: string) => path.join(profilesRoot(), profileId)
const profileLogPath = (profileId: string) => path.join(logsRoot(), `${profileId}.log`)

const safeProfileId = (value: string) => value.trim().replace(/[^a-zA-Z0-9._-]/g, '-')

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

export const exportProfileArchive = async (profileId: string) => {
  const profileJsonPath = path.join(profileDir(profileId), 'profile.json')
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

  const zip = new AdmZip()
  zip.addFile('manifest.json', Buffer.from(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profileId } satisfies ProfileArchiveManifest, null, 2)))
  for (const fileName of ['profile.json', 'bookmarks.json', 'quick-links.json']) {
    const filePath = path.join(profileDir(profileId), fileName)
    if (existsSync(filePath)) {
      zip.addLocalFile(filePath, 'profile')
    }
  }
  const logPath = profileLogPath(profileId)
  if (existsSync(logPath)) {
    zip.addLocalFile(logPath, 'logs')
  }
  zip.writeZip(result.filePath)
  return result.filePath
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

  const archivePath = result.filePaths[0]
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'chromium-profile-import-'))
  try {
    const zip = new AdmZip(archivePath)
    zip.extractAllTo(tempDir, true)
    const profileJsonPath = path.join(tempDir, 'profile', 'profile.json')
    if (!existsSync(profileJsonPath)) {
      throw new Error('profile.json not found in archive')
    }
    const profile = JSON.parse(await readFile(profileJsonPath, 'utf-8')) as Profile
    const importedId = await uniqueProfileId(safeProfileId(profile.id || 'imported-profile'))
    const importedProfile: Profile = {
      ...profile,
      id: importedId,
      name: importedId === profile.id ? profile.name : `${profile.name} (导入)`,
      userDataDir: `./data/profiles/${importedId}/user-data`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const targetProfileDir = path.join(profilesRoot(), importedId)
    await mkdir(targetProfileDir, { recursive: true })
    for (const fileName of ['bookmarks.json', 'quick-links.json']) {
      const sourcePath = path.join(tempDir, 'profile', fileName)
      if (existsSync(sourcePath)) {
        await writeFile(path.join(targetProfileDir, fileName), await readFile(sourcePath))
      }
    }
    await createProfile(importedProfile)

    return importedProfile
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
