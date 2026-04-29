export const commandNames = [
  'list_profiles',
  'create_profile',
  'update_profile',
  'delete_profile',
  'export_profile_archive',
  'import_profile_archive',
  'export_profile_archives',
  'import_profile_archives',
  'launch_profile',
  'stop_profile',
  'get_runtime_state',
  'list_runtime_releases',
  'install_runtime_release',
  'get_runtime_install_state',
  'list_automation_scripts',
  'get_automation_runtime_states',
  'start_automation_script',
  'stop_automation_script',
  'open_automation_scripts_dir',
  'get_logs',
  'list_extensions',
  'import_extension_dir',
  'import_extension_crx',
  'get_bookmarks',
  'save_bookmarks',
  'get_quick_links',
  'save_quick_links',
] as const

export type CommandName = (typeof commandNames)[number]
export type CommandPayload = Record<string, unknown> | undefined
export const isCommandName = (value: string): value is CommandName => commandNames.includes(value as CommandName)
