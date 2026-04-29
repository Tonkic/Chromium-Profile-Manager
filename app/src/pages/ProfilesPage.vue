<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import ProfileRuntimeBadge from '../components/profile/ProfileRuntimeBadge.vue'
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal.vue'
import type { SettingsSection } from '../components/profile/ProfileSettingsNav.vue'
import { useProfilesStore } from '../stores/profiles'
import { useRuntimeStore } from '../stores/runtime'
import { useLogsStore } from '../stores/logs'
import { useExtensionsStore } from '../stores/extensions'
import { useBookmarksStore } from '../stores/bookmarks'
import { useAutomationStore } from '../stores/automation'
import type { Profile } from '../types/profile'
import { emptyProfile } from '../types/profile'

const profilesStore = useProfilesStore()
const runtimeStore = useRuntimeStore()
const logsStore = useLogsStore()
const extensionsStore = useExtensionsStore()
const bookmarksStore = useBookmarksStore()
const automationStore = useAutomationStore()

const { profiles } = storeToRefs(profilesStore)
const { scripts } = storeToRefs(automationStore)

const editing = ref<Profile | null>(null)
const settingsOpen = ref(false)
const activeSettingsSection = ref<SettingsSection>('general')

watch(editing, () => {
  settingsOpen.value = false
})
const automationProfileId = ref<string | null>(null)
let runtimeRefreshTimer: number | undefined

const refreshRuntimeStates = async () => {
  await Promise.all(profiles.value.map((profile) => runtimeStore.refresh(profile.id)))
}

onMounted(async () => {
  await Promise.all([profilesStore.fetchProfiles(), extensionsStore.fetchAll(), automationStore.refreshScripts()])
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

const sortedProfiles = computed(() => profiles.value)
const currentBookmarks = computed(() => (editing.value ? bookmarksStore.entries[editing.value.id] : []))
const currentQuickLinks = computed(() => (editing.value ? bookmarksStore.quickLinks[editing.value.id] : []))
const currentLogs = computed(() => (editing.value ? logsStore.entries[editing.value.id] : []))
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

const save = async (profile: Profile, originalId?: string) => {
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
}

const saveBookmarks = async (entries: { title: string; url: string }[]) => {
  if (!editing.value) {
    return
  }
  await bookmarksStore.save(editing.value.id, entries)
}

const saveQuickLinks = async (entries: { title: string; url: string }[]) => {
  if (!editing.value) {
    return
  }
  await bookmarksStore.saveQuick(editing.value.id, entries)
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

</script>

<template>
  <section class="profiles-detail-content">
    <section class="profiles-scroll-grid">
      <article
        v-for="profile in sortedProfiles"
        :key="profile.id"
        :class="['profile-ops-card', { active: editing?.id === profile.id }]"
        @click="editing = profile"
      >
        <div class="profile-ops-main">
          <strong class="text-rect">{{ profile.name }}</strong>
          <div class="hero-runtime-row">
            <ProfileRuntimeBadge :status="runtimeStore.states[profile.id]?.status" />
            <span class="muted">PID: {{ runtimeStore.states[profile.id]?.pid ?? '-' }}</span>
          </div>
        </div>

        <div class="profile-ops-actions" @click.stop>
          <button @click="toggleLaunch(profile.id)">
            {{ isRunningStatus(runtimeStore.states[profile.id]?.status) ? '停止' : '启动' }}
          </button>
          <button class="secondary-button" @click="toggleAutomationMenu(profile)">自动化</button>
          <button class="secondary-button" @click="editing = profile; settingsOpen = true">设置</button>
        </div>
      </article>

      <button class="profile-create-card" type="button" title="新建 Profile" @click="createProfileDraft">
        <span>+</span>
      </button>
    </section>

    <section v-if="editing && automationProfileId === editing.id" class="card automation-menu">
      <div class="card-header">
        <div>
          <h3>自动化脚本 · {{ editing.name }}</h3>
          <p class="muted">目录：scripts/automation · 执行器：python</p>
        </div>
        <div class="hero-actions">
          <button class="secondary-button" @click="automationStore.refreshScripts">刷新脚本</button>
          <button class="secondary-button" @click="openAutomationDir">打开脚本目录</button>
        </div>
      </div>

      <p v-if="automationStore.error" class="error-text">{{ automationStore.error }}</p>
      <p v-if="automationStore.loadingScripts || automationStore.loadingStates" class="muted">加载中...</p>

      <ul class="automation-list">
        <li v-for="item in automationRows" :key="item.script.name" class="automation-item">
          <div class="automation-item-main">
            <strong class="text-rect">{{ item.script.name }}</strong>
            <p class="muted text-rect">{{ item.script.relativePath }}</p>
            <div class="automation-meta">
              <span class="runtime-badge" :data-status="item.state?.status ?? 'idle'">{{ item.state?.status ?? 'idle' }}</span>
              <span class="muted">PID: {{ item.state?.pid ?? '-' }}</span>
              <span class="muted">Exit: {{ item.state?.exitCode ?? '-' }}</span>
            </div>
            <p v-if="item.state?.lastError" class="error-text text-rect">{{ item.state.lastError }}</p>
          </div>
          <div class="automation-item-actions">
            <button v-if="!isRunningStatus(item.state?.status)" @click="handleAutomationStart(editing.id, item.script.name)">
              启动
            </button>
            <button v-else class="secondary-button" @click="handleAutomationStop(editing.id, item.script.name)">停止</button>
          </div>
        </li>
      </ul>

      <p v-if="automationRows.length === 0 && !automationStore.loadingScripts" class="muted">
        scripts/automation 下暂无 .py 脚本。
      </p>
    </section>

    <ProfileSettingsModal
      :open="settingsOpen"
      :profile="editing"
      :section="activeSettingsSection"
      :runtime="editing ? runtimeStore.states[editing.id] : undefined"
      :logs="currentLogs"
      :bookmarks="currentBookmarks"
      :quick-links="currentQuickLinks"
      :extensions="extensionsStore.items"
      @close="settingsOpen = false"
      @update:section="activeSettingsSection = $event"
      @save="save"
      @save-bookmarks="saveBookmarks"
      @save-quick-links="saveQuickLinks"
      @import-dir="importExtensionDir"
      @import-crx="importExtensionCrx"
      @launch="handleLaunch"
      @stop="handleStop"
    />
  </section>
</template>
