import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { BookmarkEntry, Profile, QuickLink } from '../services/types.js'
import { isCommandName, type CommandName, type CommandPayload } from './contracts.js'
import * as automation from '../services/automation.js'
import * as bookmarks from '../services/bookmarks.js'
import * as extensions from '../services/extensions.js'
import * as logs from '../services/logs.js'
import * as profiles from '../services/profiles.js'
import * as profileTransfer from '../services/profile_transfer.js'
import * as runtime from '../services/runtime.js'
import * as runtimeManager from '../services/runtime_manager.js'

const stringField = (payload: CommandPayload, key: string) => {
  const value = payload?.[key]
  if (typeof value !== 'string') {
    throw new Error(`${key} is required`)
  }
  return value
}

const objectField = <T>(payload: CommandPayload, key: string) => {
  const value = payload?.[key]
  if (!value || typeof value !== 'object') {
    throw new Error(`${key} is required`)
  }
  return value as T
}

const arrayField = <T>(payload: CommandPayload, key: string) => {
  const value = payload?.[key]
  if (!Array.isArray(value)) {
    throw new Error(`${key} is required`)
  }
  return value as T[]
}

const booleanField = (payload: CommandPayload, key: string) => {
  const value = payload?.[key]
  if (typeof value !== 'boolean') {
    throw new Error(`${key} is required`)
  }
  return value
}

const handleCommand = async (command: CommandName, payload: CommandPayload) => {
  switch (command) {
    case 'list_profiles':
      return profiles.listProfiles()
    case 'create_profile':
      return profiles.createProfile(objectField<Profile>(payload, 'profile'))
    case 'update_profile': {
      const originalId = stringField(payload, 'originalId')
      const profile = objectField<Profile>(payload, 'profile')
      await profiles.updateProfile(originalId, profile)
      if (originalId !== profile.id) {
        await logs.renameProfileLogs(originalId, profile.id)
        runtime.renameRuntimeProfile(originalId, profile.id)
        automation.renameAutomationProfile(originalId, profile.id)
      }
      return undefined
    }
    case 'delete_profile':
      return profiles.deleteProfile(stringField(payload, 'id'))
    case 'export_profile_archive':
      return profileTransfer.exportProfileArchive(stringField(payload, 'profileId'))
    case 'import_profile_archive':
      return profileTransfer.importProfileArchive()
    case 'export_profile_archives':
      return profileTransfer.exportProfileArchives(arrayField<string>(payload, 'profileIds'), booleanField(payload, 'includeUserData'))
    case 'import_profile_archives':
      return profileTransfer.importProfileArchives()
    case 'launch_profile':
      return runtime.launchProfile(stringField(payload, 'profileId'))
    case 'stop_profile':
      return runtime.stopProfile(stringField(payload, 'profileId'))
    case 'get_runtime_state':
      return runtime.getRuntimeState(stringField(payload, 'profileId'))
    case 'list_runtime_releases':
      return runtimeManager.listRuntimeReleases()
    case 'install_runtime_release':
      return runtimeManager.installRuntimeRelease(objectField<runtimeManager.RuntimeReleaseAsset>(payload, 'asset'))
    case 'get_runtime_install_state':
      return runtimeManager.getRuntimeInstallState()
    case 'list_automation_scripts':
      return automation.listAutomationScripts()
    case 'get_automation_runtime_states':
      return automation.getAutomationRuntimeStates(stringField(payload, 'profileId'))
    case 'start_automation_script':
      return automation.startAutomationScript(stringField(payload, 'profileId'), stringField(payload, 'scriptName'))
    case 'stop_automation_script':
      return automation.stopAutomationScript(stringField(payload, 'profileId'), stringField(payload, 'scriptName'))
    case 'open_automation_scripts_dir':
      return automation.openAutomationScriptsDir()
    case 'get_logs':
      return logs.getLogs(stringField(payload, 'profileId'))
    case 'list_extensions':
      return extensions.listExtensions()
    case 'import_extension_dir':
      return extensions.importExtensionDir(stringField(payload, 'id'), stringField(payload, 'sourcePath'))
    case 'import_extension_crx':
      return extensions.importExtensionCrx(stringField(payload, 'id'), stringField(payload, 'sourcePath'))
    case 'get_bookmarks':
      return bookmarks.getBookmarks(stringField(payload, 'profileId'))
    case 'save_bookmarks':
      return bookmarks.saveBookmarks(stringField(payload, 'profileId'), arrayField<BookmarkEntry>(payload, 'bookmarks'))
    case 'get_quick_links':
      return bookmarks.getQuickLinks(stringField(payload, 'profileId'))
    case 'save_quick_links':
      return bookmarks.saveQuickLinks(stringField(payload, 'profileId'), arrayField<QuickLink>(payload, 'quickLinks'))
  }
}

export const registerIpcHandlers = () => {
  ipcMain.handle('app:invoke', async (_event: IpcMainInvokeEvent, command: string, payload?: Record<string, unknown>) => {
    if (!isCommandName(command)) {
      throw new Error(`Unknown command: ${command}`)
    }
    try {
      return await handleCommand(command, payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(message)
    }
  })
}
