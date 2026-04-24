import type { Profile } from '../types/profile'
import { tauriInvoke } from './tauri'

export const listProfiles = () => tauriInvoke<Profile[]>('list_profiles')
export const createProfile = (profile: Profile) => tauriInvoke<void>('create_profile', { profile })
export const updateProfile = (profile: Profile) => tauriInvoke<void>('update_profile', { profile })
export const deleteProfile = (id: string) => tauriInvoke<void>('delete_profile', { id })
