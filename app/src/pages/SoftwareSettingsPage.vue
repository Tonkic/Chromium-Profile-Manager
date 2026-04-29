<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useSoftwareSettingsStore } from '../stores/software_settings'

const softwareSettingsStore = useSoftwareSettingsStore()

const draft = reactive({
  themeId: softwareSettingsStore.themeId,
  fontId: softwareSettingsStore.fontId,
})

watch(
  () => [softwareSettingsStore.themeId, softwareSettingsStore.fontId],
  () => {
    if (draft.themeId !== softwareSettingsStore.themeId) {
      draft.themeId = softwareSettingsStore.themeId
    }
    if (draft.fontId !== softwareSettingsStore.fontId) {
      draft.fontId = softwareSettingsStore.fontId
    }
  },
)

watch(
  () => [draft.themeId, draft.fontId],
  ([themeId, fontId]) => {
    softwareSettingsStore.preview(themeId, fontId)
  },
)

const save = () => {
  softwareSettingsStore.themeId = draft.themeId
  softwareSettingsStore.fontId = draft.fontId
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
      </div>
      <div class="theme-preview-surface compact-preview">
        <div class="theme-preview-cardlet">
          <strong>Theme</strong>
          <span class="muted">{{ softwareSettingsStore.themeOptions.find((item) => item.id === draft.themeId)?.label }}</span>
        </div>
      </div>
    </section>

    <section class="card software-settings-form-card">
      <form class="profile-form" @submit.prevent="save">
        <div class="grid">
          <label>
            主题
            <select v-model="draft.themeId">
              <option v-for="theme in softwareSettingsStore.themeOptions" :key="theme.id" :value="theme.id">
                {{ theme.label }}
              </option>
            </select>
          </label>

          <label>
            字体
            <select v-model="draft.fontId">
              <option v-for="font in softwareSettingsStore.fontOptions" :key="font.id" :value="font.id">
                {{ font.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="hero-actions">
          <button type="submit">保存软件设置</button>
          <button type="button" class="secondary-button" @click="reset">恢复默认</button>
        </div>
      </form>
    </section>
  </section>
</template>
