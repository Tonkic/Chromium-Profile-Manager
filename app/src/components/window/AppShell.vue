<script setup lang="ts">
import { ref } from 'vue'
import WindowTitlebar from './WindowTitlebar.vue'
import ProfilesPage from '../../pages/ProfilesPage.vue'
import SoftwareSettingsPage from '../../pages/SoftwareSettingsPage.vue'

type AppSection = 'profiles' | 'software-settings'

const activeSection = ref<AppSection>('profiles')

const sections: Array<{ key: AppSection; eyebrow: string; label: string; description: string }> = [
  { key: 'profiles', eyebrow: 'Workspace', label: 'Profiles', description: '管理浏览器配置、启动状态与自动化脚本' },
  { key: 'software-settings', eyebrow: 'Preferences', label: 'Software Settings', description: '字体、配色、背景等软件级设置' },
]
</script>

<template>
  <div class="app-shell">
    <WindowTitlebar />
    <div class="app-shell-layout">
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

      <main class="app-shell__content">
        <ProfilesPage v-if="activeSection === 'profiles'" />
        <SoftwareSettingsPage v-else />
      </main>
    </div>
  </div>
</template>
