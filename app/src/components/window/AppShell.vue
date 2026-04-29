<script setup lang="ts">
import { computed, ref } from 'vue'
import WindowTitlebar from './WindowTitlebar.vue'
import ProfilesPage from '../../pages/ProfilesPage.vue'
import ProfileTransferPage from '../../pages/ProfileTransferPage.vue'
import SoftwareSettingsPage from '../../pages/SoftwareSettingsPage.vue'

type AppSection = 'profiles' | 'profile-transfer' | 'software-settings'

const activeSection = ref<AppSection>('profiles')
const renderVersion = ref(0)

const sections: Array<{ key: AppSection; eyebrow: string; label: string; description: string }> = [
  { key: 'profiles', eyebrow: 'Workspace', label: 'Profiles', description: '管理浏览器配置、启动状态与自动化脚本' },
  { key: 'profile-transfer', eyebrow: 'Workspace', label: 'Import / Export', description: '批量导入导出 Profile，并可选包含 userData' },
  { key: 'software-settings', eyebrow: 'Preferences', label: 'Software Settings', description: '主题、字体与外观设置' },
]

const currentSection = computed(() => sections.find((section) => section.key === activeSection.value) ?? sections[0])
const currentRenderKey = computed(() => `${activeSection.value}-${renderVersion.value}`)

const openSettings = () => {
  activeSection.value = 'software-settings'
}

const refreshCurrentSection = () => {
  renderVersion.value += 1
}
</script>

<template>
  <div class="app-shell">
    <WindowTitlebar @open-settings="openSettings" @request-refresh="refreshCurrentSection" />
    <div class="app-shell-body">
      <div class="app-shell-frame">
        <aside class="app-nav-sidebar">
          <div class="app-nav-brand">
            <div class="app-nav-logo" aria-hidden="true">CP</div>
            <div>
              <p class="eyebrow">Chromium</p>
              <h1>Profile Manager</h1>
            </div>
          </div>

          <nav class="app-nav" aria-label="应用导航">
            <button
              v-for="section in sections"
              :key="section.key"
              :class="['app-nav-item', { active: activeSection === section.key }]"
              @click="activeSection = section.key"
            >
              <small class="app-nav-item__eyebrow">{{ section.eyebrow }}</small>
              <span>{{ section.label }}</span>
              <small>{{ section.description }}</small>
            </button>
          </nav>

          <div class="app-nav-footer">
            <span>Local Chromium Workspace</span>
            <small>Profiles · Automation · Runtime</small>
          </div>
        </aside>

        <section class="app-main-column">
          <header class="app-main-toolbar">
            <div>
              <p class="eyebrow">{{ currentSection.eyebrow }}</p>
              <h2>{{ currentSection.label }}</h2>
            </div>
            <div class="app-main-metrics">
              <span class="app-metric-pill">Glass UI</span>
              <span class="app-metric-pill">Desktop</span>
              <span class="app-metric-pill">Local Data</span>
            </div>
          </header>

          <main class="app-shell__content">
            <ProfilesPage v-if="activeSection === 'profiles'" :key="currentRenderKey" />
            <ProfileTransferPage v-else-if="activeSection === 'profile-transfer'" :key="currentRenderKey" />
            <SoftwareSettingsPage v-else :key="currentRenderKey" />
          </main>
        </section>
      </div>
    </div>
  </div>
</template>
