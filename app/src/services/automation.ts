import { tauriInvoke } from './tauri'

export const listAutomationScripts = () => tauriInvoke('list_automation_scripts')

export const getAutomationRuntimeStates = (profileId: string) =>
  tauriInvoke('get_automation_runtime_states', { profileId })

export const startAutomationScript = (profileId: string, scriptName: string) =>
  tauriInvoke('start_automation_script', { profileId, scriptName })

export const stopAutomationScript = (profileId: string, scriptName: string) =>
  tauriInvoke('stop_automation_script', { profileId, scriptName })

export const openAutomationScriptsDir = () => tauriInvoke('open_automation_scripts_dir')
