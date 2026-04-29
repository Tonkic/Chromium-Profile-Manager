import type { Profile } from '../types/profile'
import { tauriInvoke } from './tauri'

export interface ExportProfileArchiveResult {
  profileId: string
  filePath: string
  includesUserData: boolean
  hasUserData: boolean
}

export interface ImportProfileArchiveResult {
  archivePath: string
  profile?: Profile
  hasUserData: boolean
  restoredUserData: boolean
  error?: string
}

export const listProfiles = () => tauriInvoke<Profile[]>('list_profiles')
export const createProfile = (profile: Profile) => tauriInvoke<void>('create_profile', { profile })
export const updateProfile = (originalId: string, profile: Profile) =>
  tauriInvoke<void>('update_profile', { originalId, profile })
export const deleteProfile = (id: string) => tauriInvoke<void>('delete_profile', { id })
export const exportProfileArchive = (profileId: string) =>
  tauriInvoke<string | undefined>('export_profile_archive', { profileId })
export const importProfileArchive = () => tauriInvoke<Profile | undefined>('import_profile_archive')

export const exportProfileArchives = (profileIds: string[], includeUserData: boolean) =>
  tauriInvoke<ExportProfileArchiveResult[]>('export_profile_archives', {
    profileIds: Array.from(profileIds),
    includeUserData,
  })

export const importProfileArchives = () => tauriInvoke<ImportProfileArchiveResult[]>('import_profile_archives')
