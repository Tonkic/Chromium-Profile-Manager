<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useSoftwareSettingsStore } from '../stores/software_settings'

const softwareSettingsStore = useSoftwareSettingsStore()
const draft = reactive({
  fontFamily: softwareSettingsStore.fontFamily,
  accentColor: softwareSettingsStore.accentColor,
  backgroundColor: softwareSettingsStore.backgroundColor,
})

watch(
  () => [softwareSettingsStore.fontFamily, softwareSettingsStore.accentColor, softwareSettingsStore.backgroundColor],
  () => {
    draft.fontFamily = softwareSettingsStore.fontFamily
    draft.accentColor = softwareSettingsStore.accentColor
    draft.backgroundColor = softwareSettingsStore.backgroundColor
  },
)

const save = () => {
  softwareSettingsStore.fontFamily = draft.fontFamily
  softwareSettingsStore.accentColor = draft.accentColor
  softwareSettingsStore.backgroundColor = draft.backgroundColor
  softwareSettingsStore.save()
}

const reset = () => {
  softwareSettingsStore.reset()
}
</script>

<template>
  <section class="software-settings-page">
    <section class="hero-card settings-hero-card">
      <div>
        <p class="eyebrow">Preferences</p>
        <h2>Software Settings</h2>
        <p class="muted">调整全局字体、主色与背景，这里是软件级设置，不影响单个 Profile 配置。</p>
      </div>
      <div class="theme-preview-surface compact-preview">
        <span class="runtime-badge" data-status="running">running</span>
        <button type="button">Primary</button>
        <button type="button" class="secondary-button">Secondary</button>
      </div>
    </section>

    <section class="card software-settings-form-card">
      <form class="profile-form" @submit.prevent="save">
        <div class="grid">
          <label>
            字体
            <input v-model="draft.fontFamily" placeholder="Inter, system-ui, sans-serif" />
          </label>

          <label>
            主色
            <input v-model="draft.accentColor" type="color" />
          </label>

          <label>
            背景色
            <input v-model="draft.backgroundColor" type="color" />
          </label>
        </div>

        <div class="hero-actions">
          <button type="submit">保存软件设置</button>
          <button type="button" class="secondary-button" @click="reset">恢复默认</button>
        </div>
      </form>
    </section>

    <section class="card settings-preview-card">
      <div>
        <p class="eyebrow">Live Preview</p>
        <h3>Theme sample</h3>
        <p class="muted">保存后会把主色、背景和字体应用到整个桌面应用。</p>
      </div>
      <div class="theme-preview-surface">
        <div class="theme-preview-cardlet">
          <strong>Profile card</strong>
          <span class="muted">{{ draft.fontFamily }}</span>
        </div>
        <span class="runtime-badge" data-status="starting">starting</span>
      </div>
    </section>
  </section>
</template>
