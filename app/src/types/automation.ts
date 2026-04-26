export type AutomationStatus = 'idle' | 'starting' | 'running' | 'stopped' | 'error'

export interface AutomationScriptEntry {
  name: string
  relativePath: string
  absolutePath: string
}

export interface AutomationRuntimeState {
  profileId: string
  scriptName: string
  status: AutomationStatus
  pid?: number
  exitCode?: number
  lastError?: string
  startedAt?: string
  stoppedAt?: string
  runner: string
}
