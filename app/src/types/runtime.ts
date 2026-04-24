export type RuntimeStatus = 'idle' | 'starting' | 'running' | 'stopped' | 'error'

export interface RuntimeState {
  profileId: string
  status: RuntimeStatus
  pid?: number
  exitCode?: number
  lastCommand?: string[]
  lastError?: string
  startedAt?: string
  stoppedAt?: string
}
