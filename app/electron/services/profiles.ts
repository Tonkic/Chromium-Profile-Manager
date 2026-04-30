import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Profile } from './types.js'
import { profilesRoot } from './paths.js'
import { DEFAULT_BROWSER_PATH } from './software_settings.js'

const profilePath = (id: string) => path.join(profilesRoot(), id, 'profile.json')
const profileDir = (id: string) => path.join(profilesRoot(), id)
const isLegacyDefaultBrowserPath = (value?: string) =>
  !value ||
  value.includes('runtime/ungoogled-chromium-146') ||
  value.includes('runtime\\ungoogled-chromium-146') ||
  value.includes('runtime/fingerprint-chromium-144') ||
  value.includes('runtime\\fingerprint-chromium-144')

export const normalizeProfileRuntime = (profile: Profile): Profile => {
  const browserPathOverride = profile.browserPathOverride?.trim() || undefined
  if (browserPathOverride) {
    return {
      ...profile,
      browserPath: DEFAULT_BROWSER_PATH,
      browserPathOverride,
    }
  }
  if (isLegacyDefaultBrowserPath(profile.browserPath)) {
    return {
      ...profile,
      browserPath: DEFAULT_BROWSER_PATH,
      browserPathOverride: undefined,
    }
  }
  return {
    ...profile,
    browserPath: DEFAULT_BROWSER_PATH,
    browserPathOverride: profile.browserPath,
  }
}

const writeProfileToDir = async (dir: string, profile: Profile) => {
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'profile.json'), JSON.stringify(normalizeProfileRuntime(profile), null, 2), 'utf-8')
}

const readProfileFile = async (filePath: string) => {
  const profile = JSON.parse(await readFile(filePath, 'utf-8')) as Profile
  const normalized = normalizeProfileRuntime(profile)
  if (JSON.stringify(profile) !== JSON.stringify(normalized)) {
    await writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf-8')
  }
  return normalized
}

export const listProfiles = async (): Promise<Profile[]> => {
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
    const filePath = path.join(root, entry.name, 'profile.json')
    if (!existsSync(filePath)) {
      continue
    }
    profiles.push(await readProfileFile(filePath))
  }
  return profiles.sort((a, b) => a.name.localeCompare(b.name))
}

export const getProfile = async (id: string): Promise<Profile> => {
  return readProfileFile(profilePath(id))
}

export const createProfile = async (profile: Profile) => {
  if (!profile.id.trim()) {
    throw new Error('profile id is required')
  }
  await writeProfileToDir(profileDir(profile.id), profile)
}

export const updateProfile = async (originalId: string, profile: Profile) => {
  if (!originalId.trim()) {
    throw new Error('original profile id is required')
  }
  if (!profile.id.trim()) {
    throw new Error('profile id is required')
  }
  if (originalId === profile.id) {
    if (!existsSync(profilePath(originalId))) {
      throw new Error('profile not found')
    }
    await writeProfileToDir(profileDir(profile.id), profile)
    return
  }
  const oldDir = profileDir(originalId)
  if (!existsSync(oldDir)) {
    throw new Error('profile not found')
  }
  const newDir = profileDir(profile.id)
  if (existsSync(newDir)) {
    throw new Error('target profile id already exists')
  }
  await rename(oldDir, newDir)
  await writeProfileToDir(newDir, profile)
}

export const deleteProfile = async (id: string) => {
  const dir = profileDir(id)
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true })
  }
}
