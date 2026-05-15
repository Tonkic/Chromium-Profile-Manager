import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { SettingsSection } from '../components/profile/ProfileSettingsNav.vue'
import { useAutomationStore } from '../stores/automation'
import { useBookmarksStore } from '../stores/bookmarks'
import { useExtensionsStore } from '../stores/extensions'
import { useLogsStore } from '../stores/logs'
import { useProfilesStore } from '../stores/profiles'
import { useRuntimeStore } from '../stores/runtime'
import { useSoftwareSettingsStore } from '../stores/software_settings'
import type { Profile } from '../types/profile'
import { emptyProfile } from '../types/profile'
import { inferRuntimeKindFromPath, supportsFingerprintSettings } from '../utils/runtimeCapabilities'

export const useProfilesWorkspace = () => {
  const profilesStore = useProfilesStore()
  const runtimeStore = useRuntimeStore()
  const logsStore = useLogsStore()
  const extensionsStore = useExtensionsStore()
  const bookmarksStore = useBookmarksStore()
  const automationStore = useAutomationStore()
  const softwareSettingsStore = useSoftwareSettingsStore()

  const { profiles } = storeToRefs(profilesStore)
  const { scripts } = storeToRefs(automationStore)

  const editing = ref<Profile | null>(null)
  const settingsOpen = ref(false)
  const activeSettingsSection = ref<SettingsSection>('general')
  const saveToast = ref('')
  const automationProfileId = ref<string | null>(null)
  let runtimeRefreshTimer: number | undefined
  let saveToastTimer: number | undefined

  const sortedProfiles = computed(() => profiles.value)
  const currentBookmarks = computed(() => (editing.value ? bookmarksStore.entries[editing.value.id] : []))
  const currentQuickLinks = computed(() => (editing.value ? bookmarksStore.quickLinks[editing.value.id] : []))
  const currentLogs = computed(() => (editing.value ? logsStore.entries[editing.value.id] : []))
  const editingRuntimeKind = computed(() => {
    const override = editing.value?.browserPathOverride?.trim()
    if (override) {
      return inferRuntimeKindFromPath(override)
    }
    return softwareSettingsStore.defaultRuntimeKind || inferRuntimeKindFromPath(softwareSettingsStore.defaultBrowserPath)
  })
  const fingerprintSettingsEnabled = computed(() => supportsFingerprintSettings(editingRuntimeKind.value))
  const isRunningStatus = (status?: string) => status === 'starting' || status === 'running'

  const automationRows = computed(() => {
    if (!editing.value || automationProfileId.value !== editing.value.id) {
      return []
    }
    return scripts.value.map((script) => ({
      script,
      state: automationStore.getState(editing.value!.id, script.name),
    }))
  })

  const refreshRuntimeStates = async () => {
    await Promise.all(profiles.value.map((profile) => runtimeStore.refresh(profile.id)))
  }

  onMounted(async () => {
    await Promise.all([
      profilesStore.fetchProfiles(),
      extensionsStore.fetchAll(),
      automationStore.refreshScripts(),
      softwareSettingsStore.loadRuntimeSettings(),
    ])
    await Promise.all(
      profiles.value.map(async (profile) => {
        await runtimeStore.refresh(profile.id)
        await logsStore.refresh(profile.id)
        await bookmarksStore.refresh(profile.id)
      }),
    )
    editing.value = profiles.value[0] ?? null
    if (editing.value) {
      await automationStore.refreshProfileStates(editing.value.id)
    }
    runtimeRefreshTimer = window.setInterval(refreshRuntimeStates, 2000)
  })

  onUnmounted(() => {
    if (runtimeRefreshTimer !== undefined) {
      window.clearInterval(runtimeRefreshTimer)
    }
    if (saveToastTimer !== undefined) {
      window.clearTimeout(saveToastTimer)
    }
  })

  watch(
    () => editing.value?.id,
    async (profileId, previousProfileId) => {
      if (!profileId || profileId === previousProfileId) {
        return
      }
      await Promise.all([
        runtimeStore.refresh(profileId),
        logsStore.refresh(profileId),
        bookmarksStore.refresh(profileId),
        automationStore.refreshProfileStates(profileId),
      ])
    },
  )

  const showSaveToast = () => {
    saveToast.value = 'Profile 已保存'
    if (saveToastTimer !== undefined) {
      window.clearTimeout(saveToastTimer)
    }
    saveToastTimer = window.setTimeout(() => {
      saveToast.value = ''
      saveToastTimer = undefined
    }, 1800)
  }

  const openSettings = (profile: Profile) => {
    editing.value = profile
    activeSettingsSection.value = 'general'
    settingsOpen.value = true
  }

  const closeSettings = () => {
    settingsOpen.value = false
  }

  const save = async (profile: Profile, originalId?: string, closeAfterSave = false) => {
    const sourceId = originalId ?? profile.id
    const shouldRename = sourceId !== profile.id
    if (shouldRename) {
      const confirmed = window.confirm(
        `你正在修改 Profile ID。\n\nID 是本地目录标识（data/profiles/<id>）并关联日志（data/logs/<id>.log）。\n确认后会把 ${sourceId} 迁移到 ${profile.id}。`,
      )
      if (!confirmed) {
        return
      }
    }

    try {
      await profilesStore.saveProfile(profile, sourceId)
      if (shouldRename) {
        runtimeStore.renameProfile(sourceId, profile.id)
        logsStore.renameProfile(sourceId, profile.id)
        bookmarksStore.renameProfile(sourceId, profile.id)
        automationStore.renameProfile(sourceId, profile.id)
      }

      editing.value = profilesStore.profiles.find((item) => item.id === profile.id) ?? profile
      await runtimeStore.refresh(profile.id)
      await logsStore.refresh(profile.id)
      await bookmarksStore.refresh(profile.id)
      await automationStore.refreshProfileStates(profile.id)
      showSaveToast()
      if (closeAfterSave) {
        settingsOpen.value = false
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  const saveBookmarks = async (entries: { title: string; url: string }[]) => {
    if (editing.value) {
      await bookmarksStore.save(editing.value.id, entries)
    }
  }

  const saveQuickLinks = async (entries: { title: string; url: string }[]) => {
    if (editing.value) {
      await bookmarksStore.saveQuick(editing.value.id, entries)
    }
  }

  const importExtensionDir = async (id: string, sourcePath: string) => {
    await extensionsStore.importDir(id, sourcePath)
  }

  const importExtensionCrx = async (id: string, sourcePath: string) => {
    await extensionsStore.importCrx(id, sourcePath)
  }

  const handleLaunch = async (id: string) => {
    await runtimeStore.launch(id)
    await Promise.all([runtimeStore.refresh(id), logsStore.refresh(id)])
  }

  const handleStop = async (id: string) => {
    await runtimeStore.stop(id)
    await logsStore.refresh(id)
  }

  const toggleLaunch = async (profileId: string) => {
    const status = runtimeStore.states[profileId]?.status
    if (isRunningStatus(status)) {
      await handleStop(profileId)
    } else {
      await handleLaunch(profileId)
    }
  }

  const createProfileDraft = async () => {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    const profile: Profile = {
      ...emptyProfile(),
      id: `profile-${stamp}`,
      name: `新 Profile ${sortedProfiles.value.length + 1}`,
      userDataDir: `./data/profiles/profile-${stamp}/user-data`,
      extraArgs: ['--no-first-run', '--disable-sync'],
    }
    editing.value = profile
    activeSettingsSection.value = 'general'
    await nextTick()
    settingsOpen.value = true
  }

  const toggleAutomationMenu = async (profile: Profile) => {
    editing.value = profile
    automationProfileId.value = automationProfileId.value === profile.id ? null : profile.id
    if (automationProfileId.value) {
      await Promise.all([automationStore.refreshScripts(), automationStore.refreshProfileStates(profile.id)])
    }
  }

  const handleAutomationStart = async (profileId: string, scriptName: string) => {
    await automationStore.start(profileId, scriptName)
    await automationStore.refreshProfileStates(profileId)
  }

  const handleAutomationStop = async (profileId: string, scriptName: string) => {
    await automationStore.stop(profileId, scriptName)
    await automationStore.refreshProfileStates(profileId)
  }

  const openAutomationDir = async () => {
    await automationStore.openScriptsDir()
  }

  return {
    activeSettingsSection,
    automationProfileId,
    automationRows,
    automationStore,
    closeSettings,
    createProfileDraft,
    currentBookmarks,
    currentLogs,
    currentQuickLinks,
    editing,
    extensionsStore,
    fingerprintSettingsEnabled,
    handleAutomationStart,
    handleAutomationStop,
    handleLaunch,
    handleStop,
    importExtensionCrx,
    importExtensionDir,
    isRunningStatus,
    openAutomationDir,
    openSettings,
    runtimeStore,
    save,
    saveBookmarks,
    saveQuickLinks,
    saveToast,
    settingsOpen,
    sortedProfiles,
    toggleAutomationMenu,
    toggleLaunch,
  }
}
