import type {
  AutomationRuntimeState,
  AutomationScriptEntry,
  BookmarkEntry,
  ExtensionEntry,
  ExportProfileArchiveResult,
  ImportProfileArchiveResult,
  InstalledRuntimeEntry,
  LogEntry,
  Profile,
  QuickLink,
  RuntimeInstallResult,
  RuntimeInstallState,
  RuntimeReleaseAsset,
  RuntimeState,
  SoftwareSettings,
} from '../../shared/types.js'

interface IpcCommandContracts {
  list_profiles: { payload: undefined; result: Profile[] }
  create_profile: { payload: { profile: Profile }; result: void }
  update_profile: { payload: { originalId: string; profile: Profile }; result: void }
  delete_profile: { payload: { id: string }; result: void }
  export_profile_archive: { payload: { profileId: string }; result: string | undefined }
  import_profile_archive: { payload: undefined; result: Profile | undefined }
  export_profile_archives: {
    payload: { profileIds: string[]; includeUserData: boolean }
    result: ExportProfileArchiveResult[]
  }
  import_profile_archives: { payload: undefined; result: ImportProfileArchiveResult[] }
  get_software_settings: { payload: undefined; result: SoftwareSettings }
  save_software_settings: { payload: { settings: SoftwareSettings }; result: SoftwareSettings }
  launch_profile: { payload: { profileId: string }; result: RuntimeState }
  stop_profile: { payload: { profileId: string }; result: void }
  get_runtime_state: { payload: { profileId: string }; result: RuntimeState }
  test_fingerprint_user_agent_url: { payload: { url: string }; result: { userAgent: string } }
  list_runtime_releases: { payload: undefined; result: RuntimeReleaseAsset[] }
  list_installed_runtimes: { payload: undefined; result: InstalledRuntimeEntry[] }
  install_runtime_release: { payload: { asset: RuntimeReleaseAsset }; result: RuntimeInstallResult }
  get_runtime_install_state: { payload: undefined; result: RuntimeInstallState }
  list_automation_scripts: { payload: undefined; result: AutomationScriptEntry[] }
  get_automation_runtime_states: { payload: { profileId: string }; result: AutomationRuntimeState[] }
  start_automation_script: { payload: { profileId: string; scriptName: string }; result: AutomationRuntimeState }
  stop_automation_script: { payload: { profileId: string; scriptName: string }; result: AutomationRuntimeState }
  open_automation_scripts_dir: { payload: undefined; result: string }
  get_logs: { payload: { profileId: string }; result: LogEntry[] }
  list_extensions: { payload: undefined; result: ExtensionEntry[] }
  import_extension_dir: { payload: { id: string; sourcePath: string }; result: ExtensionEntry }
  import_extension_crx: { payload: { id: string; sourcePath: string }; result: ExtensionEntry }
  get_bookmarks: { payload: { profileId: string }; result: BookmarkEntry[] }
  save_bookmarks: { payload: { profileId: string; bookmarks: BookmarkEntry[] }; result: void }
  get_quick_links: { payload: { profileId: string }; result: QuickLink[] }
  save_quick_links: { payload: { profileId: string; quickLinks: QuickLink[] }; result: void }
}

export const commandContracts = {
  list_profiles: true,
  create_profile: true,
  update_profile: true,
  delete_profile: true,
  export_profile_archive: true,
  import_profile_archive: true,
  export_profile_archives: true,
  import_profile_archives: true,
  get_software_settings: true,
  save_software_settings: true,
  launch_profile: true,
  stop_profile: true,
  get_runtime_state: true,
  test_fingerprint_user_agent_url: true,
  list_runtime_releases: true,
  list_installed_runtimes: true,
  install_runtime_release: true,
  get_runtime_install_state: true,
  list_automation_scripts: true,
  get_automation_runtime_states: true,
  start_automation_script: true,
  stop_automation_script: true,
  open_automation_scripts_dir: true,
  get_logs: true,
  list_extensions: true,
  import_extension_dir: true,
  import_extension_crx: true,
  get_bookmarks: true,
  save_bookmarks: true,
  get_quick_links: true,
  save_quick_links: true,
} as const satisfies Record<keyof IpcCommandContracts, true>

export const commandNames = Object.keys(commandContracts) as CommandName[]

export type CommandName = keyof IpcCommandContracts
export type CommandPayload<C extends CommandName = CommandName> = IpcCommandContracts[C]['payload']
export type CommandResult<C extends CommandName = CommandName> = IpcCommandContracts[C]['result']
export type AppInvoke = <C extends CommandName>(
  command: C,
  ...args: CommandPayload<C> extends undefined ? [payload?: undefined] : [payload: CommandPayload<C>]
) => Promise<CommandResult<C>>

export const isCommandName = (value: string): value is CommandName => commandNames.includes(value as CommandName)
