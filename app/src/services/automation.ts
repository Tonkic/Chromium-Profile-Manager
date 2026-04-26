import { tauriInvoke } from './tauri'
import type { AutomationRuntimeState, AutomationScriptEntry } from '../types/automation'

export const listAutomationScripts = () => tauriInvoke<AutomationScriptEntry[]>('list_automation_scripts')

export const getAutomationRuntimeStates = (profileId: string) =>
  tauriInvoke<AutomationRuntimeState[]>('get_automation_runtime_states', { profileId })

export const startAutomationScript = (profileId: string, scriptName: string) =>
  tauriInvoke<AutomationRuntimeState>('start_automation_script', { profileId, scriptName })

export const stopAutomationScript = (profileId: string, scriptName: string) =>
  tauriInvoke<AutomationRuntimeState>('stop_automation_script', { profileId, scriptName })

export const openAutomationScriptsDir = () => tauriInvoke<string>('open_automation_scripts_dir')
