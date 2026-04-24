<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import ProfileRuntimeBadge from '../components/profile/ProfileRuntimeBadge.vue'
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal.vue'
import type { SettingsSection } from '../components/profile/ProfileSettingsNav.vue'
import { useProfilesStore } from '../stores/profiles'
import { useRuntimeStore } from '../stores/runtime'
import { useLogsStore } from '../stores/logs'
import { useExtensionsStore } from '../stores/extensions'
import { useBookmarksStore } from '../stores/bookmarks'
import type { Profile } from '../types/profile'

const profilesStore = useProfilesStore()
const runtimeStore = useRuntimeStore()
const logsStore = useLogsStore()
const extensionsStore = useExtensionsStore()
const bookmarksStore = useBookmarksStore()
const { profiles, loading } = storeToRefs(profilesStore)
const editing = ref<Profile | null>(null)
const settingsOpen = ref(false)
const activeSettingsSection = ref<SettingsSection>('general')

onMounted(async () => {
  await Promise.all([profilesStore.fetchProfiles(), extensionsStore.fetchAll()])
  await Promise.all(
    profiles.value.map(async (profile) => {
      await runtimeStore.refresh(profile.id)
      await logsStore.refresh(profile.id)
      await bookmarksStore.refresh(profile.id)
    }),
  )
  editing.value = profiles.value[0] ?? null
})

const sortedProfiles = computed(() => profiles.value)
const currentRuntime = computed(() => (editing.value ? runtimeStore.states[editing.value.id] : undefined))
const currentBookmarks = computed(() => (editing.value ? bookmarksStore.entries[editing.value.id] : []))
const currentQuickLinks = computed(() => (editing.value ? bookmarksStore.quickLinks[editing.value.id] : []))
const currentLogs = computed(() => (editing.value ? logsStore.entries[editing.value.id] : []))

const save = async (profile: Profile) => {
  await profilesStore.saveProfile(profile)
  editing.value = profilesStore.profiles.find((item) => item.id === profile.id) ?? profile
  await runtimeStore.refresh(profile.id)
  await logsStore.refresh(profile.id)
  await bookmarksStore.refresh(profile.id)
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

const openSettings = (section: SettingsSection = 'general') => {
  if (!editing.value) {
    return
  }
  activeSettingsSection.value = section
  settingsOpen.value = true
}

</script>

<template>
  <section class="page profiles-page">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div>
          <p class="eyebrow">Chromium Profile Manager</p>
          <h1>Profiles</h1>
        </div>
      </div>
      <p v-if="loading">加载中...</p>
      <ul class="profile-list">
        <li v-for="profile in sortedProfiles" :key="profile.id" :class="['profile-list-item', { active: editing?.id === profile.id }]">
          <button class="profile-item single-action-item" @click="editing = profile; openSettings()">
            <div class="profile-item-main">
              <strong>{{ profile.name }}</strong>
              <p>{{ profile.id }}</p>
            </div>
            <ProfileRuntimeBadge :status="runtimeStore.states[profile.id]?.status" />
          </button>
        </li>
      </ul>
    </aside>

    <main class="content compact-content selection-only-content">
      <section class="hero-card compact-hero selection-only-hero" :title="editing ? `当前选中 ${editing.name}` : '请选择一个 Profile'">
        <div>
          <h2>{{ editing ? editing.name : '选择一个 Profile' }}</h2>
        </div>
      </section>
    </main>

    <ProfileSettingsModal
      :open="settingsOpen"
      :profile="editing"
      :section="activeSettingsSection"
      :runtime="currentRuntime"
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
