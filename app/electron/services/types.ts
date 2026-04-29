import type { ChildProcess } from 'node:child_process'

export interface ProfileExtensionRef {
  id: string
  enabled: boolean
}

export interface Profile {
  id: string
  name: string
  note?: string
  browserPath: string
  userDataDir: string
  proxy?: string
  lang?: string
  timezone?: string
  windowSize?: [number, number]
  extensions: ProfileExtensionRef[]
  extraArgs: string[]
  bookmarkSetId?: string
  createdAt: string
  updatedAt: string
}

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

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  command?: string[]
  exitCode?: number
}

export interface ExtensionEntry {
  id: string
  kind: 'dir' | 'crx'
  path: string
}

export interface BookmarkEntry {
  title: string
  url: string
}

export interface QuickLink {
  title: string
  url: string
}

export interface AutomationScriptEntry {
  name: string
  relativePath: string
  absolutePath: string
}

export type AutomationStatus = 'idle' | 'starting' | 'running' | 'stopped' | 'error'

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

export interface AutomationRuntimeRecord extends AutomationRuntimeState {
  child?: ChildProcess
}
