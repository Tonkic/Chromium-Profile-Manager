<script setup lang="ts">
import ProfileRuntimeBadge from '../components/profile/ProfileRuntimeBadge.vue'
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal.vue'
import { useProfilesWorkspace } from '../composables/useProfilesWorkspace'

const {
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
} = useProfilesWorkspace()
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
          <button class="secondary-button" @click="openSettings(profile)">设置</button>
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

    <div v-if="saveToast" class="profile-save-toast success-text">{{ saveToast }}</div>

    <ProfileSettingsModal
      :open="settingsOpen"
      :profile="editing"
      :section="activeSettingsSection"
      :runtime="editing ? runtimeStore.states[editing.id] : undefined"
      :logs="currentLogs"
      :bookmarks="currentBookmarks"
      :quick-links="currentQuickLinks"
      :extensions="extensionsStore.items"
      :fingerprint-settings-enabled="fingerprintSettingsEnabled"
      @close="closeSettings"
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
