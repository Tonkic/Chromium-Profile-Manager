<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProfileForm from './ProfileForm.vue'
import ProfileLogsPanel from './ProfileLogsPanel.vue'
import ProfileBookmarksPanel from './ProfileBookmarksPanel.vue'
import ProfileExtensionsSettings from './ProfileExtensionsSettings.vue'
import ProfileSettingsNav, { type SettingsSection } from './ProfileSettingsNav.vue'
import LaunchButton from './LaunchButton.vue'
import type { Profile } from '../../types/profile'
import type { RuntimeState } from '../../types/runtime'
import type { LogEntry } from '../../types/logs'
import type { BookmarkEntry, QuickLink } from '../../types/bookmark'
import type { ExtensionEntry } from '../../types/extension'

const props = defineProps<{
  open: boolean
  profile: Profile | null
  section: SettingsSection
  runtime?: RuntimeState
  logs?: LogEntry[]
  bookmarks?: BookmarkEntry[]
  quickLinks?: QuickLink[]
  extensions?: ExtensionEntry[]
  fingerprintSettingsEnabled?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [profile: Profile, originalId: string, closeAfterSave?: boolean]
  'update:section': [section: SettingsSection]
  saveBookmarks: [entries: BookmarkEntry[]]
  saveQuickLinks: [entries: QuickLink[]]
  importDir: [id: string, sourcePath: string]
  importCrx: [id: string, sourcePath: string]
  launch: [id: string]
  stop: [id: string]
}>()

const profileFormRef = ref<InstanceType<typeof ProfileForm> | null>(null)
const formDirty = ref(false)
const closeAfterNextSave = ref(false)

watch(
  () => [props.section, props.fingerprintSettingsEnabled] as const,
  ([section, fingerprintSettingsEnabled]) => {
    if (section === 'fingerprint' && !fingerprintSettingsEnabled) {
      emit('update:section', 'general')
    }
  },
  { immediate: true },
)

const effectiveFormSection = computed(() =>
  props.section === 'fingerprint' && props.fingerprintSettingsEnabled ? 'fingerprint' : 'general',
)

const isRunning = computed(() => {
  const status = props.runtime?.status
  return status === 'starting' || status === 'running'
})

const toggleLaunch = () => {
  if (!props.profile) {
    return
  }
  if (isRunning.value) {
    emit('stop', props.profile.id)
  } else {
    emit('launch', props.profile.id)
  }
}

const requestClose = () => {
  if (!formDirty.value) {
    emit('close')
    return
  }
  const confirmed = window.confirm('当前 Profile 设置有未保存更改。是否保存后退出？')
  if (!confirmed) {
    return
  }
  closeAfterNextSave.value = true
  profileFormRef.value?.submit()
}

const handleFormSubmit = (profileValue: Profile, originalId: string) => {
  const shouldClose = closeAfterNextSave.value
  closeAfterNextSave.value = false
  emit('save', profileValue, originalId, shouldClose)
}

const handleImportDir = (id: string, sourcePath: string) => emit('importDir', id, sourcePath)
const handleImportCrx = (id: string, sourcePath: string) => emit('importCrx', id, sourcePath)
</script>

<template>
  <div v-if="open && profile" class="settings-modal-backdrop" @click.self="requestClose">
    <section class="settings-modal" role="dialog" aria-modal="true" aria-label="Profile 设置">
      <button class="settings-modal-close" type="button" title="关闭设置" aria-label="关闭设置" @click="requestClose">
        <span class="window-control-close" />
      </button>
      <div class="settings-modal-body full-height-body">
        <aside class="settings-modal-sidebar fixed-left-nav">
          <div class="settings-sidebar-header" :title="`${profile.name} 设置`">
            <div>
              <p class="eyebrow">Profile Settings</p>
              <h2>{{ profile.name }}</h2>
              <p class="muted text-rect">{{ profile.id }}</p>
            </div>
          </div>
          <ProfileSettingsNav :model-value="section" :fingerprint-enabled="fingerprintSettingsEnabled" @update:model-value="emit('update:section', $event)" />
        </aside>

        <div class="settings-modal-content right-detail-pane">
          <section v-show="section === 'general' || (section === 'fingerprint' && fingerprintSettingsEnabled)" class="settings-panel">
            <div class="card-header">
              <div>
                <h3 :title="effectiveFormSection === 'fingerprint' ? '管理指纹与 User-Agent 设置' : '管理 profile 基础资料'">
                  {{ effectiveFormSection === 'fingerprint' ? '指纹设置' : '常规' }}
                </h3>
              </div>
            </div>
            <ProfileForm
              ref="profileFormRef"
              :model-value="profile"
              :available-extensions="extensions ?? []"
              :section="effectiveFormSection"
              @dirty-change="formDirty = $event"
              @submit="handleFormSubmit"
            />
          </section>

          <section v-if="section === 'launch'" class="settings-panel">
            <div class="card-header">
              <div>
                <h3 title="查看启动路径、最后命令和运行状态">启动</h3>
              </div>
            </div>
            <div class="runtime-details launch-details">
              <div>
                <dt>Runtime</dt>
                <dd class="command-preview">
                  {{ profile.browserPathOverride ? `Profile 覆盖: ${profile.browserPathOverride}` : '使用软件设置中的默认 runtime' }}
                </dd>
              </div>
              <div>
                <dt>User Data Dir</dt>
                <dd class="command-preview">{{ profile.userDataDir }}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{{ runtime?.status ?? 'idle' }}</dd>
              </div>
              <div>
                <dt>PID</dt>
                <dd>{{ runtime?.pid ?? '-' }}</dd>
              </div>
              <div class="full-row">
                <dt>最后错误</dt>
                <dd class="command-preview">{{ runtime?.lastError ?? '-' }}</dd>
              </div>
              <div v-if="runtime?.lastError?.includes('浏览器路径不存在')" class="full-row runtime-help-card">
                <dt>Runtime</dt>
                <dd>
                  当前缺少 chrome.exe 所在完整 runtime。请到“软件设置”选择默认 runtime，或在“常规”里为这个 Profile 启用单独覆盖。
                </dd>
              </div>
              <div class="full-row">
                <dt>最后命令</dt>
                <dd class="command-preview">{{ runtime?.lastCommand?.join(' ') ?? '-' }}</dd>
              </div>
            </div>
            <div class="launch-action-row">
              <LaunchButton :running="isRunning" @click="toggleLaunch" />
            </div>
          </section>

          <section v-if="section === 'extensions'" class="settings-panel">
            <ProfileExtensionsSettings
              :items="extensions ?? []"
              @import-dir="handleImportDir"
              @import-crx="handleImportCrx"
            />
          </section>

          <section v-if="section === 'bookmarks'" class="settings-panel">
            <ProfileBookmarksPanel
              :profile-id="profile.id"
              :bookmarks="bookmarks"
              :quick-links="quickLinks"
              @save-bookmarks="emit('saveBookmarks', $event)"
              @save-quick-links="emit('saveQuickLinks', $event)"
            />
          </section>

          <section v-if="section === 'logs'" class="settings-panel">
            <ProfileLogsPanel :entries="logs" />
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
