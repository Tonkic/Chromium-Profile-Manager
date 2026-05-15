import type { ChildProcess } from 'node:child_process'
import type { AutomationRuntimeState } from '../../shared/types.js'

export type {
  AutomationRuntimeState,
  AutomationScriptEntry,
  AutomationStatus,
  BookmarkEntry,
  DisableSpoofingTarget,
  DownloadableRuntimeKind,
  ExtensionEntry,
  ExportProfileArchiveResult,
  FingerprintLaunchSettings,
  FingerprintSettings,
  FingerprintSource,
  ImportProfileArchiveResult,
  InstalledRuntimeEntry,
  LogEntry,
  Profile,
  ProfileExtensionRef,
  QuickLink,
  RuntimeInstallResult,
  RuntimeInstallState,
  RuntimeKind,
  RuntimeReleaseAsset,
  RuntimeState,
  RuntimeStatus,
  SoftwareSettings,
} from '../../shared/types.js'

export interface AutomationRuntimeRecord extends AutomationRuntimeState {
  child?: ChildProcess
}
