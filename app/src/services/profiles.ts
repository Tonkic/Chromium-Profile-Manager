import type { Profile } from '../types/profile'
import { tauriInvoke } from './tauri'

export type { ExportProfileArchiveResult, ImportProfileArchiveResult } from '../../shared/types'

export const listProfiles = () => tauriInvoke('list_profiles')
export const createProfile = (profile: Profile) => tauriInvoke('create_profile', { profile })
export const updateProfile = (originalId: string, profile: Profile) =>
  tauriInvoke('update_profile', { originalId, profile })
export const deleteProfile = (id: string) => tauriInvoke('delete_profile', { id })
export const exportProfileArchive = (profileId: string) =>
  tauriInvoke('export_profile_archive', { profileId })
export const importProfileArchive = () => tauriInvoke('import_profile_archive')

export const exportProfileArchives = (profileIds: string[], includeUserData: boolean) =>
  tauriInvoke('export_profile_archives', {
    profileIds: Array.from(profileIds),
    includeUserData,
  })

export const importProfileArchives = () => tauriInvoke('import_profile_archives')
