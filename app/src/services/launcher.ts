import { tauriInvoke } from './tauri'

export const launchProfile = (profileId: string) => tauriInvoke('launch_profile', { profileId })
export const stopProfile = (profileId: string) => tauriInvoke('stop_profile', { profileId })
export const getRuntimeState = (profileId: string) => tauriInvoke('get_runtime_state', { profileId })
