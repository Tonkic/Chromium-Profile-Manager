import { existsSync } from 'node:fs'
import type { Profile } from './types.js'
import { DEFAULT_BROWSER_PATH } from './software_settings.js'
import {
  deleteProfileDir,
  listStoredProfiles,
  profileDir,
  profileExists,
  readProfile,
  renameProfileDir,
  writeProfile as writeStoredProfile,
} from './profile_workspace.js'

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

const writeProfile = async (profile: Profile) => {
  await writeStoredProfile(normalizeProfileRuntime(profile))
}

const normalizeStoredProfile = async (profile: Profile) => {
  const normalized = normalizeProfileRuntime(profile)
  if (JSON.stringify(profile) !== JSON.stringify(normalized)) {
    await writeStoredProfile(normalized)
  }
  return normalized
}

export const listProfiles = async (): Promise<Profile[]> => {
  const profiles = await Promise.all((await listStoredProfiles()).map(normalizeStoredProfile))
  return profiles.sort((a, b) => a.name.localeCompare(b.name))
}

export const getProfile = async (id: string): Promise<Profile> => {
  return normalizeStoredProfile(await readProfile(id))
}

export const createProfile = async (profile: Profile) => {
  if (!profile.id.trim()) {
    throw new Error('profile id is required')
  }
  await writeProfile(profile)
}

export const updateProfile = async (originalId: string, profile: Profile) => {
  if (!originalId.trim()) {
    throw new Error('original profile id is required')
  }
  if (!profile.id.trim()) {
    throw new Error('profile id is required')
  }
  if (originalId === profile.id) {
    if (!profileExists(originalId)) {
      throw new Error('profile not found')
    }
    await writeProfile(profile)
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
  await renameProfileDir(originalId, profile.id)
  await writeProfile(profile)
}

export const deleteProfile = async (id: string) => {
  await deleteProfileDir(id)
}
