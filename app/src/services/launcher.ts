import type { RuntimeState } from '../types/runtime'
import { tauriInvoke } from './tauri'

export const launchProfile = (profileId: string) => tauriInvoke<RuntimeState>('launch_profile', { profileId })
export const stopProfile = (profileId: string) => tauriInvoke<void>('stop_profile', { profileId })
export const getRuntimeState = (profileId: string) => tauriInvoke<RuntimeState>('get_runtime_state', { profileId })
