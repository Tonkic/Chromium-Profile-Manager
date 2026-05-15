export interface ProfileExtensionRef {
  id: string
  enabled: boolean
}

export type FingerprintSource = 'none' | 'text' | 'url' | 'json'
export type DisableSpoofingTarget = 'font' | 'audio' | 'canvas' | 'clientrects' | 'gpu'

export interface FingerprintLaunchSettings {
  seed?: string
  platform?: '' | 'windows' | 'linux' | 'macos'
  platformVersion?: string
  brand?: string
  brandVersion?: string
  hardwareConcurrency?: string
  disableNonProxiedUdp?: boolean
  disableSpoofing?: DisableSpoofingTarget[]
}

export interface FingerprintSettings {
  enabled?: boolean
  source?: FingerprintSource
  userAgentUrl?: string
  userAgentText?: string
  jsonText?: string
  launch?: FingerprintLaunchSettings
}

export interface Profile {
  id: string
  name: string
  note?: string
  browserPath: string
  browserPathOverride?: string
  userDataDir: string
  proxy?: string
  lang?: string
  timezone?: string
  windowSize?: [number, number]
  extensions: ProfileExtensionRef[]
  extraArgs: string[]
  fingerprint?: FingerprintSettings
  bookmarkSetId?: string
  createdAt: string
  updatedAt: string
}

export type RuntimeKind = 'fingerprint' | 'normal' | 'unknown'
export type DownloadableRuntimeKind = Exclude<RuntimeKind, 'unknown'>

export interface SoftwareSettings {
  defaultBrowserPath: string
  defaultRuntimeKind?: RuntimeKind
  defaultRuntimeRepo?: string
  defaultRuntimeTagName?: string
  defaultRuntimeAssetName?: string
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

export interface RuntimeReleaseAsset {
  id: number | string
  kind: DownloadableRuntimeKind
  label: string
  repo: string
  name: string
  size: number
  downloadUrl: string
  releaseName: string
  tagName: string
  publishedAt: string | null
  available: boolean
  error?: string
}

export interface RuntimeInstallState {
  status: 'idle' | 'installing' | 'installed' | 'error'
  phase?: 'downloading' | 'extracting' | 'installed' | 'error'
  message?: string
  installedPath?: string
  assetName?: string
  tagName?: string
  downloadedBytes?: number
  totalBytes?: number
  progressPercent?: number
}

export interface RuntimeInstallResult {
  browserPath: string
  installDir: string
  assetName: string
  tagName: string
  kind: DownloadableRuntimeKind
  repo: string
}

export interface InstalledRuntimeEntry {
  id: string
  kind: RuntimeKind
  label: string
  browserPath: string
  installDir: string
  displayName: string
  repo?: string
  tagName?: string
  assetName?: string
}

export interface ExportProfileArchiveResult {
  profileId: string
  filePath: string
  includesUserData: boolean
  hasUserData: boolean
}

export interface ImportProfileArchiveResult {
  archivePath: string
  profile?: Profile
  hasUserData: boolean
  restoredUserData: boolean
  error?: string
}
