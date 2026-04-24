export interface LogEntry {
  timestamp: string
  level: string
  message: string
  command?: string[]
  exitCode?: number
}
